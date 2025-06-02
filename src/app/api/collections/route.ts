import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { z } from "zod";
import { Prisma, Collection, Product, DisplaySection, ProductImage, CollectionSortOption, ProductVariant, ProductStatus, Category } from "@prisma/client";
import { prisma, withFreshConnection, resetConnection } from '@/lib/prisma';

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

export async function GET() {
  try {
    // Try with main connection first
    const collections = await prisma.collection.findMany({
      select: {
        id: true,
        name: true,
        description: true,
      },
    });
    
    return NextResponse.json(collections);
    
  } catch (error: any) {
    console.error('Error fetching collections:', error);
    
    // If it's a prepared statement error, try with fresh connection
    if (error.message?.includes('prepared statement') || 
        error.message?.includes('does not exist') ||
        error.message?.includes('already exists')) {
      
      console.log('Retrying with fresh connection due to prepared statement error');
      
      try {
        const collections = await withFreshConnection(async (freshPrisma) => {
          return await freshPrisma.collection.findMany({
            select: {
              id: true,
              name: true,
              description: true,
            },
          });
        });
        
        return NextResponse.json(collections);
        
      } catch (retryError) {
        console.error('Fresh connection also failed:', retryError);
        
        // Return empty array to prevent frontend crashes
        return NextResponse.json([]);
      }
    }
    
    // For other errors, return empty array
    return NextResponse.json([]);
  }
} 