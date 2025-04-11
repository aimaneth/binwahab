import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { ProductStatus } from "@prisma/client";

// GET /api/admin/collections/[collectionId]/products
export async function GET(
  req: Request,
  { params }: { params: { collectionId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== "ADMIN") {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // Get query parameters for pagination and search
    const url = new URL(req.url);
    const page = parseInt(url.searchParams.get("page") || "1");
    const limit = parseInt(url.searchParams.get("limit") || "10");
    const search = url.searchParams.get("search") || "";
    const searchField = url.searchParams.get("searchField") || "name";
    const sortBy = url.searchParams.get("sortBy") || "name";
    const sortOrder = url.searchParams.get("sortOrder") || "asc";
    
    // New filter parameters
    const minPrice = parseFloat(url.searchParams.get("minPrice") || "0");
    const maxPrice = parseFloat(url.searchParams.get("maxPrice") || "1000");
    const stockFilter = url.searchParams.get("stockFilter") || "all";
    const statusFilter = url.searchParams.get("statusFilter") || "all";
    const categoryFilter = url.searchParams.get("categoryFilter") || "all";

    // Calculate pagination
    const skip = (page - 1) * limit;

    // Build search condition
    const searchCondition = search
      ? {
          [searchField]: {
            contains: search,
            mode: "insensitive",
          },
        }
      : {};

    // Build filter conditions
    const whereConditions: any = {
      price: {
        gte: minPrice,
        lte: maxPrice,
      },
    };

    // Add stock filter
    if (stockFilter === "inStock") {
      whereConditions.stock = { gt: 10 };
    } else if (stockFilter === "lowStock") {
      whereConditions.stock = { gt: 0, lte: 10 };
    } else if (stockFilter === "outOfStock") {
      whereConditions.stock = { equals: 0 };
    }

    // Add status filter
    if (statusFilter !== "all") {
      whereConditions.status = statusFilter as ProductStatus;
    }

    // Add category filter
    if (categoryFilter !== "all") {
      whereConditions.category = categoryFilter;
    }

    // Get products that belong to the collection with pagination, search, and sorting
    const [products, totalProducts] = await Promise.all([
      prisma.product.findMany({
        where: {
          ...searchCondition,
          ...whereConditions,
          collections: {
            some: {
              collectionId: params.collectionId
            }
          }
        },
        orderBy: {
          [sortBy]: sortOrder,
        },
        skip,
        take: limit,
      }),
      prisma.product.count({
        where: {
          ...searchCondition,
          ...whereConditions,
          collections: {
            some: {
              collectionId: params.collectionId
            }
          }
        },
      }),
    ]);

    // All products in the result are selected since they belong to the collection
    const selectedProductIds = products.map(product => product.id);

    return NextResponse.json({
      products,
      selectedProductIds,
      pagination: {
        total: totalProducts,
        page,
        limit,
        totalPages: Math.ceil(totalProducts / limit),
      },
    });
  } catch (error) {
    console.error("[COLLECTION_PRODUCTS_GET]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
}

// PUT /api/admin/collections/[collectionId]/products
export async function PUT(
  req: Request,
  { params }: { params: { collectionId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== "ADMIN") {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const body = await req.json();
    const schema = z.object({
      productIds: z.array(z.string()),
    });
    const { productIds } = schema.parse(body);

    // First, check if the collection exists
    const collection = await prisma.collection.findUnique({
      where: { id: params.collectionId },
    });

    if (!collection) {
      return new NextResponse("Collection not found", { status: 404 });
    }

    // Use a transaction for better performance and atomicity
    const result = await prisma.$transaction(async (tx) => {
      // Delete all existing product-collection relationships
      await tx.productCollection.deleteMany({
        where: { collectionId: params.collectionId },
      });

      // Create new product-collection relationships in batches
      if (productIds.length > 0) {
        // Process in batches of 100 for better performance
        const batchSize = 100;
        for (let i = 0; i < productIds.length; i += batchSize) {
          const batch = productIds.slice(i, i + batchSize);
          await tx.productCollection.createMany({
            data: batch.map((productId) => ({
              collectionId: params.collectionId,
              productId: parseInt(productId, 10),
            })),
          });
        }
      }

      // Return the updated collection with its products
      return tx.collection.findUnique({
        where: { id: params.collectionId },
        include: {
          products: {
            select: {
              product: {
                select: {
                  id: true,
                  name: true,
                  price: true,
                  image: true,
                }
              }
            }
          },
        },
      });
    });

    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return new NextResponse(JSON.stringify(error.errors), { status: 400 });
    }
    console.error("[COLLECTION_PRODUCTS_PUT]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: { collectionId: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "ADMIN") {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const body = await req.json();
    const { productIds } = body;

    if (!productIds || !Array.isArray(productIds)) {
      return new NextResponse("Product IDs array is required", { status: 400 });
    }

    // Use a transaction for better performance and atomicity
    const result = await prisma.$transaction(async (tx) => {
      // Delete product-collection relationships
      await tx.productCollection.deleteMany({
        where: {
          collectionId: params.collectionId,
          productId: {
            in: productIds,
          },
        },
      });

      // Fetch the updated collection with its products
      return tx.collection.findUnique({
        where: {
          id: params.collectionId,
        },
        include: {
          products: {
            select: {
              product: {
                select: {
                  id: true,
                  name: true,
                  price: true,
                  image: true,
                }
              }
            }
          },
        },
      });
    });

    if (!result) {
      return new NextResponse("Collection not found", { status: 404 });
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("[COLLECTION_PRODUCTS_DELETE]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
} 