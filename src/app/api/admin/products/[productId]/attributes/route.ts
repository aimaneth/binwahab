import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: Request,
  { params }: { params: { productId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== "ADMIN") {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const attributes = await prisma.productAttributeValue.findMany({
      where: {
        productId: params.productId,
      },
      include: {
        attribute: true,
      },
    });

    return NextResponse.json(attributes);
  } catch (error) {
    console.error("[PRODUCT_ATTRIBUTES_GET]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
}

export async function POST(
  req: Request,
  { params }: { params: { productId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== "ADMIN") {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const body = await req.json();
    const { attributeId, value } = body;

    if (!attributeId || !value) {
      return new NextResponse("Attribute ID and value are required", { status: 400 });
    }

    const attribute = await prisma.productAttributeValue.create({
      data: {
        productId: params.productId,
        attributeId,
        value,
      },
      include: {
        attribute: true,
      },
    });

    return NextResponse.json(attribute);
  } catch (error) {
    console.error("[PRODUCT_ATTRIBUTES_POST]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: { productId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== "ADMIN") {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const body = await req.json();
    const { id, value } = body;

    if (!id || !value) {
      return new NextResponse("Attribute ID and value are required", { status: 400 });
    }

    const attribute = await prisma.productAttributeValue.update({
      where: {
        id,
        productId: params.productId,
      },
      data: {
        value,
      },
      include: {
        attribute: true,
      },
    });

    return NextResponse.json(attribute);
  } catch (error) {
    console.error("[PRODUCT_ATTRIBUTES_PATCH]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: { productId: string } }
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

    await prisma.productAttributeValue.delete({
      where: {
        id,
        productId: params.productId,
      },
    });

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error("[PRODUCT_ATTRIBUTES_DELETE]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
} 