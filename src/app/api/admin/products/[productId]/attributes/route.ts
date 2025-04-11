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

    // Get product variants which contain the attributes
    const variants = await prisma.productVariant.findMany({
      where: {
        productId: parseInt(params.productId),
      },
      select: {
        id: true,
        attributes: true,
        options: true,
      },
    });

    // Extract attributes from variants
    const attributes = variants.flatMap(variant => {
      const attrs = variant.attributes as Record<string, any> || {};
      return Object.entries(attrs).map(([key, value]) => ({
        id: `${variant.id}-${key}`,
        name: key,
        value: value,
        variantId: variant.id,
      }));
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
    const { variantId, name, value } = body;

    if (!variantId || !name || value === undefined) {
      return new NextResponse("Variant ID, name, and value are required", { status: 400 });
    }

    // Get the current variant
    const variant = await prisma.productVariant.findUnique({
      where: { id: variantId },
    });

    if (!variant) {
      return new NextResponse("Variant not found", { status: 404 });
    }

    // Update the attributes
    const currentAttributes = variant.attributes as Record<string, any> || {};
    const updatedAttributes = {
      ...currentAttributes,
      [name]: value,
    };

    // Update the variant with the new attributes
    const updatedVariant = await prisma.productVariant.update({
      where: { id: variantId },
      data: {
        attributes: updatedAttributes,
      },
    });

    return NextResponse.json({
      id: `${variantId}-${name}`,
      name,
      value,
      variantId,
    });
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
    const { variantId, name, value } = body;

    if (!variantId || !name || value === undefined) {
      return new NextResponse("Variant ID, name, and value are required", { status: 400 });
    }

    // Get the current variant
    const variant = await prisma.productVariant.findUnique({
      where: { id: variantId },
    });

    if (!variant) {
      return new NextResponse("Variant not found", { status: 404 });
    }

    // Update the attributes
    const currentAttributes = variant.attributes as Record<string, any> || {};
    const updatedAttributes = {
      ...currentAttributes,
      [name]: value,
    };

    // Update the variant with the new attributes
    const updatedVariant = await prisma.productVariant.update({
      where: { id: variantId },
      data: {
        attributes: updatedAttributes,
      },
    });

    return NextResponse.json({
      id: `${variantId}-${name}`,
      name,
      value,
      variantId,
    });
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
    const variantId = searchParams.get("variantId");
    const name = searchParams.get("name");

    if (!variantId || !name) {
      return new NextResponse("Variant ID and attribute name are required", { status: 400 });
    }

    // Get the current variant
    const variant = await prisma.productVariant.findUnique({
      where: { id: parseInt(variantId) },
    });

    if (!variant) {
      return new NextResponse("Variant not found", { status: 404 });
    }

    // Remove the attribute
    const currentAttributes = variant.attributes as Record<string, any> || {};
    const { [name]: removed, ...remainingAttributes } = currentAttributes;

    // Update the variant with the remaining attributes
    await prisma.productVariant.update({
      where: { id: parseInt(variantId) },
      data: {
        attributes: remainingAttributes,
      },
    });

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error("[PRODUCT_ATTRIBUTES_DELETE]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
} 