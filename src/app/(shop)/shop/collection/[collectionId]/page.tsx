import { Metadata } from "next";
import { Navbar } from "@/components/ui/navbar";
import { Footer } from "@/components/ui/footer";
import { CollectionProductCard } from "@/components/shop/collection-product-card";
import { ProductFilters } from "@/components/shop/product-filters";
import { SearchBar } from "@/components/shop/search-bar";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Prisma, Product, Category, ProductCollection, ProductImage as PrismaProductImage, ProductVariant as PrismaProductVariant } from "@prisma/client";
import { Product as ProductType } from "@/types/product";

type ProductWithRelations = Prisma.ProductGetPayload<{
  include: {
    category: true;
    images: true;
    variants: true;
  };
}>;

interface CollectionProductRelation {
  product: ProductWithRelations;
}

type CollectionWithProducts = {
  id: string;
  name: string;
  description: string | null;
  image: string | null;
  image2: string | null;
  products: ProductType[];
};

async function getCollection(collectionId: string): Promise<CollectionWithProducts | null> {
  const collection = await prisma.collection.findUnique({
    where: { id: collectionId },
    include: {
      products: {
        include: {
          product: {
            include: {
              category: true,
              images: true,
              variants: true
            }
          }
        }
      }
    }
  });

  if (!collection) {
    return null;
  }

  // Transform products to match the expected Product type
  const validProducts = collection.products
    .filter((pc: CollectionProductRelation) => pc.product.category !== null && pc.product.slug !== null)
    .map((pc: CollectionProductRelation) => ({
      id: Number(pc.product.id),
      name: pc.product.name,
      description: pc.product.description || "",
      descriptionHtml: pc.product.descriptionHtml,
      handle: pc.product.handle,
      price: pc.product.price.toString(),
      stock: pc.product.stock,
      reservedStock: pc.product.reservedStock,
      slug: pc.product.slug!,
      isActive: pc.product.isActive,
      status: pc.product.status,
      image: pc.product.image,
      sku: pc.product.sku,
      inventoryTracking: pc.product.inventoryTracking,
      lowStockThreshold: pc.product.lowStockThreshold,
      images: pc.product.images.map((img: PrismaProductImage) => ({
        id: Number(img.id),
        url: img.url,
        order: img.order,
        productId: Number(img.productId),
        createdAt: img.createdAt,
        updatedAt: img.updatedAt
      })),
      variants: pc.product.variants.map((variant: PrismaProductVariant) => ({
        id: Number(variant.id),
        name: variant.name,
        sku: variant.sku || "",
        price: variant.price.toString(),
        compareAtPrice: variant.compareAtPrice?.toString() || null,
        stock: variant.stock,
        reservedStock: variant.reservedStock,
        options: {},
        images: [],
        inventoryTracking: variant.inventoryTracking,
        lowStockThreshold: variant.lowStockThreshold,
        productId: Number(variant.productId),
        isActive: variant.isActive,
        barcode: variant.barcode,
        weight: variant.weight?.toString() || null,
        weightUnit: variant.weightUnit,
        dimensions: typeof variant.dimensions === 'object' ? variant.dimensions as Record<string, any> : null
      })),
      category: pc.product.category,
      categoryId: pc.product.categoryId,
      createdAt: pc.product.createdAt,
      updatedAt: pc.product.updatedAt
    } satisfies ProductType));

  return {
    id: collection.id,
    name: collection.name,
    description: collection.description,
    image: collection.image,
    image2: collection.image2,
    products: validProducts
  };
}

export async function generateMetadata({ params }: { params: { collectionId: string } }): Promise<Metadata> {
  const collection = await getCollection(params.collectionId);
  
  if (!collection) {
    return {
      title: "Collection Not Found | BinWahab",
      description: "The requested collection could not be found",
    };
  }
  
  return {
    title: `${collection.name} | BinWahab`,
    description: collection.description || `Browse our ${collection.name} collection`,
  };
}

export default async function CollectionPage({ params }: { params: { collectionId: string } }) {
  const collection = await getCollection(params.collectionId);
  
  if (!collection) {
    notFound();
  }

  // Fetch all categories for the filters
  const categories = await prisma.category.findMany({
    where: {
      isActive: true,
    },
    orderBy: {
      order: 'asc',
    },
  });

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Navbar />
      
      <main className="flex-1">
        {/* Collection Header */}
        <div className="bg-black text-white py-12">
          <div className="container mx-auto px-4">
            <h1 className="text-3xl md:text-4xl font-bold mb-4">{collection.name}</h1>
            {collection.description && (
              <p className="text-lg text-gray-300 max-w-2xl">{collection.description}</p>
            )}
          </div>
        </div>

        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col gap-8">
            {/* Search and Filters Header */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <SearchBar />
              <ProductFilters categories={categories} />
            </div>

            {/* Products Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {collection.products.map((product) => (
                <CollectionProductCard key={product.id} product={product} />
              ))}
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
} 