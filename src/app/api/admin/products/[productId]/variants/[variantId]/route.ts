import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const variantUpdateSchema = z.object({
  name: z.string().optional(),
  sku: z.string().optional(),
  barcode: z.string().optional(),
  price: z.number().optional(),
  compareAtPrice: z.number().optional(),
  weight: z.number().optional(),
  weightUnit: z.string().optional(),
  dimensions: z.record(z.number()).optional(),
  stock: z.number().optional(),
  isActive: z.boolean().optional(),
});

// PUT /api/admin/products/[productId]/variants/[variantId]
export async function PUT(
  req: Request,
  { params }: { params: { productId: string; variantId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== "ADMIN") {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const body = await req.json();
    console.log("[VARIANT_PUT] Received update data:", body);
    
    const data = variantUpdateSchema.parse(body);
    console.log("[VARIANT_PUT] Validated data:", data);

    // First verify the variant exists
    const existingVariant = await prisma.productVariant.findUnique({
      where: {
        id: parseInt(params.variantId),
        productId: parseInt(params.productId),
      }
    });

    if (!existingVariant) {
      console.error("[VARIANT_PUT] Variant not found:", params.variantId);
      return new NextResponse("Variant not found", { status: 404 });
    }

    console.log("[VARIANT_PUT] Existing variant:", existingVariant);

    const variant = await prisma.productVariant.update({
      where: {
        id: parseInt(params.variantId),
        productId: parseInt(params.productId),
      },
      data,
    });

    console.log("[VARIANT_PUT] Updated variant:", variant);
    return NextResponse.json(variant);
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error("[VARIANT_PUT] Validation error:", error.errors);
      return new NextResponse(JSON.stringify(error.errors), { status: 400 });
    }
    console.error("[VARIANT_PUT] Error:", error);
    return new NextResponse("Internal error", { status: 500 });
  }
}

// DELETE /api/admin/products/[productId]/variants/[variantId]
export async function DELETE(
  req: Request,
  { params }: { params: { productId: string; variantId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== "ADMIN") {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    await prisma.productVariant.delete({
      where: {
        id: parseInt(params.variantId),
        productId: parseInt(params.productId),
      },
    });

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error("[VARIANT_DELETE]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
}

// GET /api/admin/products/[productId]/variants/[variantId]
export async function GET(
  req: Request,
  { params }: { params: { productId: string; variantId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== "ADMIN") {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const variant = await prisma.productVariant.findUnique({
      where: {
        id: parseInt(params.variantId),
        productId: parseInt(params.productId),
      }
    });

    if (!variant) {
      return new NextResponse("Variant not found", { status: 404 });
    }

    return NextResponse.json(variant);
  } catch (error) {
    console.error("[VARIANT_GET] Error:", error);
    return new NextResponse("Internal error", { status: 500 });
  }
} 