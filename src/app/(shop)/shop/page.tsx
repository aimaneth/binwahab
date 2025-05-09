import { Metadata } from "next";
import { ProductGrid } from "@/components/shop/product-grid";
import { ShopFilters } from "@/components/shop/shop-filters";
import { PrismaClient } from "@prisma/client";
import { Product as PrismaProduct, ProductImage, ProductVariant as PrismaVariant, Category as PrismaCategory } from "@prisma/client";
import { Product } from "@/types/product";

const prisma = new PrismaClient();

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
      images: product.images.map(image => ({
        id: image.id,
        url: image.url,
        order: image.order,
        productId: image.productId,
        createdAt: image.createdAt,
        updatedAt: image.updatedAt
      })),
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
        weight: variant.weight?.toString(),
        weightUnit: variant.weightUnit,
        dimensions: variant.dimensions as Record<string, number> | null
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

    // Sort products to show in-stock items first
    products.sort((a, b) => {
      const aHasStock = a.stock > 0 || a.variants.some(v => v.stock > 0);
      const bHasStock = b.stock > 0 || b.variants.some(v => v.stock > 0);
      
      if (aHasStock && !bHasStock) return -1;
      if (!aHasStock && bHasStock) return 1;
      
      // If both have same stock status, maintain original sort order
      if (searchParams.sort === 'price_desc') return Number(b.price) - Number(a.price);
      if (searchParams.sort === 'price_asc') return Number(a.price) - Number(b.price);
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
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