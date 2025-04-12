import { Metadata } from "next";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { ProductGallery } from "@/components/shop/product-gallery";
import { ProductInfo } from "@/components/shop/product-info";
import { RelatedProducts } from "@/components/shop/related-products";
import { Prisma } from "@prisma/client";

interface ProductPageProps {
  params: {
    slug: string;
  };
}

interface ProductImage {
  id: number;
  url: string;
  order: number;
  productId: number;
  createdAt: Date;
  updatedAt: Date;
}

export async function generateMetadata({
  params,
}: ProductPageProps): Promise<Metadata> {
  const product = await prisma.product.findUnique({
    where: {
      slug: params.slug,
    },
  });

  if (!product) {
    return {
      title: "Product Not Found",
    };
  }

  return {
    title: `${product.name} - BINWAHAB`,
    description: product.description,
  };
}

export default async function ProductPage({ params }: ProductPageProps) {
  // Fetch the product
  const product = await prisma.product.findUnique({
    where: {
      slug: params.slug,
    },
  });

  if (!product) {
    notFound();
  }

  // Fetch the category
  const category = await prisma.category.findUnique({
    where: {
      id: product.categoryId || "",
    },
  });

  if (!category) {
    notFound();
  }

  // Fetch product images
  const productImages = await prisma.$queryRaw<ProductImage[]>`
    SELECT id, url, "order", "productId", "createdAt", "updatedAt"
    FROM "ProductImage"
    WHERE "productId" = ${product.id}
    ORDER BY "order" ASC
  `;

  // Fetch related products
  const relatedProducts = await prisma.product.findMany({
    where: {
      categoryId: product.categoryId,
      status: "ACTIVE",
      NOT: {
        id: product.id,
      },
    },
    take: 4,
  });

  // Fetch categories for related products
  const relatedProductCategories = await prisma.category.findMany({
    where: {
      id: {
        in: relatedProducts.map(p => p.categoryId).filter(Boolean) as string[],
      },
    },
  });

  // Fetch images for related products
  const relatedProductImages = await prisma.$queryRaw<ProductImage[]>`
    SELECT id, url, "order", "productId", "createdAt", "updatedAt"
    FROM "ProductImage"
    WHERE "productId" IN (${Prisma.join(relatedProducts.map(p => p.id))})
    ORDER BY "order" ASC
  `;

  // Combine the data
  const productWithRelations = {
    ...product,
    category,
    images: productImages,
  };

  const relatedProductsWithRelations = relatedProducts.map(p => {
    const category = relatedProductCategories.find(c => c.id === p.categoryId);
    const images = relatedProductImages.filter(img => img.productId === p.id);
    return {
      ...p,
      category,
      images,
    };
  });

  return (
    <div className="bg-white">
      <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6 sm:py-24 lg:max-w-7xl lg:px-8">
        <div className="lg:grid lg:grid-cols-2 lg:items-start lg:gap-x-8">
          <ProductGallery 
            images={productImages.map(img => img.url)} 
            name={product.name} 
          />
          <ProductInfo product={productWithRelations as any} />
        </div>
        <RelatedProducts products={relatedProductsWithRelations as any} />
      </div>
    </div>
  );
} 