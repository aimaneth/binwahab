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

    const products = await prisma.$queryRaw`
      SELECT 
        p.*,
        c.id as "categoryId",
        c.name as "categoryName",
        pc."collectionId",
        col.name as "collectionName",
        pi.id as "imageId",
        pi.url as "imageUrl",
        pi.order as "imageOrder",
        pv.id as "variantId",
        pv.name as "variantName",
        pv.price as "variantPrice",
        pv.sku as "variantSku"
      FROM "Product" p
      LEFT JOIN "Category" c ON p."categoryId" = c.id
      LEFT JOIN "ProductCollection" pc ON p.id = pc."productId"
      LEFT JOIN "Collection" col ON pc."collectionId" = col.id
      LEFT JOIN "ProductImage" pi ON p.id = pi."productId"
      LEFT JOIN "ProductVariant" pv ON p.id = pv."productId"
      ORDER BY p."createdAt" DESC
    `;

    return NextResponse.json(products);
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
    
    // Log the data being sent to Prisma
    const prismaData = {
      ...productData,
      // Set default values for isActive and status
      isActive: true,
      status: "ACTIVE" as const,
      // Set the main image as the first image if available
      image: images && images.length > 0 ? images[0] : null,
      // Connect the category using categoryId
      category: {
        connect: { id: categoryId }
      },
      collections: collectionIds ? {
        create: collectionIds.map(collectionId => ({
          collection: {
            connect: { id: collectionId }
          }
        }))
      } : undefined,
      // Create product images if they exist
      ...(images && images.length > 0 ? {
        images: {
          create: images.map((url, index) => ({
            url,
            order: index
          }))
        }
      } : {})
    };
    
    console.log("Data being sent to Prisma:", prismaData);

    // Create the product first
    const product = await prisma.product.create({
      data: prismaData,
      include: {
        category: true,
        collections: {
          include: {
            collection: true,
          },
        },
        variants: true,
        images: true
      },
    });

    return NextResponse.json(product);
  } catch (error) {
    console.error("[PRODUCTS_POST] Detailed error:", error);
    
    // Log the full error object
    console.error("Full error object:", JSON.stringify(error, Object.getOwnPropertyNames(error)));
    
    if (error instanceof z.ZodError) {
      return new NextResponse(JSON.stringify({
        message: "Validation error",
        errors: error.errors
      }), { status: 400 });
    }
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      return new NextResponse(JSON.stringify({
        message: "Database error",
        code: error.code,
      }), { status: 400 });
    }
    
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