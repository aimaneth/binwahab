import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ProductStatus } from "@prisma/client";

// GET /api/admin/collections/[collectionId]/preview
export async function GET(
  req: Request,
  { params }: { params: { collectionId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== "ADMIN") {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // Get query parameters for pagination
    const url = new URL(req.url);
    const page = parseInt(url.searchParams.get("page") || "1");
    const limit = parseInt(url.searchParams.get("limit") || "12");
    const preview = url.searchParams.get("preview") === "true";

    // Calculate pagination
    const skip = (page - 1) * limit;

    // First, check if the collection exists
    const collection = await prisma.collection.findUnique({
      where: { id: params.collectionId },
    });

    if (!collection) {
      return new NextResponse("Collection not found", { status: 404 });
    }

    let products = [];
    let totalProducts = 0;

    if (collection.type === "MANUAL") {
      // For manual collections, get the products directly from the collection
      const result = await prisma.productCollection.findMany({
        where: { collectionId: params.collectionId },
        include: {
          product: true,
        },
        skip,
        take: limit,
        orderBy: {
          product: {
            name: "asc",
          },
        },
      });

      products = result.map((pc) => pc.product);
      totalProducts = await prisma.productCollection.count({
        where: { collectionId: params.collectionId },
      });
    } else {
      // For automated collections, apply the rules to find matching products
      const conditions = collection.conditions as any;
      
      // Build the where conditions based on the collection rules
      const whereConditions: any = {
        status: ProductStatus.ACTIVE, // Only show active products in preview
      };

      // Apply price range filter if specified
      if (conditions?.price?.min !== undefined) {
        whereConditions.price = {
          ...whereConditions.price,
          gte: conditions.price.min,
        };
      }
      if (conditions?.price?.max !== undefined) {
        whereConditions.price = {
          ...whereConditions.price,
          lte: conditions.price.max,
        };
      }

      // Apply stock filter if specified
      if (conditions?.stock?.min !== undefined) {
        whereConditions.stock = {
          ...whereConditions.stock,
          gte: conditions.stock.min,
        };
      }
      if (conditions?.stock?.max !== undefined) {
        whereConditions.stock = {
          ...whereConditions.stock,
          lte: conditions.stock.max,
        };
      }

      // Apply category filter if specified
      if (conditions?.category) {
        whereConditions.category = conditions.category;
      }

      // Get products that match the conditions
      products = await prisma.product.findMany({
        where: whereConditions,
        skip,
        take: limit,
        orderBy: {
          name: "asc",
        },
      });

      totalProducts = await prisma.product.count({
        where: whereConditions,
      });
    }

    // If this is a preview request, add mock analytics data
    if (preview) {
      products = products.map((product) => ({
        ...product,
        views: Math.floor(Math.random() * 1000),
        clicks: Math.floor(Math.random() * 100),
        conversions: Math.floor(Math.random() * 20),
      }));
    }

    return NextResponse.json({
      products,
      pagination: {
        total: totalProducts,
        page,
        limit,
        totalPages: Math.ceil(totalProducts / limit),
      },
    });
  } catch (error) {
    console.error("[COLLECTION_PREVIEW_GET]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
}

// POST /api/admin/collections/[collectionId]/preview
export async function POST(
  req: Request,
  { params }: { params: { collectionId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== "ADMIN") {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const body = await req.json();
    const { conditions, limit = 12 } = body;

    // First, check if the collection exists
    const collection = await prisma.collection.findUnique({
      where: { id: params.collectionId },
    });

    if (!collection) {
      return new NextResponse("Collection not found", { status: 404 });
    }

    // Build the where clause based on conditions
    const whereClause: any = {
      status: ProductStatus.ACTIVE,
    };

    if (conditions) {
      // Price range filter
      if (conditions.minPrice !== undefined) {
        whereClause.price = {
          ...whereClause.price,
          gte: parseFloat(conditions.minPrice),
        };
      }
      if (conditions.maxPrice !== undefined) {
        whereClause.price = {
          ...whereClause.price,
          lte: parseFloat(conditions.maxPrice),
        };
      }

      // Stock filter
      if (conditions.stockFilter) {
        if (conditions.stockFilter === "inStock") {
          whereClause.stock = { gt: 10 };
        } else if (conditions.stockFilter === "lowStock") {
          whereClause.stock = { gt: 0, lte: 10 };
        } else if (conditions.stockFilter === "outOfStock") {
          whereClause.stock = { equals: 0 };
        }
      }

      // Category filter
      if (conditions.categoryFilter && conditions.categoryFilter !== "all") {
        whereClause.categoryId = conditions.categoryFilter;
      }
    }

    // Get products that match the conditions
    const products = await prisma.product.findMany({
      where: whereClause,
      include: {
        category: {
          select: {
            name: true,
          },
        },
      },
      take: limit,
    });

    // For preview purposes, add mock analytics data
    const productsWithAnalytics = products.map(product => ({
      ...product,
      views: Math.floor(Math.random() * 1000),
      clicks: Math.floor(Math.random() * 100),
      conversions: Math.floor(Math.random() * 10),
    }));

    return NextResponse.json({
      products: productsWithAnalytics,
      total: products.length,
    });
  } catch (error) {
    console.error("[COLLECTION_PREVIEW_POST]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
} 