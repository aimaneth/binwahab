import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Prisma, ProductStatus } from "@prisma/client";

export async function POST(
  request: Request,
  { params }: { params: { productId: string } }
) {
  try {
    const productId = parseInt(params.productId, 10);

    // Get the original product with its relationships
    const originalProduct = await prisma.product.findUnique({
      where: { id: productId },
      include: {
        variants: true,
        collections: {
          include: {
            collection: true
          }
        },
        images: true,
      },
    });

    if (!originalProduct) {
      return new NextResponse("Product not found", { status: 404 });
    }

    // Create a copy of the product with a modified name
    const duplicatedProduct = await prisma.product.create({
      data: {
        name: `${originalProduct.name} (Copy)`,
        description: originalProduct.description,
        handle: `${originalProduct.handle}-copy-${Date.now()}`,
        price: originalProduct.price,
        image: originalProduct.image,
        stock: originalProduct.stock,
        categoryId: originalProduct.categoryId,
        isActive: false, // Set to inactive by default
        slug: `${originalProduct.slug}-copy-${Date.now()}`, // Ensure unique slug
        status: originalProduct.status || ProductStatus.DRAFT,
        // Duplicate variants
        variants: {
          create: originalProduct.variants.map((variant) => {
            // Handle dimensions separately to ensure correct type
            const dimensions = variant.dimensions === null ? Prisma.JsonNull : variant.dimensions;
            const options = variant.options === null ? Prisma.JsonNull : variant.options;
            
            return {
              name: variant.name,
              price: variant.price,
              stock: variant.stock,
              sku: `${variant.sku}-copy`,
              compareAtPrice: variant.compareAtPrice,
              isActive: variant.isActive,
              options: options,
              lowStockThreshold: variant.lowStockThreshold,
              reservedStock: variant.reservedStock,
              images: variant.images,
              inventoryTracking: variant.inventoryTracking,
              weight: variant.weight,
              weightUnit: variant.weightUnit,
              dimensions: dimensions,
              barcode: variant.barcode,
            };
          }),
        },
        // Duplicate collection relationships
        collections: {
          create: originalProduct.collections.map((pc) => ({
            collection: {
              connect: { id: pc.collection.id },
            },
          })),
        },
        // Duplicate product images
        images: {
          create: originalProduct.images.map((image) => ({
            url: image.url,
            order: image.order,
          })),
        },
      },
      include: {
        variants: true,
        collections: {
          include: {
            collection: true
          }
        },
        images: true,
      },
    });

    return NextResponse.json(duplicatedProduct);
  } catch (error) {
    console.error("[PRODUCT_DUPLICATE]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
} 