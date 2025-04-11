import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PUT(
  req: Request,
  { params }: { params: { productId: string } }
) {
  try {
    const productId = parseInt(params.productId);
    const { collectionId } = await req.json();

    if (!collectionId) {
      return new NextResponse("Collection ID is required", { status: 400 });
    }

    // Update the product's collection using a transaction
    const updatedProduct = await prisma.$transaction(async (tx) => {
      // First, delete the existing product collection relationships
      await tx.productCollection.deleteMany({
        where: {
          productId: productId,
        },
      });

      // Then create the new relationship
      await tx.productCollection.create({
        data: {
          productId: productId,
          collectionId: collectionId,
        },
      });

      // Return the updated product with its new collection
      return tx.product.findUnique({
        where: { id: productId },
        include: {
          collections: {
            include: {
              collection: true,
            },
          },
        },
      });
    });

    return NextResponse.json(updatedProduct);
  } catch (error) {
    console.error("[PRODUCT_UPDATE_COLLECTION]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
} 