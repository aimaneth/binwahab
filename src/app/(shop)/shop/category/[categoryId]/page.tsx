import { Metadata } from "next";
import { ProductCard } from "@/components/shop/product-card";
import { ProductFilters } from "@/components/shop/product-filters";
import { SearchBar } from "@/components/shop/search-bar";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Product, ProductStatus } from "@/types/product";

interface ProductWithCategories extends Product {
  category: {
    id: string;
    name: string;
    description: string;
    isActive: boolean;
    order: number;
    slug: string;
    image: string | null;
    createdAt: Date;
    updatedAt: Date;
    parentId: string | null;
    seoTitle: string | null;
    seoDescription: string | null;
    seoKeywords: string | null;
  } | null;
  options?: Record<string, string>;
}

export async function generateMetadata({ params }: { params: { categoryId: string } }): Promise<Metadata> {
  // Try to find by slug first, then by id
  let category = await prisma.category.findUnique({
    where: { slug: params.categoryId },
  });
  if (!category) {
    category = await prisma.category.findUnique({
      where: { id: params.categoryId },
    });
  }
  if (!category) {
    return {
      title: "Category Not Found - BINWAHAB",
    };
  }
  return {
    title: `${category.name} - BINWAHAB`,
    description: category.description || undefined,
  };
}

export default async function CategoryPage({ params }: { params: { categoryId: string } }) {
  // Try to find by slug first, then by id
  let category = await prisma.category.findUnique({
    where: { slug: params.categoryId },
    include: {
      products: {
        where: {
          status: "ACTIVE",
        },
        include: {
          category: true,
          images: true,
          variants: true,
        },
      },
    },
  });
  if (!category) {
    category = await prisma.category.findUnique({
      where: { id: params.categoryId },
      include: {
        products: {
          where: {
            status: "ACTIVE",
          },
          include: {
            category: true,
            images: true,
            variants: true,
          },
        },
      },
    });
  }
  if (!category) {
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

  // Convert Prisma products to our Product type
  const productsWithCategories = category.products.map((product) => ({
    id: product.id,
    name: product.name,
    description: product.description || "",
    descriptionHtml: product.descriptionHtml || "",
    handle: product.slug || "",
    slug: product.slug || "",
    status: product.status as ProductStatus,
    price: Number(product.price),
    stock: product.stock || 0,
    reservedStock: product.reservedStock || 0,
    isActive: product.isActive,
    image: product.images[0]?.url || "",
    sku: product.sku || "",
    inventoryTracking: product.inventoryTracking || false,
    images: product.images.map(img => ({
      id: img.id,
      url: img.url,
      order: img.order,
    })),
    variants: product.variants.map(variant => ({
      id: variant.id,
      name: variant.name,
      price: Number(variant.price),
      compareAtPrice: variant.compareAtPrice ? Number(variant.compareAtPrice) : null,
      stock: variant.stock,
      isActive: variant.isActive,
      images: variant.images as string[],
      attributes: variant.options as Record<string, string>,
    })),
    category: product.category ? {
      id: product.category.id,
      name: product.category.name,
      description: product.category.description || "",
      isActive: product.category.isActive,
      order: product.category.order,
      slug: product.category.slug || "",
      image: product.category.image || null,
      createdAt: product.category.createdAt,
      updatedAt: product.category.updatedAt,
      parentId: product.category.parentId,
      seoTitle: product.category.seoTitle || null,
      seoDescription: product.category.seoDescription || null,
      seoKeywords: product.category.seoKeywords || null,
    } : null,
    createdAt: product.createdAt,
    updatedAt: product.updatedAt,
    seo: {
      title: product.name,
      description: product.description || "",
    },
  })) as unknown as ProductWithCategories[];

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <main className="flex-1">
        {/* Collection Header */}
        <div className="bg-black text-white py-12">
          <div className="container mx-auto px-4">
            <h1 className="text-3xl md:text-4xl font-bold mb-4">{category.name}</h1>
            {category.description && (
              <p className="text-lg text-gray-300 max-w-2xl">{category.description}</p>
            )}
          </div>
        </div>

        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col gap-8">
            {/* Search and Filters Header */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center">
                <span className="text-sm text-gray-500">
                  {category.products.length} items
                </span>
              </div>
              <SearchBar />
            </div>

            <div className="flex flex-col gap-8 lg:flex-row">
              {/* Filters Sidebar */}
              <div className="w-full lg:w-64">
                <ProductFilters categories={categories} />
              </div>

              {/* Product Grid */}
              <div className="flex-1">
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {productsWithCategories.map((product) => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
} 