import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { PrismaClient } from "@prisma/client";

const templateSchema = z.object({
  name: z.string().min(1),
  layout: z.string().min(1),
  filters: z.record(z.any()),
  sortRules: z.record(z.any()),
});

export async function GET(
  request: Request,
  { params }: { params: { categoryId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== "ADMIN") {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const template = await (prisma as any).CategoryTemplate.findUnique({
      where: { categoryId: params.categoryId },
    });

    if (!template) {
      return NextResponse.json({});
    }

    return NextResponse.json(template);
  } catch (error) {
    console.error("[CATEGORY_TEMPLATE_GET]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { categoryId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== "ADMIN") {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const body = await request.json();
    const validatedData = templateSchema.parse(body);

    const template = await (prisma as any).CategoryTemplate.upsert({
      where: { categoryId: params.categoryId },
      create: {
        categoryId: params.categoryId,
        ...validatedData,
      },
      update: validatedData,
    });

    return NextResponse.json(template);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return new NextResponse("Invalid request data", { status: 400 });
    }
    console.error("[CATEGORY_TEMPLATE_PUT]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
}

export async function POST(
  req: Request,
  { params }: { params: { categoryId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== "ADMIN") {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const body = await req.json();
    const { name, layout, filters, sortRules } = body;

    if (!name) {
      return new NextResponse("Name is required", { status: 400 });
    }

    const template = await (prisma as any).CategoryTemplate.upsert({
      where: {
        categoryId: params.categoryId,
      },
      create: {
        categoryId: params.categoryId,
        name,
        layout: layout || "{}",
        filters: filters || {},
        sortRules: sortRules || {},
      },
      update: {
        name,
        layout: layout || "{}",
        filters: filters || {},
        sortRules: sortRules || {},
      },
    });

    return NextResponse.json(template);
  } catch (error) {
    console.error("[CATEGORY_TEMPLATE_POST]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: { categoryId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== "ADMIN") {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    await (prisma as any).CategoryTemplate.delete({
      where: {
        categoryId: params.categoryId,
      },
    });

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error("[CATEGORY_TEMPLATE_DELETE]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
} 