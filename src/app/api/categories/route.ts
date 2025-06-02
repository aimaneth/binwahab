import { NextResponse } from "next/server";
import { Category, Product, Collection, ProductCollection } from "@prisma/client";
import { prisma } from "@/lib/prisma";

type CategoryWithProducts = Category & {
  products: (Product & {
    collections: (ProductCollection & {
      collection: Collection;
    })[];
  })[];
};

export async function GET() {
  try {
    const categories = await prisma.category.findMany({
      where: {
        isActive: true
      },
      include: {
        products: {
          where: {
            isActive: true
          },
          include: {
            collections: {
              include: {
                collection: true
              }
            }
          }
        }
      },
      orderBy: {
        name: "asc"
      }
    });

    // Transform the response to flatten the collections
    const transformedCategories = (categories as CategoryWithProducts[]).map(category => {
      // Get unique collections for this category
      const collectionsMap = new Map<string, {
        id: string;
        name: string;
        handle: string;
        description: string | null;
      }>();
      
      category.products.forEach(product => {
        product.collections.forEach(productCollection => {
          const collection = productCollection.collection;
          if (collection.isActive && !collectionsMap.has(collection.id)) {
            collectionsMap.set(collection.id, {
              id: collection.id,
              name: collection.name,
              handle: collection.handle,
              description: collection.description
            });
          }
        });
      });
      
      return {
        id: category.id,
        name: category.name,
        collections: Array.from(collectionsMap.values())
      };
    });

    return NextResponse.json(transformedCategories);
  } catch (error) {
    console.error("Error fetching categories:", error);
    // Return empty array instead of 500 error to prevent frontend crashes
    return NextResponse.json([]);
  }
} 