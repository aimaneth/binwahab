import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Product, Category, Collection } from "@prisma/client";

type ProductVariantWithImages = {
  id: number;
  images: string[];
  [key: string]: any;
};

type ProductWithRelations = Product & {
  category: Category | null;
  collections: {
    collection: Collection;
  }[];
  variants: ProductVariantWithImages[];
};

export async function GET() {
  try {
    const products = await prisma.product.findMany({
      where: {
        isActive: true,
        status: "ACTIVE",
      },
      take: 8,
      orderBy: {
        createdAt: "desc",
      },
      include: {
        category: {
          select: {
            name: true
          }
        },
        collections: {
          select: {
            collection: {
              select: {
                name: true
              }
            }
          }
        },
        images: {
          orderBy: {
            order: "asc"
          },
          select: {
            url: true
          }
        },
        variants: {
          where: {
            isActive: true
          },
          select: {
            id: true,
            name: true,
            sku: true,
            price: true,
            compareAtPrice: true,
            stock: true,
            reservedStock: true,
            options: true,
            images: true,
            inventoryTracking: true,
            lowStockThreshold: true,
            productId: true,
            isActive: true,
            barcode: true,
            weight: true,
            weightUnit: true,
            dimensions: true
          }
        }
      }
    });

    console.log("Raw products from database:", JSON.stringify(products, null, 2));

    // Transform the data to match the frontend interface
    const transformedProducts = products.map(product => {
      // Get images from the images relation
      const images = product.images.map(img => img.url);
      
      // If no images in the relation, fall back to the main image
      if (images.length === 0 && product.image) {
        images.push(product.image);
      }
      
      console.log(`Product ${product.id} images:`, images);

      // Transform variants
      const variants = product.variants.map(variant => ({
        id: Number(variant.id),
        name: variant.name,
        sku: variant.sku,
        price: variant.price.toString(),
        compareAtPrice: variant.compareAtPrice?.toString() || null,
        stock: variant.stock,
        reservedStock: variant.reservedStock,
        options: variant.options as Record<string, string>,
        images: variant.images as string[],
        inventoryTracking: variant.inventoryTracking,
        lowStockThreshold: variant.lowStockThreshold,
        productId: Number(variant.productId),
        isActive: variant.isActive,
        barcode: variant.barcode,
        weight: variant.weight?.toString() || null,
        weightUnit: variant.weightUnit,
        dimensions: variant.dimensions as Record<string, any> | null
      }));
      
      return {
        id: product.id.toString(),
        name: product.name,
        description: product.description,
        price: product.price.toString(), // Keep price as string
        stock: product.stock,
        reservedStock: product.reservedStock,
        images: images,
        variants: variants,
        category: product.category ? {
          name: product.category.name
        } : null,
        collection: product.collections[0]?.collection.name || "",
        isActive: product.isActive,
        status: product.status,
        categoryId: product.categoryId,
        createdAt: product.createdAt,
        updatedAt: product.updatedAt
      };
    });

    console.log("Transformed products:", JSON.stringify(transformedProducts, null, 2));

    return NextResponse.json({ products: transformedProducts });
  } catch (error) {
    console.error("[FEATURED_PRODUCTS_GET]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
} 