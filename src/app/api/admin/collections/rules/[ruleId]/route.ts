import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

// Schema for collection rule validation
const collectionRuleSchema = z.object({
  field: z.string().min(1).optional(),
  operator: z.string().min(1).optional(),
  value: z.string().min(1).optional(),
  order: z.number().int().optional(),
});

// GET /api/admin/collections/rules/[ruleId]
export async function GET(
  req: Request,
  { params }: { params: { ruleId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== "ADMIN") {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const rule = await prisma.collectionRule.findUnique({
      where: {
        id: params.ruleId,
      },
    });

    if (!rule) {
      return new NextResponse("Rule not found", { status: 404 });
    }

    return NextResponse.json(rule);
  } catch (error) {
    console.error("[COLLECTION_RULE_GET]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
}

// PATCH /api/admin/collections/rules/[ruleId]
export async function PATCH(
  req: Request,
  { params }: { params: { ruleId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== "ADMIN") {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const body = await req.json();
    const validatedData = collectionRuleSchema.parse(body);

    const rule = await prisma.collectionRule.update({
      where: {
        id: params.ruleId,
      },
      data: validatedData,
    });

    return NextResponse.json(rule);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return new NextResponse(JSON.stringify(error.errors), { status: 400 });
    }
    console.error("[COLLECTION_RULE_PATCH]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
}

// DELETE /api/admin/collections/rules/[ruleId]
export async function DELETE(
  req: Request,
  { params }: { params: { ruleId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== "ADMIN") {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    await prisma.collectionRule.delete({
      where: {
        id: params.ruleId,
      },
    });

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error("[COLLECTION_RULE_DELETE]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
} 