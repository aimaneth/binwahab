import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { CollectionSortOption, CollectionType, DisplaySection } from "@prisma/client";

const collectionSchema = z.object({
  name: z.string().min(1),
  handle: z.string().optional(),
  description: z.string().optional(),
  descriptionHtml: z.string().optional(),
  image: z.string().optional(),
  image2: z.string().optional(),
  type: z.enum(["MANUAL", "AUTOMATED"]).default("MANUAL"),
  conditions: z.record(z.any()).optional(),
  isActive: z.boolean().optional(),
  order: z.number().int().optional(),
  seoTitle: z.string().optional(),
  seoDescription: z.string().optional(),
  seoKeywords: z.string().optional(),
  showOnHomePage: z.boolean().optional(),
  displaySection: z.enum(["NONE", "FEATURED", "COMPLETE"]).optional(),
  sortBy: z.nativeEnum(CollectionSortOption).default(CollectionSortOption.MANUAL),
});

// Helper function to build Prisma where clause from conditions
function buildWhereClause(conditions: any) {
  if (!conditions || !conditions.rules || conditions.rules.length === 0) {
    return {};
  }

  const whereConditions = conditions.rules.map((rule: any) => {
    switch (rule.field) {
      case "price":
        return {
          price: {
            [getOperator(rule.operator)]: parseFloat(rule.value)
          }
        };
      case "stock":
        return {
          stock: {
            [getOperator(rule.operator)]: parseInt(rule.value)
          }
        };
      case "category":
        return {
          categoryId: rule.value
        };
      case "tag":
        return {
          tags: {
            has: rule.value
          }
        };
      default:
        return {};
    }
  });

  return {
    AND: conditions.operator === "AND" ? whereConditions : undefined,
    OR: conditions.operator === "OR" ? whereConditions : undefined,
  };
}

// Helper function to convert operator strings to Prisma operators
function getOperator(operator: string) {
  switch (operator) {
    case "equals":
      return "equals";
    case "greater_than":
      return "gt";
    case "less_than":
      return "lt";
    case "greater_than_or_equal":
      return "gte";
    case "less_than_or_equal":
      return "lte";
    default:
      return "equals";
  }
}

// GET /api/admin/collections
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== "ADMIN") {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const collections = await prisma.collection.findMany({
      include: {
        products: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                price: true,
                image: true,
              },
            },
          },
        },
      },
      orderBy: {
        order: 'asc',
      },
    });

    // Transform the data to match the expected format
    const transformedCollections = collections.map(collection => ({
      ...collection,
      products: collection.products.map(pc => pc.product),
    }));

    return NextResponse.json(transformedCollections);
  } catch (error) {
    console.error("[COLLECTIONS_GET]", error);
    return new NextResponse(
      JSON.stringify({ error: "Failed to fetch collections" }), 
      { status: 500 }
    );
  }
}

// POST /api/admin/collections
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== "ADMIN") {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const body = await req.json();
    console.log("Received collection data:", body);
    
    const validatedData = collectionSchema.parse(body);
    console.log("Validated collection data:", validatedData);
    
    // Generate handle from name if not provided
    const handle = validatedData.handle || validatedData.name.toLowerCase().replace(/\s+/g, '-');
    
    // Create the collection with proper type casting
    const collection = await prisma.collection.create({
      data: {
        ...validatedData,
        handle,
        type: validatedData.type as CollectionType,
        displaySection: (validatedData.displaySection || "NONE") as DisplaySection,
        sortBy: validatedData.sortBy as CollectionSortOption,
      },
    });

    console.log("Collection created successfully:", collection);

    // If it's an automated collection, add products based on conditions
    if (validatedData.type === "AUTOMATED" && validatedData.conditions) {
      const whereClause = buildWhereClause(validatedData.conditions);
      const products = await prisma.product.findMany({
        where: whereClause,
      });

      if (products.length > 0) {
        await prisma.productCollection.createMany({
          data: products.map(product => ({
            productId: product.id,
            collectionId: collection.id,
          })),
        });
      }
    }

    return NextResponse.json(collection);
  } catch (error) {
    console.error("[COLLECTIONS_POST] Error:", error);
    
    if (error instanceof z.ZodError) {
      return new NextResponse(
        JSON.stringify({ 
          error: "Validation error", 
          details: error.errors 
        }), 
        { status: 400 }
      );
    }
    
    return new NextResponse(
      JSON.stringify({ 
        error: "Internal error", 
        details: error instanceof Error ? error.message : "Unknown error" 
      }), 
      { status: 500 }
    );
  }
} 