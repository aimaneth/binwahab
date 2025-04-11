import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { Product } from '@prisma/client';

interface ProductImage {
  id: string;
  url: string;
  order: number;
  productId: string;
  createdAt: Date;
  updatedAt: Date;
}

interface ProductWithRelations extends Product {
  images: ProductImage[];
  variants: any[];
  collections: any[];
}

export async function POST(request: Request) {
  try {
    const { productId } = await request.json();

    // Get the original product with all its relations
    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: {
        images: true,
        variants: true,
        collections: true
      }
    });

    if (!product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }

    // Prepare product data without relations
    const { images, variants, collections, ...productData } = product as ProductWithRelations;

    // Create the new product
    const newProduct = await prisma.product.create({
      data: {
        ...productData,
        name: `${productData.name} (Copy)`,
        slug: `${productData.slug}-copy`,
        image: productData.image, // Keep the main image
        images: {
          create: images.map(img => ({
            url: img.url,
            order: img.order
          }))
        },
        variants: {
          create: variants.map(variant => ({
            name: variant.name,
            price: variant.price,
            compareAtPrice: variant.compareAtPrice,
            sku: variant.sku,
            barcode: variant.barcode,
            weight: variant.weight,
            weightUnit: variant.weightUnit,
            inventoryQuantity: variant.inventoryQuantity,
            inventoryPolicy: variant.inventoryPolicy,
            inventoryTracking: variant.inventoryTracking,
            options: variant.options as any
          }))
        },
        collections: {
          create: collections.map(collection => ({
            collectionId: collection.collectionId
          }))
        }
      },
      include: {
        images: true,
        variants: true,
        collections: true
      }
    });

    return NextResponse.json(newProduct);
  } catch (error) {
    console.error('Error duplicating product:', error);
    return NextResponse.json(
      { error: 'Failed to duplicate product' },
      { status: 500 }
    );
  }
} 