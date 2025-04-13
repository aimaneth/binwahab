import { Metadata } from "next";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { ProductGallery } from "@/components/shop/product-gallery";
import { ProductInfo } from "@/components/shop/product-info";
import { RelatedProducts } from "@/components/shop/related-products";
import { Product, Category } from "@/types/product";
import { Prisma } from "@prisma/client";

interface ProductPageProps {
  params: {
    slug: string;
  };
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
  const product = await prisma.product.findUnique({
    where: {
      slug: params.slug,
    },
    select: {
      id: true,
      name: true,
      description: true,
      descriptionHtml: true,
      handle: true,
      price: true,
      compareAtPrice: true,
      costPerItem: true,
      stock: true,
      reservedStock: true,
      slug: true,
      isActive: true,
      status: true,
      image: true,
      sku: true,
      barcode: true,
      inventoryTracking: true,
      inventoryPolicy: true,
      allowBackorder: true,
      lowStockThreshold: true,
      taxable: true,
      taxCode: true,
      weight: true,
      weightUnit: true,
      requiresShipping: true,
      shippingProfile: true,
      fulfillmentService: true,
      metaTitle: true,
      metaDescription: true,
      metaKeywords: true,
      ogImage: true,
      twitterImage: true,
      seoTitle: true,
      seoDescription: true,
      seoKeywords: true,
      vendor: true,
      type: true,
      tags: true,
      categoryId: true,
      createdAt: true,
      updatedAt: true,
      publishedAt: true,
      optionsJson: true,
      category: {
        select: {
          id: true,
          name: true,
          slug: true,
          description: true,
          image: true,
          isActive: true,
          parentId: true,
          seoTitle: true,
          seoDescription: true,
          seoKeywords: true,
          createdAt: true,
          updatedAt: true,
          order: true,
        },
      },
      images: {
        select: {
          id: true,
          url: true,
          order: true,
          productId: true,
          createdAt: true,
          updatedAt: true,
        },
        orderBy: {
          order: "asc",
        },
      },
      variants: true,
      metafields: true,
    },
  });

  if (!product || !product.category) {
    notFound();
  }

  const relatedProducts = await prisma.product.findMany({
    where: {
      categoryId: product.categoryId,
      status: "ACTIVE",
      NOT: {
        id: product.id,
      },
    },
    take: 4,
    select: {
      id: true,
      name: true,
      description: true,
      descriptionHtml: true,
      handle: true,
      price: true,
      compareAtPrice: true,
      costPerItem: true,
      stock: true,
      reservedStock: true,
      slug: true,
      isActive: true,
      status: true,
      image: true,
      sku: true,
      barcode: true,
      inventoryTracking: true,
      inventoryPolicy: true,
      allowBackorder: true,
      lowStockThreshold: true,
      taxable: true,
      taxCode: true,
      weight: true,
      weightUnit: true,
      requiresShipping: true,
      shippingProfile: true,
      fulfillmentService: true,
      metaTitle: true,
      metaDescription: true,
      metaKeywords: true,
      ogImage: true,
      twitterImage: true,
      seoTitle: true,
      seoDescription: true,
      seoKeywords: true,
      vendor: true,
      type: true,
      tags: true,
      categoryId: true,
      createdAt: true,
      updatedAt: true,
      optionsJson: true,
      publishedAt: true,
      category: {
        select: {
          id: true,
          name: true,
          slug: true,
          description: true,
          image: true,
          isActive: true,
          parentId: true,
          seoTitle: true,
          seoDescription: true,
          seoKeywords: true,
          createdAt: true,
          updatedAt: true,
          order: true,
        },
      },
      images: {
        select: {
          id: true,
          url: true,
          order: true,
          productId: true,
          createdAt: true,
          updatedAt: true,
        },
        orderBy: {
          order: "asc",
        },
      },
      variants: true,
      metafields: true,
    },
  });

  // Filter out products with null categories
  const productsWithCategories = relatedProducts.filter(p => p.category !== null);

  // Convert Prisma model to our Product type
  const typedProduct: Product = {
    ...product,
    category: product.category as Category,
    images: product.images.map(img => ({
      ...img,
      id: Number(img.id),
      productId: Number(img.productId),
    })),
    tags: product.tags || [],
    variants: product.variants || [],
    metafields: product.metafields || [],
    optionsJson: product.optionsJson || null,
    publishedAt: product.publishedAt || null,
  };

  // Use the Prisma types directly for related products
  const typedRelatedProducts = productsWithCategories;

  return (
    <div className="bg-white">
      <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6 sm:py-24 lg:max-w-7xl lg:px-8">
        <div className="lg:grid lg:grid-cols-2 lg:items-start lg:gap-x-8">
          <ProductGallery images={typedProduct.images.map(img => img.url)} name={typedProduct.name} />
          <ProductInfo product={typedProduct} />
        </div>
        <RelatedProducts products={typedRelatedProducts} />
      </div>
    </div>
  );
} 