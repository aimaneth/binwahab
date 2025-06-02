import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { z } from "zod";
import { Prisma, Collection, Product, DisplaySection, ProductImage, CollectionSortOption, ProductVariant, ProductStatus, Category } from "@prisma/client";
import { execute } from '@/lib/prisma';

const prismaClient = new PrismaClient();

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
  handle: string;
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

    const collection = await prismaClient.collection.create({
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

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const section = searchParams.get('section') as DisplaySection | null;
    
    const collections = await execute(async (prismaClient) => {
      // Build where clause based on section filter
      const whereClause: any = {
        isActive: true,
        showOnHomePage: true,
      };
      
      if (section && section !== 'NONE') {
        whereClause.displaySection = section;
      }
      
      const collectionsData = await prismaClient.collection.findMany({
        where: whereClause,
        include: {
          products: {
            include: {
              product: {
                include: {
                  category: {
                    select: {
                      id: true,
                      name: true,
                      slug: true,
                    }
                  },
                  images: {
                    orderBy: {
                      order: 'asc'
                    },
                    select: {
                      id: true,
                      url: true,
                      order: true,
                      productId: true,
                      createdAt: true,
                      updatedAt: true,
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
                      dimensions: true,
                    }
                  }
                }
              }
            },
            where: {
              product: {
                isActive: true,
                status: ProductStatus.ACTIVE
              }
            }
          }
        },
        orderBy: [
          { order: 'asc' },
          { createdAt: 'desc' }
        ]
      });
      
      // Transform the data to match expected format
      return collectionsData.map(collection => ({
        id: collection.id,
        name: collection.name,
        description: collection.description,
        descriptionHtml: collection.descriptionHtml,
        handle: collection.handle,
        image: collection.image,
        image2: collection.image2,
        isActive: collection.isActive,
        showOnHomePage: collection.showOnHomePage,
        displaySection: collection.displaySection,
        order: collection.order,
        sortBy: collection.sortBy,
        products: collection.products.map(productCollection => {
          const product = productCollection.product;
          return {
            id: product.id.toString(),
            name: product.name,
            description: product.description,
            descriptionHtml: product.descriptionHtml,
            handle: product.handle,
            price: product.price.toString(),
            stock: product.stock,
            reservedStock: product.reservedStock,
            slug: product.slug,
            isActive: product.isActive,
            status: product.status,
            image: product.image,
            sku: product.sku,
            inventoryTracking: product.inventoryTracking,
            lowStockThreshold: product.lowStockThreshold,
            images: product.images,
            variants: product.variants.map(variant => ({
              id: variant.id,
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
              productId: variant.productId,
              isActive: variant.isActive,
              barcode: variant.barcode,
              weight: variant.weight,
              weightUnit: variant.weightUnit,
              dimensions: variant.dimensions as Record<string, any> | null,
            })),
            category: product.category,
            categoryId: product.categoryId,
            createdAt: product.createdAt,
            updatedAt: product.updatedAt,
          } as TransformedProduct;
        })
      })) as TransformedCollection[];
    });
    
    return NextResponse.json(collections || []);
    
  } catch (error: any) {
    console.error('Error fetching collections:', error);
    
    // Return empty array to prevent frontend crashes
    return NextResponse.json([]);
  }
} 