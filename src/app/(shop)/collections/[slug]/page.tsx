import { Metadata } from "next";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { ProductGrid } from "@/components/shop/product-grid";
import { Breadcrumb } from "@/components/shop/breadcrumb";
import { Product, Category, Collection } from "@prisma/client";

interface CollectionPageProps {
  params: {
    slug: string;
  };
}

interface ProductWithRelations extends Product {
  category: Category | null;
  images: { url: string }[];
}

type CollectionWithProducts = Collection & {
  products: {
    product: ProductWithRelations;
  }[];
};

async function getCollection(slug: string) {
  try {
    const collection = await prisma.collection.findFirst({
      where: {
        slug: slug
      },
      include: {
        products: {
          include: {
            product: {
              include: {
                category: true
              }
            }
          }
        }
      }
    }) as CollectionWithProducts | null;

    if (!collection) {
      return null;
    }

    const products = collection.products.map(({ product: p }) => ({
      ...p,
      images: [] // We'll handle images separately if needed
    }));

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
  const result = await getCollection(params.slug);

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
      href: `/collections/${collection.slug}`,
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