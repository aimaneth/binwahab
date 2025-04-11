import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

// Schema for collection rule validation
const collectionRuleSchema = z.object({
  id: z.string().optional(),
  collectionId: z.string().min(1),
  field: z.string().min(1),
  operator: z.string().min(1),
  value: z.string().min(1),
  order: z.number().int().optional(),
});

// GET /api/admin/collections/rules
export async function GET(req: Request) {
  try {
    console.log("[COLLECTION_RULES_GET] Starting request");
    
    const session = await getServerSession(authOptions);
    console.log("[COLLECTION_RULES_GET] Session:", session);
    
    if (!session?.user) {
      console.log("[COLLECTION_RULES_GET] No session found");
      return new NextResponse("Unauthorized - No session", { status: 401 });
    }
    if (session.user.role !== "ADMIN") {
      console.log("[COLLECTION_RULES_GET] User is not admin:", session.user.role);
      return new NextResponse("Unauthorized - Not an admin", { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const collectionId = searchParams.get("collectionId");
    console.log("[COLLECTION_RULES_GET] Collection ID:", collectionId);

    if (!collectionId) {
      console.log("[COLLECTION_RULES_GET] No collection ID provided");
      return new NextResponse("Collection ID is required", { status: 400 });
    }

    // First check if the collection exists
    console.log("[COLLECTION_RULES_GET] Checking if collection exists");
    const collection = await prisma.collection.findUnique({
      where: { id: collectionId },
    });

    if (!collection) {
      console.log("[COLLECTION_RULES_GET] Collection not found");
      return new NextResponse("Collection not found", { status: 404 });
    }

    console.log("[COLLECTION_RULES_GET] Fetching rules");
    const rules = await prisma.collectionRule.findMany({
      where: {
        collectionId,
      },
      orderBy: {
        order: "asc",
      },
    });
    console.log("[COLLECTION_RULES_GET] Rules found:", rules);

    return NextResponse.json(rules);
  } catch (error) {
    console.error("[COLLECTION_RULES_GET] Error details:", {
      name: error instanceof Error ? error.name : "Unknown",
      message: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined,
    });
    
    return new NextResponse(
      JSON.stringify({ 
        error: "Internal server error", 
        details: error instanceof Error ? error.message : "Unknown error",
        stack: error instanceof Error ? error.stack : undefined
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

// POST /api/admin/collections/rules
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== "ADMIN") {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const body = await req.json();
    const validatedData = collectionRuleSchema.parse(body);

    // Check if collection exists
    const collection = await prisma.collection.findUnique({
      where: {
        id: validatedData.collectionId,
      },
    });

    if (!collection) {
      return new NextResponse("Collection not found", { status: 404 });
    }

    // If order is not provided, set it to the highest order + 1
    if (validatedData.order === undefined) {
      const highestOrder = await prisma.collectionRule.findFirst({
        where: {
          collectionId: validatedData.collectionId,
        },
        orderBy: { order: "desc" },
        select: { order: true },
      });

      validatedData.order = (highestOrder?.order || 0) + 1;
    }

    const rule = await prisma.collectionRule.create({
      data: validatedData,
    });

    return NextResponse.json(rule);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return new NextResponse(JSON.stringify(error.errors), { status: 400 });
    }
    console.error("[COLLECTION_RULES_POST]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
}

// PATCH /api/admin/collections/rules/bulk
export async function PATCH(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== "ADMIN") {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const body = await req.json();
    const { rules } = body;

    if (!rules || !Array.isArray(rules)) {
      return new NextResponse("Rules array is required", { status: 400 });
    }

    // Validate each rule
    const validatedRules = rules.map(rule => collectionRuleSchema.parse(rule));

    // Update or create rules
    const results = await Promise.all(
      validatedRules.map(async (rule) => {
        if (rule.id) {
          return prisma.collectionRule.update({
            where: { id: rule.id },
            data: rule,
          });
        } else {
          return prisma.collectionRule.create({
            data: rule,
          });
        }
      })
    );

    return NextResponse.json(results);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return new NextResponse(JSON.stringify(error.errors), { status: 400 });
    }
    console.error("[COLLECTION_RULES_BULK_PATCH]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
} 