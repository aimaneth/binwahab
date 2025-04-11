import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PrismaClient } from "@prisma/client";

// Define AttributeType enum if it doesn't exist in Prisma client
enum AttributeType {
  TEXT = "TEXT",
  NUMBER = "NUMBER",
  BOOLEAN = "BOOLEAN",
  SELECT = "SELECT",
  MULTISELECT = "MULTISELECT",
  DATE = "DATE",
  FILE = "FILE",
}

export async function GET(
  req: Request,
  { params }: { params: { categoryId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== "ADMIN") {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const attributes = await (prisma as any).CategoryAttribute.findMany({
      where: {
        categoryId: params.categoryId,
      },
      orderBy: {
        order: "asc",
      },
    });

    return NextResponse.json(attributes);
  } catch (error) {
    console.error("[CATEGORY_ATTRIBUTES_GET]", error);
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
    const { name, type, options, isRequired, order } = body;

    if (!name || !type) {
      return new NextResponse("Name and type are required", { status: 400 });
    }

    const attribute = await (prisma as any).CategoryAttribute.create({
      data: {
        categoryId: params.categoryId,
        name,
        type: type as AttributeType,
        options: options || [],
        isRequired: isRequired || false,
        order: order || 0,
      },
    });

    return NextResponse.json(attribute);
  } catch (error) {
    console.error("[CATEGORY_ATTRIBUTES_POST]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: { categoryId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== "ADMIN") {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const body = await req.json();
    const { id, name, type, options, isRequired, order } = body;

    if (!id) {
      return new NextResponse("Attribute ID is required", { status: 400 });
    }

    const attribute = await (prisma as any).CategoryAttribute.update({
      where: {
        id,
        categoryId: params.categoryId,
      },
      data: {
        name,
        type: type as AttributeType,
        options: options || [],
        isRequired,
        order,
      },
    });

    return NextResponse.json(attribute);
  } catch (error) {
    console.error("[CATEGORY_ATTRIBUTES_PATCH]", error);
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

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return new NextResponse("Attribute ID is required", { status: 400 });
    }

    await (prisma as any).CategoryAttribute.delete({
      where: {
        id,
        categoryId: params.categoryId,
      },
    });

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error("[CATEGORY_ATTRIBUTES_DELETE]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
} 