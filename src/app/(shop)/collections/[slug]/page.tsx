import { Metadata } from "next";
import { ProductGrid } from "@/components/shop/product-grid";
import { ShopFilters } from "@/components/shop/shop-filters";
import { prisma } from "@/lib/prisma";
import { Product as PrismaProduct, ProductImage, ProductVariant as PrismaVariant, Category as PrismaCategory, Collection } from "@prisma/client";
import { Product } from "@/types/product";
import { notFound } from "next/navigation";

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
  let products: Product[] = [];
  let collection: Collection | null = null;
  let error: string | null = null;

  try {
    // Fetch collection and its products
    collection = await prisma.collection.findUnique({
      where: { handle: params.slug },
      include: {
        products: {
          include: {
            product: true
          }
        }
      }
    });

    if (!collection) {
      return notFound();
    }

    const dbProducts = await prisma.product.findMany({
      where: {
        status: "ACTIVE",
        collections: {
          some: {
            collectionId: collection.id
          }
        },
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
    console.error("Error fetching collection and products:", err);
    error = "Failed to load collection. Please try again later.";
  }

  return (
    <main className="container mx-auto px-4 py-8">
      <div className="flex flex-col gap-8">
        <div className="flex flex-col gap-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">{collection?.name}</h1>
              {collection?.description && (
                <p className="mt-2 text-gray-600">{collection.description}</p>
              )}
            </div>
          </div>
          <ShopFilters />
        </div>
        
        {error ? (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-12">
            <h2 className="text-xl font-semibold text-gray-900">No products found in this collection</h2>
            <p className="mt-2 text-gray-500">Try adjusting your search or filter criteria</p>
          </div>
        ) : (
          <ProductGrid products={products} />
        )}
      </div>
    </main>
  );
}