import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Product, Category, Collection } from "@prisma/client";
import { Product as ProductType } from "@/types/product";

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
        category: true,
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
            id: true,
            url: true,
            order: true,
            productId: true,
            createdAt: true,
            updatedAt: true
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
      // Transform product images to match ProductImage interface
      const productImages = product.images.map(img => ({
        id: Number(img.id),
        url: img.url,
        order: img.order,
        productId: Number(img.productId),
        createdAt: img.createdAt,
        updatedAt: img.updatedAt
      }));

      // If no images in the relation, fall back to the main image
      if (productImages.length === 0 && product.image) {
        productImages.push({
          id: 0,
          url: product.image,
          order: 0,
          productId: Number(product.id),
          createdAt: new Date(),
          updatedAt: new Date()
        });
      }

      console.log(`Product ${product.id} images:`, productImages.map(img => img.url));

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
      
      const transformedProduct: ProductType = {
        id: Number(product.id),
        name: product.name,
        description: product.description || "",
        descriptionHtml: product.descriptionHtml,
        handle: product.handle,
        price: product.price.toString(),
        stock: product.stock,
        reservedStock: product.reservedStock,
        slug: product.handle || `product-${product.id}`,
        isActive: product.isActive,
        status: product.status,
        image: product.image,
        sku: product.sku,
        inventoryTracking: product.inventoryTracking,
        lowStockThreshold: product.lowStockThreshold,
        images: productImages,
        variants: variants,
        category: product.category,
        categoryId: product.categoryId,
        createdAt: product.createdAt,
        updatedAt: product.updatedAt
      };

      return transformedProduct;
    });

    console.log("Transformed products:", JSON.stringify(transformedProducts, null, 2));

    return NextResponse.json({ products: transformedProducts });
  } catch (error) {
    console.error("[FEATURED_PRODUCTS_GET]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
} 