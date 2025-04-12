export const dynamic = 'force-dynamic';

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { Prisma } from "@prisma/client";

// Schema for product validation
const productSchema = z.object({
  name: z.string().min(1).optional(),
  slug: z.string().min(1).optional(),
  description: z.string().min(1).optional(),
  price: z.number().positive().optional(),
  stock: z.number().int().min(0).optional(),
  isActive: z.boolean().optional(),
  status: z.enum(["DRAFT", "ACTIVE", "ARCHIVED"]).optional(),
  image: z.string().optional(),
  images: z.array(z.string()).optional(),
  categoryId: z.string().optional(),
  collectionIds: z.array(z.string()).optional(),
});

// GET /api/admin/products/[productId]
export async function GET(
  req: Request,
  { params }: { params: { productId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== "ADMIN") {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const productId = parseInt(params.productId, 10);

    const product = await prisma.product.findUnique({
      where: {
        id: productId,
      },
      include: {
        category: true,
        collections: {
          include: {
            collection: true,
          },
        },
        images: true,
      },
    });

    if (!product) {
      return new NextResponse("Product not found", { status: 404 });
    }

    return NextResponse.json(product);
  } catch (error) {
    console.error("[PRODUCT_GET]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
}

// PATCH /api/admin/products/[productId]
export async function PATCH(
  req: Request,
  { params }: { params: { productId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== "ADMIN") {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const productId = parseInt(params.productId, 10);
    const body = await req.json();
    console.log("Received request body:", body);
    
    const validatedData = productSchema.parse(body);
    console.log("Validated data:", validatedData);

    const { collectionIds, images, ...productData } = validatedData;

    // Use a transaction to handle all updates atomically
    const updatedProduct = await prisma.$transaction(async (tx) => {
      // Handle images if provided
      if (images) {
        // Delete existing images
        await tx.productImage.deleteMany({
          where: { productId }
        });

        // Create new images
        await tx.productImage.createMany({
          data: images.map((url, index) => ({
            url,
            order: index,
            productId
          }))
        });
      }

      // Handle collections if provided
      if (collectionIds) {
        // Delete existing collection relationships
        await tx.productCollection.deleteMany({
          where: { productId }
        });

        // Create new collection relationships
        if (collectionIds.length > 0) {
          await tx.productCollection.createMany({
            data: collectionIds.map(collectionId => ({
              productId,
              collectionId
            }))
          });
        }
      }

      // Update the product
      const updatedProduct = await tx.product.update({
        where: { id: productId },
        data: productData,
        include: {
          images: true,
          variants: true,
          collections: true
        }
      });

      return updatedProduct;
    });

    return NextResponse.json(updatedProduct);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return new NextResponse(JSON.stringify(error.errors), { status: 400 });
    }
    console.error("[PRODUCT_PATCH]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
}

// DELETE /api/admin/products/[productId]
export async function DELETE(
  req: Request,
  { params }: { params: { productId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== "ADMIN") {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const productId = parseInt(params.productId, 10);

    await prisma.product.delete({
      where: {
        id: productId,
      },
    });

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error("[PRODUCT_DELETE]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
} 