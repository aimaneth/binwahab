import { Metadata } from "next";
import { ProductGrid } from "@/components/shop/product-grid";
import { ShopFilters } from "@/components/shop/shop-filters";
import { prisma } from "@/lib/prisma";
import { Product as PrismaProduct, ProductImage, ProductVariant as PrismaVariant, Category as PrismaCategory } from "@prisma/client";
import { Product } from "@/types/product";

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: "Shop - BINWAHAB",
  description: "Browse our collection of trendy fashion items",
};

interface ShopPageProps {
  searchParams: { [key: string]: string | string[] | undefined };
}

type ProductWithRelations = PrismaProduct & {
  images: ProductImage[];
  variants: PrismaVariant[];
  category: PrismaCategory | null;
};

export default async function ShopPage({ searchParams }: ShopPageProps) {
  let products: Product[] = [];
  let error: string | null = null;
  let collectionName: string | null = null;

  try {
    // If collection is selected, get its name
    if (searchParams.collection) {
      const collection = await prisma.collection.findUnique({
        where: { id: searchParams.collection as string },
        select: { name: true }
      });
      if (collection) {
        collectionName = collection.name;
      }
    }

    // Fetch products based on search parameters
    const dbProducts = await prisma.product.findMany({
      where: {
        status: "ACTIVE",
        ...(searchParams.category ? {
          categoryId: searchParams.category as string
        } : {}),
        ...(searchParams.collection ? {
          collections: {
            some: {
              collectionId: searchParams.collection as string
            }
          }
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
        images: {
          orderBy: {
            order: 'asc'
          }
        },
        variants: true
      },
      orderBy: searchParams.sort === 'price_desc' 
        ? { price: 'desc' }
        : searchParams.sort === 'price_asc'
        ? { price: 'asc' }
        : { createdAt: 'desc' },
    });

    products = (dbProducts as ProductWithRelations[]).map(product => ({
      id: product.id,
      name: product.name,
      description: product.description || "",
      descriptionHtml: product.descriptionHtml,
      handle: product.handle || '',
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
      images: product.images.map(image => ({
        id: image.id,
        url: image.url,
        productId: image.productId,
        order: image.order,
        createdAt: image.createdAt,
        updatedAt: image.updatedAt
      })),
      variants: product.variants.map(variant => ({
        id: variant.id,
        name: variant.name,
        price: variant.price.toString(),
        stock: variant.stock,
        sku: variant.sku,
        isActive: variant.isActive,
        options: variant.options as Record<string, string>,
        images: variant.images || [],
        inventoryTracking: variant.inventoryTracking,
        lowStockThreshold: variant.lowStockThreshold,
        productId: variant.productId,
        barcode: variant.barcode,
        weight: variant.weight ? variant.weight.toString() : null,
        weightUnit: variant.weightUnit,
        dimensions: variant.dimensions as Record<string, any>,
        attributes: variant.options as Record<string, any>,
        reservedStock: variant.reservedStock,
        compareAtPrice: variant.compareAtPrice ? variant.compareAtPrice.toString() : null
      })),
      category: product.category ? {
        id: product.category.id,
        name: product.category.name,
        slug: product.category.slug,
        description: product.category.description,
        image: product.category.image,
        isActive: product.category.isActive,
        parentId: product.category.parentId,
        seoTitle: product.category.seoTitle,
        seoDescription: product.category.seoDescription,
        seoKeywords: product.category.seoKeywords,
        createdAt: product.category.createdAt,
        updatedAt: product.category.updatedAt,
        order: product.category.order
      } : null,
      categoryId: product.categoryId,
      createdAt: product.createdAt,
      updatedAt: product.updatedAt
    }));
  } catch (err) {
    console.error("Error fetching products:", err);
    error = "Failed to load products. Please try again later.";
  }

  return (
    <main className="container mx-auto px-4 py-8">
      <div className="flex flex-col gap-8">
        <div className="flex flex-col gap-6">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold">
              {collectionName ? collectionName : "Shop"}
            </h1>
          </div>
          <ShopFilters />
        </div>
        
        {error ? (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-12">
            <h2 className="text-xl font-semibold text-gray-900">No products found</h2>
            <p className="mt-2 text-gray-500">Try adjusting your search or filter criteria</p>
          </div>
        ) : (
          <ProductGrid products={products} />
        )}
      </div>
    </main>
  );
} 