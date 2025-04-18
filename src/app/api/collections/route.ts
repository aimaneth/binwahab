import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { z } from "zod";
import { Prisma, Collection, Product, DisplaySection, ProductImage, CollectionSortOption, ProductVariant, ProductStatus, Category } from "@prisma/client";

const collectionSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  descriptionHtml: z.string().optional(),
  image: z.string().optional(),
  image2: z.string().optional(),
  isActive: z.boolean().default(true),
  showOnHomePage: z.boolean().default(false),
  displaySection: z.enum(["FEATURED", "COMPLETE", "NONE"]).default("NONE"),
  order: z.number().int().optional(),
  sortBy: z.enum(["MANUAL", "BEST_SELLING", "TITLE_ASC", "TITLE_DESC", "PRICE_ASC", "PRICE_DESC", "CREATED_ASC", "CREATED_DESC"]).default("MANUAL"),
});

const collectionInclude = {
  products: {
    include: {
      product: {
        include: {
          category: true,
          images: true,
          variants: {
            where: {
              isActive: true
            }
          }
        }
      }
    }
  }
} satisfies Prisma.CollectionInclude;

type CollectionWithProducts = Prisma.CollectionGetPayload<{
  include: typeof collectionInclude;
}>;

type TransformedProduct = {
  id: string;
  name: string;
  description: string;
  descriptionHtml: string | null;
  handle: string | null;
  price: string;
  stock: number;
  reservedStock: number;
  slug: string;
  isActive: boolean;
  status: ProductStatus;
  image: string | null;
  sku: string | null;
  inventoryTracking: boolean;
  lowStockThreshold: number | null;
  images: {
    id: number;
    url: string;
    order: number;
    productId: number;
    createdAt: Date;
    updatedAt: Date;
  }[];
  variants: {
    id: number;
    name: string;
    sku: string;
    price: string;
    compareAtPrice: string | null;
    stock: number;
    reservedStock: number;
    options: Record<string, string>;
    images: string[];
    inventoryTracking: boolean;
    lowStockThreshold: number | null;
    productId: number;
    isActive: boolean;
    barcode: string | null;
    weight: string | null;
    weightUnit: string | null;
    dimensions: Record<string, any> | null;
  }[];
  category: Category | null;
  categoryId: string | null;
  createdAt: Date;
  updatedAt: Date;
};

type TransformedCollection = {
  id: string;
  name: string;
  description: string | null;
  descriptionHtml: string | null;
  image: string | null;
  image2: string | null;
  isActive: boolean;
  showOnHomePage: boolean;
  displaySection: DisplaySection;
  order: number | null;
  sortBy: CollectionSortOption;
  products: TransformedProduct[];
};

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const body = await req.json();
    const validatedData = collectionSchema.parse(body);

    const collection = await prisma.collection.create({
      data: {
        ...validatedData,
        handle: validatedData.name.toLowerCase().replace(/\s+/g, '-')
      },
    });

    return NextResponse.json(collection);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(error.issues, { status: 422 });
    }
    return NextResponse.json(null, { status: 500 });
  }
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const section = searchParams.get("section") as DisplaySection | null;
    const category = searchParams.get("category");

    const collections = await prisma.collection.findMany({
      where: {
        isActive: true,
        ...(section && { displaySection: section }),
        ...(category && { products: { some: { product: { categoryId: category } } } })
      },
      include: {
        products: {
          include: {
            product: {
              include: {
                category: true,
                images: {
                  orderBy: {
                    order: 'asc'
                  }
                },
                variants: {
                  where: {
                    isActive: true
                  }
                }
              }
            }
          }
        }
      }
    });

    // Transform the response to include products directly
    const transformedCollections = collections.map((collection) => {
      const products = collection.products.map(({ product }) => {
        // Transform product images
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
          dimensions: typeof variant.dimensions === 'object' ? variant.dimensions as Record<string, any> : null
        }));

        return {
          id: product.id.toString(),
          name: product.name,
          description: product.description || "",
          descriptionHtml: product.descriptionHtml,
          handle: product.handle,
          price: product.price.toString(),
          stock: product.stock,
          reservedStock: product.reservedStock,
          slug: product.slug || product.handle || `product-${product.id}`,
          isActive: product.isActive,
          status: product.status,
          image: product.image,
          sku: product.sku,
          inventoryTracking: product.inventoryTracking,
          lowStockThreshold: product.lowStockThreshold,
          images: productImages,
          variants,
          category: product.category,
          categoryId: product.categoryId,
          createdAt: product.createdAt,
          updatedAt: product.updatedAt
        };
      });

      return {
        id: collection.id.toString(),
        name: collection.name,
        description: collection.description,
        descriptionHtml: collection.descriptionHtml,
        image: collection.image,
        image2: collection.image2,
        isActive: collection.isActive,
        showOnHomePage: collection.showOnHomePage,
        displaySection: collection.displaySection,
        order: collection.order,
        sortBy: collection.sortBy,
        products
      };
    });

    return NextResponse.json(transformedCollections);
  } catch (error) {
    console.error("Error fetching collections:", error);
    return NextResponse.json([]);
  }
} 