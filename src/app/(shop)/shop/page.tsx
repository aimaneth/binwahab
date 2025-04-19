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
  variants: (PrismaVariant & { images: ProductImage[] })[];
  category: PrismaCategory | null;
};

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

    // Convert Prisma products to our Product type
    products = (dbProducts as ProductWithRelations[]).map(product => ({
      id: product.id,
      name: product.name,
      description: product.description,
      descriptionHtml: product.descriptionHtml,
      handle: product.handle || '',
      price: String(product.price),
      stock: product.stock,
      reservedStock: product.reservedStock,
      slug: product.slug || `product-${product.id}`,
      isActive: product.isActive,
      status: product.status as "ACTIVE" | "DRAFT" | "ARCHIVED",
      image: product.image,
      sku: product.sku,
      inventoryTracking: product.inventoryTracking,
      lowStockThreshold: product.lowStockThreshold,
      images: product.images.map(img => ({
        id: img.id,
        url: img.url,
        order: img.order,
        productId: img.productId,
        createdAt: img.createdAt,
        updatedAt: img.updatedAt
      })),
      variants: product.variants.map(variant => ({
        id: variant.id,
        name: variant.name,
        sku: variant.sku,
        price: String(variant.price),
        compareAtPrice: variant.compareAtPrice ? String(variant.compareAtPrice) : null,
        stock: variant.stock,
        reservedStock: variant.reservedStock,
        options: variant.options as Record<string, string>,
        images: variant.images,
        inventoryTracking: variant.inventoryTracking,
        lowStockThreshold: variant.lowStockThreshold,
        productId: variant.productId,
        isActive: variant.isActive,
        barcode: variant.barcode,
        weight: variant.weight ? String(variant.weight) : null,
        weightUnit: variant.weightUnit,
        dimensions: variant.dimensions as Record<string, any>,
        attributes: variant.options as Record<string, any>
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
            <h1 className="text-3xl font-bold">Shop</h1>
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