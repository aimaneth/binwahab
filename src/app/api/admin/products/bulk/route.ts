import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ProductStatus } from "@prisma/client";
import { parse } from "csv-parse/sync";
import { stringify } from "csv-stringify/sync";

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

    let results = [];

    switch (operation) {
      case "import":
        results = await importProducts(records);
        break;
      case "status_update":
        results = await updateProductStatus(records);
        break;
      case "category_assignment":
        results = await assignCategories(records);
        break;
      case "price_update":
        results = await updatePrices(records);
        break;
      case "variant_creation":
        results = await createVariants(records);
        break;
      default:
        return new NextResponse("Invalid operation", { status: 400 });
    }

    return NextResponse.json({ success: true, results });
  } catch (error) {
    console.error("[BULK_PRODUCTS_POST]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
}

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== "ADMIN") {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type") || "all";
    const format = searchParams.get("format") || "csv";

    let products = [];
    let fields = [];

    switch (type) {
      case "all":
        products = await prisma.product.findMany({
          include: {
            category: true,
            variants: true,
            attributes: true,
          },
        });
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
        });
        fields = [
          "id",
          "productId",
          "productName",
          "sku",
          "price",
          "stock",
          "attributes",
        ];
        break;
      default:
        return new NextResponse("Invalid type", { status: 400 });
    }

    // Transform data for export
    const exportData = products.map((product) => {
      const data: Record<string, any> = {};
      
      fields.forEach((field) => {
        if (field === "categoryName") {
          data[field] = product.category?.name || "";
        } else if (field === "attributes" && "attributes" in product) {
          data[field] = JSON.stringify(product.attributes);
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

// Helper functions for bulk operations
async function importProducts(records: any[]) {
  const results = [];
  
  for (const record of records) {
    try {
      const product = await prisma.product.create({
        data: {
          name: record.name,
          description: record.description,
          price: parseFloat(record.price),
          stock: parseInt(record.stock),
          status: record.status as ProductStatus || ProductStatus.DRAFT,
          categoryId: record.categoryId,
          sku: record.sku,
          barcode: record.barcode,
          weight: record.weight ? parseFloat(record.weight) : null,
          dimensions: record.dimensions ? JSON.parse(record.dimensions) : null,
          isBundle: record.isBundle === "true",
          bundleDiscount: record.bundleDiscount ? parseFloat(record.bundleDiscount) : null,
        },
      });
      
      results.push({ success: true, id: product.id, name: product.name });
    } catch (error) {
      results.push({ success: false, name: record.name, error: (error as Error).message });
    }
  }
  
  return results;
}

async function updateProductStatus(records: any[]) {
  const results = [];
  
  for (const record of records) {
    try {
      const product = await prisma.product.update({
        where: { id: record.id },
        data: { status: record.status as ProductStatus },
      });
      
      results.push({ success: true, id: product.id, name: product.name });
    } catch (error) {
      results.push({ success: false, id: record.id, error: (error as Error).message });
    }
  }
  
  return results;
}

async function assignCategories(records: any[]) {
  const results = [];
  
  for (const record of records) {
    try {
      const product = await prisma.product.update({
        where: { id: record.id },
        data: { categoryId: record.categoryId },
      });
      
      results.push({ success: true, id: product.id, name: product.name });
    } catch (error) {
      results.push({ success: false, id: record.id, error: (error as Error).message });
    }
  }
  
  return results;
}

async function updatePrices(records: any[]) {
  const results = [];
  
  for (const record of records) {
    try {
      const product = await prisma.product.update({
        where: { id: record.id },
        data: { price: parseFloat(record.price) },
      });
      
      results.push({ success: true, id: product.id, name: product.name });
    } catch (error) {
      results.push({ success: false, id: record.id, error: (error as Error).message });
    }
  }
  
  return results;
}

async function createVariants(records: any[]) {
  const results = [];
  
  for (const record of records) {
    try {
      const attributes = record.attributes ? JSON.parse(record.attributes) : {};
      
      const variant = await prisma.productVariant.create({
        data: {
          productId: record.productId,
          sku: record.sku,
          price: parseFloat(record.price),
          stock: parseInt(record.stock),
          attributes,
        },
      });
      
      results.push({ success: true, id: variant.id, sku: variant.sku });
    } catch (error) {
      results.push({ success: false, productId: record.productId, error: (error as Error).message });
    }
  }
  
  return results;
} 