import { Metadata } from "next";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { ProductGrid } from "@/components/shop/product-grid";
import { Breadcrumb } from "@/components/shop/breadcrumb";
import { Category, Collection } from "@prisma/client";
import { Product, ProductImage, ProductVariant } from "@/types/product";

interface CollectionPageProps {
  params: {
    slug: string;
  };
}

type CollectionWithProducts = Collection & {
  products: {
    product: {
      id: number;
      name: string;
      description: string;
      price: number;
      stock: number;
      slug: string | null;
      isActive: boolean;
      status: string;
      image: string | null;
      category: Category | null;
      images: ProductImage[];
      variants: ProductVariant[];
    };
  }[];
};

async function getCollection(slug: string) {
  try {
    const collection = await prisma.collection.findFirst({
      where: {
        handle: slug
      },
      include: {
        products: {
          include: {
            product: {
              include: {
                images: true,
                variants: true,
                category: true,
              },
            }
          }
        }
      }
    });

    if (!collection) {
      return null;
    }

    const products = collection.products.map(({ product: p }) => ({
      id: p.id,
      name: p.name,
      description: p.description,
      descriptionHtml: p.descriptionHtml,
      handle: p.handle,
      price: Number(p.price),
      stock: p.stock,
      reservedStock: p.reservedStock,
      slug: p.slug,
      isActive: p.isActive,
      status: p.status,
      image: p.image,
      sku: p.sku,
      inventoryTracking: p.inventoryTracking,
      lowStockThreshold: p.lowStockThreshold,
      category: p.category,
      images: p.images,
      variants: p.variants.map(v => ({
        id: v.id,
        name: v.name,
        sku: v.sku,
        price: Number(v.price),
        compareAtPrice: v.compareAtPrice ? Number(v.compareAtPrice) : null,
        stock: v.stock,
        reservedStock: v.reservedStock,
        options: v.options as Record<string, string>,
        images: v.images,
        inventoryTracking: v.inventoryTracking,
        lowStockThreshold: v.lowStockThreshold,
        productId: v.productId,
        isActive: v.isActive,
        attributes: (v.options || {}) as Record<string, string>,
      })),
      categoryId: p.categoryId,
      createdAt: p.createdAt,
      updatedAt: p.updatedAt,
    })) as unknown as Product[];

    return { collection, products };
  } catch (error) {
    console.error('Error fetching collection:', error);
    return null;
  }
}

export async function generateMetadata({ params }: CollectionPageProps): Promise<Metadata> {
  const result = await getCollection(params.slug);
  
  if (!result) {
    return {
      title: "Collection Not Found | BinWahab",
      description: "The requested collection could not be found",
    };
  }

  const { collection } = result;
  
  return {
    title: collection.seoTitle || `${collection.name} | BinWahab`,
    description: collection.seoDescription || collection.description || `Browse our ${collection.name} collection`,
    keywords: collection.seoKeywords || undefined,
    openGraph: {
      title: collection.seoTitle || `${collection.name} | BinWahab`,
      description: collection.seoDescription || collection.description || undefined,
      images: collection.image ? [{ url: collection.image }] : undefined,
    },
    twitter: {
      card: 'summary_large_image',
      title: collection.seoTitle || `${collection.name} | BinWahab`,
      description: collection.seoDescription || collection.description || undefined,
      images: collection.image ? [collection.image] : undefined,
    },
  };
}

export default async function CollectionPage({ params }: CollectionPageProps) {
  const { slug } = params;

  const result = await getCollection(slug);

  if (!result) {
    notFound();
  }

  const { collection, products } = result;

  const breadcrumbItems = [
    {
      label: "Collections",
      href: "/collections",
    },
    {
      label: collection.name,
      href: `/collections/${collection.handle}`,
    },
  ];

  return (
    <div className="container mx-auto px-4 py-8">
      <Breadcrumb items={breadcrumbItems} />
      <h1 className="text-3xl font-bold mb-8">{collection.name}</h1>
      {collection.description && (
        <div className="prose max-w-none mb-8">
          <p>{collection.description}</p>
        </div>
      )}
      <ProductGrid products={products} />
    </div>
  );
} 