import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { Prisma, ProductStatus } from '@prisma/client';

interface ProductWithRelations {
  id: number;
  name: string;
  description: string;
  descriptionHtml: string | null;
  handle: string;
  price: Prisma.Decimal;
  compareAtPrice: Prisma.Decimal | null;
  costPerItem: Prisma.Decimal | null;
  stock: number;
  reservedStock: number;
  slug: string | null;
  isActive: boolean;
  status: ProductStatus;
  image: string | null;
  categoryId: string | null;
  optionsJson: Prisma.JsonValue | null;
  variants: Array<{
    name: string;
    price: Prisma.Decimal;
    stock: number;
    sku: string;
    compareAtPrice: Prisma.Decimal | null;
    isActive: boolean;
    options: Prisma.JsonValue;
    lowStockThreshold: number | null;
    reservedStock: number;
    images: string[];
    inventoryTracking: boolean;
    weight: number | null;
    weightUnit: string | null;
    dimensions: Prisma.JsonValue | null;
    barcode: string | null;
  }>;
  images: Array<{
    url: string;
    order: number;
  }>;
  collections: Array<{
    collection: {
      id: string;
    };
  }>;
}

export async function POST(
  request: Request,
  { params }: { params: { productId: string } }
) {
  try {
    const productId = parseInt(params.productId, 10);

    // Get the original product with its relationships
    const product = await prisma.product.findUnique({
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

    if (!product) {
      return new NextResponse("Product not found", { status: 404 });
    }

    const typedProduct = product as unknown as ProductWithRelations;

    // Create a copy of the product with a modified name
    const duplicatedProduct = await prisma.product.create({
      data: {
        name: `${typedProduct.name} (Copy)`,
        description: typedProduct.description,
        handle: `${typedProduct.handle}-copy-${Date.now()}`,
        price: typedProduct.price,
        image: typedProduct.image,
        stock: typedProduct.stock,
        categoryId: typedProduct.categoryId,
        isActive: false, // Set to inactive by default
        slug: `${typedProduct.slug}-copy-${Date.now()}`, // Ensure unique slug
        status: typedProduct.status || ProductStatus.DRAFT,
        optionsJson: typedProduct.optionsJson === null ? Prisma.JsonNull : typedProduct.optionsJson,
        // Duplicate variants
        variants: {
          create: typedProduct.variants.map((variant) => {
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
          create: typedProduct.collections.map((pc) => ({
            collection: {
              connect: { id: pc.collection.id },
            },
          })),
        },
        // Duplicate product images
        images: {
          create: typedProduct.images.map((image) => ({
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