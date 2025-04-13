import { Metadata } from "next";
import { ProductGrid } from "@/components/shop/product-grid";
import { CategoryFilter } from "@/components/shop/category-filter";
import { SortSelect } from "@/components/shop/sort-select";
import { SearchInput } from "@/components/shop/search-input";
import { prisma } from "@/lib/prisma";
import { Category } from "@prisma/client";
import { Product } from "@/types/product";

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: "Shop - BINWAHAB",
  description: "Browse our collection of trendy fashion items",
};

interface ShopPageProps {
  searchParams: { [key: string]: string | string[] | undefined };
}

export default async function ShopPage({ searchParams }: ShopPageProps) {
  let products: Product[] = [];
  let error: string | null = null;

  try {
    // Fetch products based on search parameters
    const dbProducts = await prisma.product.findMany({
      where: {
        status: "ACTIVE",
        ...(searchParams.category ? {
          categoryId: searchParams.category as string
        } : {}),
        ...(searchParams.search ? {
          OR: [
            { name: { contains: searchParams.search as string, mode: 'insensitive' } },
            { description: { contains: searchParams.search as string, mode: 'insensitive' } },
          ]
        } : {}),
      },
      include: {
        category: true,
        images: true,
        variants: true,
      },
      orderBy: searchParams.sort === 'price_desc' 
        ? { price: 'desc' }
        : searchParams.sort === 'price_asc'
        ? { price: 'asc' }
        : { createdAt: 'desc' },
    });

    // Convert Prisma products to our Product type
    products = dbProducts.map(p => ({
      ...p,
      slug: p.slug || p.handle || `product-${p.id}`, // Ensure we always have a slug
      images: p.images,
      variants: p.variants.map(v => ({
        ...v,
        options: v.options as Record<string, string>,
        attributes: (v.options || {}) as Record<string, string>,
      })),
      // Add default values for optional fields
      handle: p.handle || '',
      compareAtPrice: null,
      costPerItem: null,
      barcode: null,
      inventoryPolicy: "DENY" as "DENY" | "CONTINUE",
      allowBackorder: false,
      taxable: false,
      taxCode: null,
      weight: null,
      weightUnit: null,
      requiresShipping: false,
      shippingProfile: null,
      fulfillmentService: null,
      metaTitle: null,
      metaDescription: null,
      metaKeywords: null,
      ogImage: null,
      twitterImage: null,
      seoTitle: null,
      seoDescription: null,
      seoKeywords: null,
      vendor: null,
      type: null,
      tags: [],
      metafields: [],
      optionsJson: null,
      publishedAt: null,
    })) as unknown as Product[];
  } catch (err) {
    console.error("Error fetching products:", err);
    error = "Failed to load products. Please try again later.";
  }

  return (
    <main className="container mx-auto px-4 py-8">
      <div className="flex flex-col gap-8">
        <div className="flex flex-col gap-4">
          <h1 className="text-3xl font-bold">Shop</h1>
          <div className="flex flex-col md:flex-row gap-4">
            <SearchInput />
            <div className="flex gap-4">
              <CategoryFilter />
              <SortSelect />
            </div>
          </div>
        </div>
        
        {error ? (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        ) : (
          <ProductGrid products={products} />
        )}
      </div>
    </main>
  );
} 