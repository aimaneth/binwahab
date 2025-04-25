import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { redis } from "@/lib/redis";
import type { Redis } from "ioredis";

const BATCH_SIZE = 100;
const CACHE_TTL = 300; // 5 minutes

type BulkVariantOperation = {
  id?: number;
  name: string;
  sku: string;
  price: number;
  stock: number;
  options?: Record<string, any>;
  inventoryTracking?: boolean;
  lowStockThreshold?: number;
};

type BulkOperationResult = {
  success: boolean;
  id?: number;
  name?: string;
  error?: string;
};

export async function POST(
  request: Request,
  { params }: { params: { productId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== "ADMIN") {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { operation, variants } = await request.json();
    const productId = parseInt(params.productId);

    if (!operation || !variants || !Array.isArray(variants)) {
      return new NextResponse("Invalid request body", { status: 400 });
    }

    // Generate operation ID for tracking
    const operationId = `bulk_variant_${operation}_${Date.now()}`;
    
    // Start background processing
    processBulkOperation(operationId, operation, variants, productId).catch(console.error);

    return NextResponse.json({ 
      success: true, 
      operationId,
      message: "Bulk variant operation started" 
    });
  } catch (error) {
    console.error("[BULK_VARIANTS_POST]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
}

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

    return new NextResponse("Missing operationId or Redis not available", { status: 400 });
  } catch (error) {
    console.error("[BULK_VARIANTS_GET]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { productId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== "ADMIN") {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { variantIds } = await request.json();
    const productId = parseInt(params.productId);

    if (!variantIds || !Array.isArray(variantIds) || variantIds.length === 0) {
      return new NextResponse("Invalid request body", { status: 400 });
    }

    // Validate that all IDs are numbers
    const validIds = variantIds.map(id => Number(id)).filter(id => !isNaN(id));
    if (validIds.length !== variantIds.length) {
      return new NextResponse("Invalid variant IDs", { status: 400 });
    }

    try {
      // Delete variants in batches
      for (let i = 0; i < validIds.length; i += BATCH_SIZE) {
        const batch = validIds.slice(i, i + BATCH_SIZE);
        await prisma.productVariant.deleteMany({
          where: {
            id: { in: batch },
            productId: productId,
          },
        });
      }

      return new NextResponse(null, { status: 204 });
    } catch (dbError) {
      console.error("[BULK_VARIANTS_DELETE_DB]", dbError);
      return new NextResponse("Database error", { status: 500 });
    }
  } catch (error) {
    console.error("[BULK_VARIANTS_DELETE]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
}

async function processBulkOperation(
  operationId: string, 
  operation: string, 
  variants: BulkVariantOperation[], 
  productId: number
) {
  let results: BulkOperationResult[] = [];
  let processed = 0;
  const total = variants.length;

  try {
    switch (operation) {
      case "create":
        results = await createVariants(variants, productId, operationId, updateProgress);
        break;
      case "update":
        results = await updateVariants(variants, productId, operationId, updateProgress);
        break;
      case "delete":
        results = await deleteVariants(variants, productId, operationId, updateProgress);
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

async function createVariants(
  variants: BulkVariantOperation[],
  productId: number,
  operationId: string,
  progressCallback: (operationId: string, processed: number, total: number) => Promise<void>
): Promise<BulkOperationResult[]> {
  const results: BulkOperationResult[] = [];
  const total = variants.length;

  // Process in batches
  for (let i = 0; i < variants.length; i += BATCH_SIZE) {
    const batch = variants.slice(i, i + BATCH_SIZE);
    
    await prisma.$transaction(async (tx) => {
      for (const variant of batch) {
        try {
          const newVariant = await tx.productVariant.create({
            data: {
              name: variant.name,
              sku: variant.sku,
              price: new Prisma.Decimal(variant.price),
              stock: variant.stock,
              options: variant.options || {},
              productId: productId,
              inventoryTracking: variant.inventoryTracking ?? true,
              lowStockThreshold: variant.lowStockThreshold ?? 5,
            },
          });
          
          results.push({ success: true, id: newVariant.id, name: newVariant.name });
        } catch (error) {
          results.push({ success: false, name: variant.name, error: (error as Error).message });
        }
      }
    });
    
    await progressCallback(operationId, i + batch.length, total);
  }

  return results;
}

async function updateVariants(
  variants: BulkVariantOperation[],
  productId: number,
  operationId: string,
  progressCallback: (operationId: string, processed: number, total: number) => Promise<void>
): Promise<BulkOperationResult[]> {
  const results: BulkOperationResult[] = [];
  const total = variants.length;

  for (let i = 0; i < variants.length; i += BATCH_SIZE) {
    const batch = variants.slice(i, i + BATCH_SIZE);
    
    await prisma.$transaction(async (tx) => {
      for (const variant of batch) {
        try {
          if (!variant.id) {
            throw new Error("Variant ID is required for update operation");
          }
          const variantId = Number(variant.id);
          if (isNaN(variantId)) {
            throw new Error("Invalid variant ID");
          }
          const updatedVariant = await tx.productVariant.update({
            where: {
              id: variantId,
              productId: productId,
            },
            data: {
              name: variant.name,
              sku: variant.sku,
              price: new Prisma.Decimal(variant.price),
              stock: variant.stock,
              options: variant.options,
              inventoryTracking: variant.inventoryTracking,
              lowStockThreshold: variant.lowStockThreshold,
            },
          });
          
          results.push({ success: true, id: updatedVariant.id, name: updatedVariant.name });
        } catch (error) {
          results.push({ 
            success: false, 
            id: variant.id, 
            name: variant.name, 
            error: (error as Error).message 
          });
        }
      }
    });
    
    await progressCallback(operationId, i + batch.length, total);
  }

  return results;
}

async function deleteVariants(
  variants: BulkVariantOperation[],
  productId: number,
  operationId: string,
  progressCallback: (operationId: string, processed: number, total: number) => Promise<void>
): Promise<BulkOperationResult[]> {
  const results: BulkOperationResult[] = [];
  const total = variants.length;

  for (let i = 0; i < variants.length; i += BATCH_SIZE) {
    const batch = variants.slice(i, i + BATCH_SIZE);
    
    await prisma.$transaction(async (tx) => {
      for (const variant of batch) {
        try {
          if (!variant.id) {
            throw new Error("Variant ID is required for delete operation");
          }
          const variantId = Number(variant.id);
          if (isNaN(variantId)) {
            throw new Error("Invalid variant ID");
          }
          const deletedVariant = await tx.productVariant.delete({
            where: {
              id: variantId,
              productId: productId,
            },
          });
          
          results.push({ success: true, id: deletedVariant.id, name: deletedVariant.name });
        } catch (error) {
          results.push({ 
            success: false, 
            id: variant.id, 
            name: variant.name, 
            error: (error as Error).message 
          });
        }
      }
    });
    
    await progressCallback(operationId, i + batch.length, total);
  }

  return results;
} 