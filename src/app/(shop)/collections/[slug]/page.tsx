import { Metadata } from "next";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { ProductGrid } from "@/components/shop/product-grid";
import { Breadcrumb } from "@/components/shop/breadcrumb";
import { Category, Collection } from "@prisma/client";
import { Product, ProductImage, ProductVariant, ProductStatus } from "@/types/product";

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

    // Convert Prisma Decimal to string for price fields and number for other numeric fields
    const products = collection.products.map(({ product: p }) => {
      // Helper function to safely convert Decimal to string for prices
      const toPriceString = (val: any) => val ? val.toString() : '0';
      
      // Helper function to safely convert Decimal to number for quantities
      const toNumber = (val: any) => val ? Number(val.toString()) : 0;

      // Map Prisma ProductStatus to our ProductStatus type
      const mapStatus = (status: string): ProductStatus => {
        switch (status) {
          case 'ACTIVE':
            return 'ACTIVE';
          case 'HIDDEN':
            return 'DRAFT';
          case 'ARCHIVED':
            return 'ARCHIVED';
          default:
            return 'DRAFT';
        }
      };

      return {
        id: p.id,
        name: p.name,
        description: p.description || '',
        descriptionHtml: p.descriptionHtml || '',
        handle: p.handle || '',
        price: toPriceString(p.price),
        stock: toNumber(p.stock),
        reservedStock: toNumber(p.reservedStock),
        slug: p.slug || '',
        isActive: p.isActive || false,
        status: mapStatus(p.status),
        image: p.image || null,
        sku: p.sku || '',
        inventoryTracking: p.inventoryTracking || false,
        lowStockThreshold: toNumber(p.lowStockThreshold),
        category: p.category || null,
        images: p.images || [],
        variants: (p.variants || []).map(v => ({
          id: v.id,
          name: v.name || '',
          sku: v.sku || '',
          price: toPriceString(v.price),
          compareAtPrice: v.compareAtPrice ? toPriceString(v.compareAtPrice) : null,
          stock: toNumber(v.stock),
          reservedStock: toNumber(v.reservedStock),
          options: v.options as Record<string, string>,
          images: v.images || [],
          inventoryTracking: v.inventoryTracking || false,
          lowStockThreshold: toNumber(v.lowStockThreshold),
          productId: v.productId,
          isActive: v.isActive || false,
          attributes: (v.options || {}) as Record<string, string>,
        })),
        categoryId: p.categoryId,
        createdAt: p.createdAt,
        updatedAt: p.updatedAt,
      };
    });

    return {
      collection: {
        ...collection,
        createdAt: collection.createdAt,
        updatedAt: collection.updatedAt,
      },
      products
    };
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