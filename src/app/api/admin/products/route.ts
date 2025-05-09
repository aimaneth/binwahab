export const dynamic = 'force-dynamic';

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { Prisma, Product, ProductVariant, ProductCollection } from "@prisma/client";

type ProductWithRelations = Product & {
  category: { id: string; name: string } | null;
  collections: (ProductCollection & {
    collection: { id: string; name: string };
  })[];
  variants: ProductVariant[];
  images: {
    id: number;
    url: string;
    order: number;
    productId: number;
    createdAt: Date;
    updatedAt: Date;
  }[];
};

// Schema for product validation
const productSchema = z.object({
  name: z.string().min(1),
  slug: z.string().min(1).optional(),
  description: z.string().min(1),
  price: z.number().positive(),
  images: z.array(z.string()).optional(),
  stock: z.number().int().min(0).optional(),
  featured: z.boolean().optional(),
  categoryId: z.string(),
  collectionIds: z.array(z.string()).optional(),
  status: z.enum(["DRAFT", "ACTIVE", "ARCHIVED"]).optional(),
  // Fields that are not in the Product model but might be used in the form
  sku: z.string().optional(),
  barcode: z.string().optional(),
  weight: z.number().min(0).optional(),
  weightUnit: z.string().optional(),
  dimensions: z.object({
    length: z.number().min(0),
    width: z.number().min(0),
    height: z.number().min(0),
  }).optional(),
  seoTitle: z.string().optional(),
  seoDescription: z.string().optional(),
  seoKeywords: z.string().optional(),
  tags: z.array(z.string()).optional(),
  taxRate: z.number().min(0).optional(),
  compareAtPrice: z.number().min(0).optional(),
  costPrice: z.number().min(0).optional(),
  inventoryTracking: z.boolean().optional(),
  lowStockThreshold: z.number().int().min(0).optional(),
});

// GET /api/admin/products
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== "ADMIN") {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const products = await prisma.product.findMany({
      include: {
        category: {
          select: {
            id: true,
            name: true
          }
        },
        images: {
          orderBy: {
            order: 'asc'
          }
        },
        variants: {
          select: {
            id: true,
            name: true,
            sku: true,
            price: true,
            stock: true,
            options: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Transform the products to include formatted variant information
    const transformedProducts = products.map(product => ({
      ...product,
      variants: product.variants.map(variant => ({
        ...variant,
        options: variant.options as Record<string, string>
      }))
    }));

    return NextResponse.json(transformedProducts);
  } catch (error) {
    console.error("[PRODUCTS_GET] Detailed error:", error);
    
    return new NextResponse(
      JSON.stringify({
        message: "Internal server error",
        error: error instanceof Error ? error.message : "Unknown error",
        stack: error instanceof Error ? error.stack : undefined,
      }),
      { 
        status: 500,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
  }
}

// POST /api/admin/products
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== "ADMIN") {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const body = await req.json();
    console.log("Received request body:", body);
    
    const validatedData = productSchema.parse(body);
    console.log("Validated data:", validatedData);

    const { collectionIds, images, slug, featured, categoryId, sku, barcode, weight, weightUnit, dimensions, seoTitle, seoDescription, seoKeywords, tags, taxRate, compareAtPrice, costPrice, inventoryTracking, lowStockThreshold, ...productData } = validatedData;
    
    // Ensure status is a valid ProductStatus value
    if (productData.status && !["DRAFT", "ACTIVE", "ARCHIVED"].includes(productData.status)) {
      productData.status = "DRAFT";
    }

    // Create the base product first
    const baseProduct = await prisma.product.create({
      data: {
        ...productData,
        handle: productData.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'), // Generate handle from name
        isActive: true,
        status: "ACTIVE" as const,
        image: images && images.length > 0 ? images[0] : null,
        category: categoryId ? {
          connect: { id: categoryId }
        } : undefined,
      },
    });

    // Then create product images if they exist
    if (images && images.length > 0) {
      await prisma.$executeRaw`
        INSERT INTO "ProductImage" ("url", "order", "productId", "createdAt", "updatedAt")
        VALUES ${Prisma.join(
          images.map((url, index) => 
            Prisma.sql`(${url}, ${index}, ${baseProduct.id}, NOW(), NOW())`
          )
        )}
      `;
    }

    // Finally create collection relationships if they exist
    if (collectionIds && collectionIds.length > 0) {
      await prisma.productCollection.createMany({
        data: collectionIds.map(collectionId => ({
          productId: baseProduct.id,
          collectionId: collectionId
        }))
      });
    }

    // Return the complete product with all relations
    const product = await prisma.product.findUnique({
      where: { id: baseProduct.id },
      include: {
        category: true,
        collections: {
          include: {
            collection: true,
          },
        },
        variants: true
      },
    });

    // Get the images separately
    const productImages = await prisma.$queryRaw`
      SELECT id, url, "order", "productId", "createdAt", "updatedAt"
      FROM "ProductImage"
      WHERE "productId" = ${baseProduct.id}
      ORDER BY "order" ASC
    `;

    return NextResponse.json({
      ...product,
      images: productImages
    });
  } catch (error) {
    console.error("[PRODUCTS_POST] Detailed error:", error);
    
    if (error instanceof z.ZodError) {
      return new NextResponse(JSON.stringify({
        message: "Validation error",
        errors: error.errors
      }), { 
        status: 400,
        headers: {
          'Content-Type': 'application/json',
        },
      });
    }

    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      return new NextResponse(JSON.stringify({
        message: "Database error",
        code: error.code,
        meta: error.meta,
      }), { 
        status: 400,
        headers: {
          'Content-Type': 'application/json',
        },
      });
    }
    
    return new NextResponse(
      JSON.stringify({
        message: "Internal server error",
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      { 
        status: 500,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
  }
}

// PATCH /api/admin/products/bulk
export async function PATCH(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== "ADMIN") {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const body = await req.json();
    const { ids, action, data } = body;

    if (!ids || !Array.isArray(ids) || ids.length === 0 || !action) {
      return new NextResponse("Invalid request", { status: 400 });
    }

    let result;

    switch (action) {
      case "delete":
        result = await prisma.product.deleteMany({
          where: {
            id: { in: ids },
          },
        });
        return NextResponse.json({ success: true, count: result.count });

      case "update":
        if (!data) {
          return new NextResponse("Update data is required", { status: 400 });
        }
        
        // Validate update data
        const updateSchema = z.object({
          featured: z.boolean().optional(),
          stock: z.number().int().min(0).optional(),
          price: z.number().positive().optional(),
          categoryId: z.string().optional(),
        });
        
        const validatedData = updateSchema.parse(data);
        
        result = await prisma.product.updateMany({
          where: {
            id: { in: ids },
          },
          data: validatedData,
        });
        
        return NextResponse.json({ success: true, count: result.count });

      default:
        return new NextResponse(`Invalid action: ${action}`, { status: 400 });
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return new NextResponse(JSON.stringify(error.errors), { status: 400 });
    }
    console.error("[PRODUCTS_BULK_PATCH]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
} 