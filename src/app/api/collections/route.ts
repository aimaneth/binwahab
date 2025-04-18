import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { z } from "zod";
import { Prisma, Collection, Product, DisplaySection, ProductImage, CollectionSortOption, ProductVariant } from "@prisma/client";

const collectionSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  descriptionHtml: z.string().optional(),
  image: z.string().optional(),
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
          images: true,
          variants: true
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
  slug: string;
  name: string;
  description: string | null;
  images: { url: string }[];
  variants: {
    id: string;
    name: string;
    price: number;
    compareAtPrice: number | null;
    stock: number;
  }[];
};

type TransformedCollection = {
  id: string;
  name: string;
  description: string | null;
  descriptionHtml: string | null;
  image: string | null;
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
      include: collectionInclude
    });

    // Transform the response to include products directly
    const transformedCollections: TransformedCollection[] = collections.map((collection: CollectionWithProducts) => {
      const products: TransformedProduct[] = collection.products.map(({ product }) => ({
        id: product.id.toString(),
        slug: product.slug || product.handle || `product-${product.id}`,
        name: product.name,
        description: product.description,
        images: product.images.map((img: ProductImage) => ({ url: img.url })),
        variants: product.variants.map((variant: ProductVariant) => ({
          id: variant.id.toString(),
          name: variant.name,
          price: Number(variant.price),
          compareAtPrice: variant.compareAtPrice ? Number(variant.compareAtPrice) : null,
          stock: variant.stock
        }))
      }));

      return {
        id: collection.id.toString(),
        name: collection.name,
        description: collection.description,
        descriptionHtml: collection.descriptionHtml,
        image: collection.image,
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