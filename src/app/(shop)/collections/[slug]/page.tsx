import { Metadata } from "next";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { formatPrice } from "@/lib/utils";
import { ProductCard } from "@/components/shop/product-card";
import { Collection, Product as PrismaProduct, ProductCollection, ProductImage, Category } from "@prisma/client";
import { Product, ProductStatus } from "@/types/product";

interface CollectionPageProps {
  params: {
    slug: string;
  };
}

type CollectionWithProducts = Collection & {
  products: (ProductCollection & {
    product: PrismaProduct & {
      images: ProductImage[];
      category: Category | null;
    };
  })[];
};

export async function generateMetadata({
  params,
}: CollectionPageProps): Promise<Metadata> {
  const collection = await prisma.collection.findUnique({
    where: {
      handle: params.slug,
    },
  });

  if (!collection) {
    return {};
  }

  return {
    title: collection.name,
    description: collection.description || undefined,
  };
}

export default async function CollectionPage({
  params,
}: CollectionPageProps) {
  try {
    const collection = await prisma.collection.findUnique({
      where: {
        handle: params.slug,
      },
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
      notFound();
    }

    return (
      <div className="flex flex-col gap-8 p-4">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold">{collection.name}</h1>
          {collection.description && (
            <p className="text-muted-foreground">{collection.description}</p>
          )}
        </div>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {collection.products.map((productCollection) => {
            const prismaProduct = productCollection.product;
            const product: Product = {
              id: prismaProduct.id,
              name: prismaProduct.name,
              description: prismaProduct.description || "",
              descriptionHtml: prismaProduct.descriptionHtml,
              handle: prismaProduct.handle,
              price: prismaProduct.price.toString(),
              stock: prismaProduct.stock,
              reservedStock: prismaProduct.reservedStock,
              slug: prismaProduct.slug,
              isActive: prismaProduct.isActive,
              status: prismaProduct.status as ProductStatus,
              image: prismaProduct.image,
              sku: prismaProduct.sku,
              inventoryTracking: prismaProduct.inventoryTracking,
              lowStockThreshold: prismaProduct.lowStockThreshold,
              images: prismaProduct.images,
              variants: [],
              category: prismaProduct.category,
              categoryId: prismaProduct.categoryId,
              createdAt: prismaProduct.createdAt,
              updatedAt: prismaProduct.updatedAt,
            };
            return (
              <ProductCard
                key={product.id}
                product={product}
              />
            );
          })}
        </div>
      </div>
    );
  } catch (error) {
    console.error("Error fetching collection:", error);
    notFound();
  }
}