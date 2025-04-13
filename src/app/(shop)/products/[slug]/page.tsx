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
      price: true,
      stock: true,
      reservedStock: true,
      slug: true,
      isActive: true,
      status: true,
      image: true,
      sku: true,
      inventoryTracking: true,
      lowStockThreshold: true,
      categoryId: true,
      createdAt: true,
      updatedAt: true,
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
      price: true,
      stock: true,
      reservedStock: true,
      slug: true,
      isActive: true,
      status: true,
      image: true,
      sku: true,
      inventoryTracking: true,
      lowStockThreshold: true,
      categoryId: true,
      createdAt: true,
      updatedAt: true,
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
    // Provide default values for optional fields
    handle: '',
    compareAtPrice: null,
    costPerItem: null,
    barcode: null,
    inventoryPolicy: "DENY" as "DENY" | "CONTINUE",
    allowBackorder: false,
    taxable: false,
    taxCode: null,
    weight: null,
    weightUnit: null,
    requiresShipping: false,
    shippingProfile: null,
    fulfillmentService: null,
    metaTitle: null,
    metaDescription: null,
    metaKeywords: null,
    ogImage: null,
    twitterImage: null,
    seoTitle: null,
    seoDescription: null,
    seoKeywords: null,
    vendor: null,
    type: null,
    tags: [],
    variants: product.variants || [],
    metafields: [],
    optionsJson: null,
    publishedAt: null,
  };

  // Use the Prisma types directly for related products
  const typedRelatedProducts = productsWithCategories.map(product => ({
    ...product,
    category: product.category as Category,
    images: product.images.map(img => ({
      ...img,
      id: Number(img.id),
      productId: Number(img.productId),
    })),
    // Provide default values for optional fields
    handle: '',
    compareAtPrice: null,
    costPerItem: null,
    barcode: null,
    inventoryPolicy: "DENY" as "DENY" | "CONTINUE",
    allowBackorder: false,
    taxable: false,
    taxCode: null,
    weight: null,
    weightUnit: null,
    requiresShipping: false,
    shippingProfile: null,
    fulfillmentService: null,
    metaTitle: null,
    metaDescription: null,
    metaKeywords: null,
    ogImage: null,
    twitterImage: null,
    seoTitle: null,
    seoDescription: null,
    seoKeywords: null,
    vendor: null,
    type: null,
    tags: [],
    variants: product.variants || [],
    metafields: [],
    optionsJson: null,
    publishedAt: null,
  }));

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