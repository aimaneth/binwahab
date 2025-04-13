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
      select: {
        id: true,
        name: true,
        description: true,
        price: true,
        image: true,
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
        }
      },
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
      
      return {
        id: product.id.toString(),
        name: product.name,
        description: product.description,
        price: Number(product.price),
        images: images,
        category: product.category?.name || "",
        collection: product.collections[0]?.collection.name || ""
      };
    });

    console.log("Transformed products:", JSON.stringify(transformedProducts, null, 2));

    return NextResponse.json({ products: transformedProducts });
  } catch (error) {
    console.error("[FEATURED_PRODUCTS_GET]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
} 