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

    const bundles = await prisma.productBundle.findMany({
      where: {
        productId: params.productId,
      },
      include: {
        bundledProduct: true,
      },
    });

    return NextResponse.json(bundles);
  } catch (error) {
    console.error("[PRODUCT_BUNDLES_GET]", error);
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
    const { bundledProductId, quantity, discount } = body;

    if (!bundledProductId) {
      return new NextResponse("Bundled product ID is required", { status: 400 });
    }

    const bundle = await prisma.productBundle.create({
      data: {
        productId: params.productId,
        bundledProductId,
        quantity: quantity || 1,
        discount: discount || null,
      },
      include: {
        bundledProduct: true,
      },
    });

    return NextResponse.json(bundle);
  } catch (error) {
    console.error("[PRODUCT_BUNDLES_POST]", error);
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
    const { id, quantity, discount } = body;

    if (!id) {
      return new NextResponse("Bundle ID is required", { status: 400 });
    }

    const bundle = await prisma.productBundle.update({
      where: {
        id,
        productId: params.productId,
      },
      data: {
        quantity: quantity || 1,
        discount: discount || null,
      },
      include: {
        bundledProduct: true,
      },
    });

    return NextResponse.json(bundle);
  } catch (error) {
    console.error("[PRODUCT_BUNDLES_PATCH]", error);
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
      return new NextResponse("Bundle ID is required", { status: 400 });
    }

    await prisma.productBundle.delete({
      where: {
        id,
        productId: params.productId,
      },
    });

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error("[PRODUCT_BUNDLES_DELETE]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
} 