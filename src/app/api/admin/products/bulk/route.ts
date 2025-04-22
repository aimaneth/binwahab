import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ProductStatus, Product, ProductVariant, Prisma } from "@prisma/client";
import { parse } from "csv-parse/sync";
import { stringify } from "csv-stringify/sync";
import { redis } from "@/lib/redis";

const BATCH_SIZE = 100;
const CACHE_TTL = 300; // 5 minutes

type ProductWithRelations = Product & {
  category: { name: string } | null;
  variants: ProductVariant[];
};

type ProductVariantWithProduct = ProductVariant & {
  product: Product;
};

type BulkOperationResult = {
  success: boolean;
  id?: string | number;
  name?: string;
  error?: string;
};

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== "ADMIN") {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File;
    const operation = formData.get("operation") as string;

    if (!file || !operation) {
      return new NextResponse("Missing required fields", { status: 400 });
    }

    const fileContent = await file.text();
    const records = parse(fileContent, {
      columns: true,
      skip_empty_lines: true,
    });

    // Generate operation ID for tracking
    const operationId = `bulk_${operation}_${Date.now()}`;
    
    // Start background processing
    processBulkOperation(operationId, operation, records).catch(console.error);

    return NextResponse.json({ 
      success: true, 
      operationId,
      message: "Bulk operation started" 
    });
  } catch (error) {
    console.error("[BULK_PRODUCTS_POST]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
}

// Status endpoint to check operation progress
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const operationId = searchParams.get("operationId");
    
    if (operationId && redis) {
      const status = await redis.get(`bulk_op:${operationId}`);
      if (status) {
        return NextResponse.json(JSON.parse(status));
      }
      return new NextResponse("Operation not found", { status: 404 });
    }

    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== "ADMIN") {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { searchParams: originalSearchParams } = new URL(request.url);
    const type = originalSearchParams.get("type") || "all";
    const format = originalSearchParams.get("format") || "csv";

    let products: (ProductWithRelations | ProductVariantWithProduct)[] = [];
    let fields: string[] = [];

    switch (type) {
      case "all":
        products = await prisma.product.findMany({
          include: {
            category: true,
            variants: true,
          },
        }) as ProductWithRelations[];
        fields = [
          "id",
          "name",
          "description",
          "price",
          "stock",
          "status",
          "categoryId",
          "categoryName",
          "sku",
          "barcode",
          "weight",
          "dimensions",
          "isBundle",
          "bundleDiscount",
          "createdAt",
          "updatedAt",
        ];
        break;
      case "variants":
        products = await prisma.productVariant.findMany({
          include: {
            product: true,
          },
        }) as ProductVariantWithProduct[];
        fields = [
          "id",
          "productId",
          "productName",
          "sku",
          "price",
          "stock",
          "options",
        ];
        break;
      default:
        return new NextResponse("Invalid type", { status: 400 });
    }

    // Transform data for export
    const exportData = products.map((product) => {
      const data: Record<string, any> = {};
      
      fields.forEach((field) => {
        if (field === "categoryName" && "category" in product) {
          data[field] = (product as ProductWithRelations).category?.name || "";
        } else if (field === "productName" && "product" in product) {
          data[field] = (product as ProductVariantWithProduct).product.name;
        } else if (field === "options" && "options" in product) {
          data[field] = JSON.stringify((product as ProductVariantWithProduct).options);
        } else {
          data[field] = product[field as keyof typeof product] || "";
        }
      });
      
      return data;
    });

    // Generate CSV
    const csv = stringify(exportData, {
      header: true,
      columns: fields,
    });

    // Return as downloadable file
    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename=products-${type}-${new Date().toISOString()}.csv`,
      },
    });
  } catch (error) {
    console.error("[BULK_PRODUCTS_GET]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
}

async function processBulkOperation(operationId: string, operation: string, records: any[]) {
  let results: BulkOperationResult[] = [];
  let processed = 0;
  const total = records.length;

  try {
    switch (operation) {
      case "import":
        results = await importProducts(records, operationId, updateProgress);
        break;
      case "status_update":
        results = await updateProductStatus(records, operationId, updateProgress);
        break;
      case "category_assignment":
        results = await assignCategories(records, operationId, updateProgress);
        break;
      case "price_update":
        results = await updatePrices(records, operationId, updateProgress);
        break;
      case "variant_creation":
        results = await createVariants(records, operationId, updateProgress);
        break;
    }

    // Store final results if Redis is available
    if (redis) {
      await redis.setex(
        `bulk_op:${operationId}`,
        CACHE_TTL,
        JSON.stringify({
          status: "completed",
          processed: total,
          total,
          results
        })
      );
    }
  } catch (error) {
    if (redis) {
      await redis.setex(
        `bulk_op:${operationId}`,
        CACHE_TTL,
        JSON.stringify({
          status: "failed",
          processed,
          total,
          error: (error as Error).message
        })
      );
    }
  }
}

async function updateProgress(operationId: string, processed: number, total: number) {
  if (redis) {
    await redis.setex(
      `bulk_op:${operationId}`,
      CACHE_TTL,
      JSON.stringify({
        status: "processing",
        processed,
        total
      })
    );
  }
}

async function importProducts(
  records: any[], 
  operationId: string,
  progressCallback: (operationId: string, processed: number, total: number) => Promise<void>
): Promise<BulkOperationResult[]> {
  const results: BulkOperationResult[] = [];
  const total = records.length;
  
  // Process in batches
  for (let i = 0; i < records.length; i += BATCH_SIZE) {
    const batch = records.slice(i, i + BATCH_SIZE);
    
    await prisma.$transaction(async (tx) => {
      for (const record of batch) {
        try {
          const productData = {
            name: record.name,
            description: record.description,
            handle: record.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
            price: new Prisma.Decimal(record.price),
            stock: parseInt(record.stock),
            status: record.status as ProductStatus,
            categoryId: record.categoryId,
          };
          
          const product = await tx.product.create({
            data: productData,
          });
          
          results.push({ success: true, id: product.id, name: product.name });
        } catch (error) {
          results.push({ success: false, name: record.name, error: (error as Error).message });
        }
      }
    });
    
    await progressCallback(operationId, i + batch.length, total);
  }
  
  return results;
}

async function updateProductStatus(
  records: any[],
  operationId: string,
  progressCallback: (operationId: string, processed: number, total: number) => Promise<void>
): Promise<BulkOperationResult[]> {
  const results: BulkOperationResult[] = [];
  const total = records.length;
  
  for (let i = 0; i < records.length; i += BATCH_SIZE) {
    const batch = records.slice(i, i + BATCH_SIZE);
    
    await prisma.$transaction(async (tx) => {
      for (const record of batch) {
        try {
          const product = await tx.product.update({
            where: { id: record.id },
            data: { status: record.status as ProductStatus },
          });
          
          results.push({ success: true, id: product.id, name: product.name });
        } catch (error) {
          results.push({ success: false, id: record.id, error: (error as Error).message });
        }
      }
    });
    
    await progressCallback(operationId, i + batch.length, total);
  }
  
  return results;
}

async function assignCategories(
  records: any[],
  operationId: string,
  progressCallback: (operationId: string, processed: number, total: number) => Promise<void>
): Promise<BulkOperationResult[]> {
  const results: BulkOperationResult[] = [];
  const total = records.length;
  
  for (let i = 0; i < records.length; i += BATCH_SIZE) {
    const batch = records.slice(i, i + BATCH_SIZE);
    
    await prisma.$transaction(async (tx) => {
      for (const record of batch) {
        try {
          const product = await tx.product.update({
            where: { id: record.id },
            data: { categoryId: record.categoryId },
          });
          
          results.push({ success: true, id: product.id, name: product.name });
        } catch (error) {
          results.push({ success: false, id: record.id, error: (error as Error).message });
        }
      }
    });
    
    await progressCallback(operationId, i + batch.length, total);
  }
  
  return results;
}

async function updatePrices(
  records: any[],
  operationId: string,
  progressCallback: (operationId: string, processed: number, total: number) => Promise<void>
): Promise<BulkOperationResult[]> {
  const results: BulkOperationResult[] = [];
  const total = records.length;
  
  for (let i = 0; i < records.length; i += BATCH_SIZE) {
    const batch = records.slice(i, i + BATCH_SIZE);
    
    await prisma.$transaction(async (tx) => {
      for (const record of batch) {
        try {
          const product = await tx.product.update({
            where: { id: record.id },
            data: { price: new Prisma.Decimal(record.price) },
          });
          
          results.push({ success: true, id: product.id, name: product.name });
        } catch (error) {
          results.push({ success: false, id: record.id, error: (error as Error).message });
        }
      }
    });
    
    await progressCallback(operationId, i + batch.length, total);
  }
  
  return results;
}

async function createVariants(
  records: any[],
  operationId: string,
  progressCallback: (operationId: string, processed: number, total: number) => Promise<void>
): Promise<BulkOperationResult[]> {
  const results: BulkOperationResult[] = [];
  const total = records.length;
  
  for (let i = 0; i < records.length; i += BATCH_SIZE) {
    const batch = records.slice(i, i + BATCH_SIZE);
    
    await prisma.$transaction(async (tx) => {
      for (const record of batch) {
        try {
          const variant = await tx.productVariant.create({
            data: {
              name: record.name,
              sku: record.sku,
              price: new Prisma.Decimal(record.price),
              stock: parseInt(record.stock),
              options: record.options ? JSON.parse(record.options) : {},
              productId: parseInt(record.productId),
              inventoryTracking: record.inventoryTracking !== "false",
              lowStockThreshold: record.lowStockThreshold ? parseInt(record.lowStockThreshold) : 5,
            },
          });
          
          results.push({ success: true, id: variant.id, name: variant.name });
        } catch (error) {
          results.push({ success: false, name: record.name, error: (error as Error).message });
        }
      }
    });
    
    await progressCallback(operationId, i + batch.length, total);
  }
  
  return results;
} 