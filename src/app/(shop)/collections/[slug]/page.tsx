import { Metadata } from "next";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { ProductCard } from "@/components/shop/product-card";
import { ProductFilters } from "@/components/shop/product-filters";
import { SearchBar } from "@/components/shop/search-bar";
import { Breadcrumb } from "@/components/shop/breadcrumb";
import { Product } from "@/types/product";
import { Prisma } from "@prisma/client";

interface CollectionPageProps {
  params: {
    slug: string;
  };
}

type CollectionWithProducts = Prisma.CollectionGetPayload<{
  include: {
    products: {
      include: {
        product: {
          include: {
            images: true;
            category: true;
          };
        };
      };
    };
  };
}>;

type ProductWithRelations = Prisma.ProductGetPayload<{
  include: {
    images: true;
    category: true;
  };
}>;

async function getCollection(slug: string) {
  const collection = await prisma.collection.findUnique({
    where: { slug },
    include: {
      products: {
        include: {
          product: {
            include: {
              images: true,
              category: true,
            },
          },
        },
      },
    },
  }) as CollectionWithProducts | null;

  if (!collection) {
    return null;
  }

  // Transform the products to match the Product type
  const products = collection.products.map((pc) => {
    const product = pc.product as ProductWithRelations;
    return {
      id: product.id,
      name: product.name,
      description: product.description,
      image: product.image,
      price: product.price,
      stock: product.stock,
      reservedStock: product.reservedStock,
      slug: product.slug,
      isActive: product.isActive,
      status: product.status,
      categoryId: product.categoryId,
      createdAt: product.createdAt,
      updatedAt: product.updatedAt,
      images: product.images.map((img) => ({
        id: img.id,
        url: img.url,
        order: img.order,
        productId: img.productId,
        createdAt: img.createdAt,
        updatedAt: img.updatedAt,
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
        order: product.category.order,
      } : null,
      sku: product.sku,
      inventoryTracking: product.inventoryTracking,
      lowStockThreshold: product.lowStockThreshold,
    } satisfies Product;
  });

  return {
    ...collection,
    products,
  };
}

export async function generateMetadata({ params }: CollectionPageProps): Promise<Metadata> {
  const collection = await getCollection(params.slug);
  
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

export default async function CollectionPage({ params }: CollectionPageProps) {
  const collection = await getCollection(params.slug);
  
  if (!collection) {
    notFound();
  }

  const breadcrumbItems = [
    { label: "Home", href: "/" },
    { label: "Collections", href: "/collections" },
    { label: collection.name, href: `/collections/${collection.slug}` },
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Collection Header */}
      <div className="relative bg-black text-white">
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 to-black/20" />
        {collection.image && (
          <div className="absolute inset-0">
            <img
              src={collection.image}
              alt={collection.name}
              className="w-full h-full object-cover opacity-50"
            />
          </div>
        )}
        <div className="relative container mx-auto px-4 py-24">
          <div className="text-white/80">
            <Breadcrumb items={breadcrumbItems} />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mt-4 mb-6">{collection.name}</h1>
          {collection.description && (
            <p className="text-lg text-white/80 max-w-2xl">{collection.description}</p>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        {/* Search Bar - Full Width */}
        <div className="mb-8">
          <SearchBar />
        </div>

        {/* Products Section with Sidebar */}
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar Filters */}
          <div className="lg:w-64 flex-shrink-0">
            <div className="sticky top-8">
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-lg font-semibold mb-4">Filters</h2>
                <ProductFilters />
              </div>
            </div>
          </div>

          {/* Products Grid */}
          <div className="flex-1">
            {/* Products Count */}
            <div className="mb-6">
              <p className="text-sm text-gray-600">
                Showing {collection.products.length} products
              </p>
            </div>

            {/* Products Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {collection.products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>

            {/* Empty State */}
            {collection.products.length === 0 && (
              <div className="text-center py-12 bg-gray-50 rounded-lg">
                <h3 className="text-lg font-medium text-gray-900">No products found</h3>
                <p className="mt-2 text-sm text-gray-500">
                  We couldn't find any products in this collection.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 