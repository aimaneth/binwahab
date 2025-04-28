import { Metadata } from "next";
import { ProductGrid } from "@/components/shop/product-grid";
import { ShopFilters } from "@/components/shop/shop-filters";
import { prisma } from "@/lib/prisma";
import { Product as PrismaProduct, ProductImage, ProductVariant as PrismaVariant, Category as PrismaCategory, Collection, Prisma } from "@prisma/client";
import { Product } from "@/types/product";
import { notFound, redirect } from "next/navigation";

export const dynamic = 'force-dynamic';

interface CollectionWithProducts extends Collection {
  products: Product[];
}

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const collection = await prisma.collection.findUnique({
    where: { handle: params.slug },
  });

  if (!collection) {
    return {
      title: "Collection Not Found - BINWAHAB",
      description: "The requested collection could not be found.",
    };
  }

  return {
    title: `${collection.name} - BINWAHAB`,
    description: collection.description || `Browse our ${collection.name} collection`,
  };
}

interface CollectionPageProps {
  params: { slug: string };
  searchParams: { [key: string]: string | string[] | undefined };
}

type ProductWithRelations = PrismaProduct & {
  images: ProductImage[];
  variants: (PrismaVariant & { images: ProductImage[] })[];
  category: PrismaCategory | null;
};

export default async function CollectionPage({ params, searchParams }: CollectionPageProps) {
  // Fetch collection to get its ID
  const collection = await prisma.collection.findUnique({
    where: { handle: params.slug }
  });

  if (!collection) {
    redirect('/shop');
  }

  // Redirect to the new collection route
  redirect(`/shop/collection/${params.slug}`);
}