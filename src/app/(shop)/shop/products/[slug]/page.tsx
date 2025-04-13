import { Metadata } from "next";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { ProductGallery } from "@/components/shop/product-gallery";
import { ProductInfo } from "@/components/shop/product-info";
import { Breadcrumb } from "@/components/shop/breadcrumb";
import { RelatedProducts } from "@/components/shop/related-products";
import { Product } from "@/types/product";

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const product = await prisma.product.findUnique({
    where: { slug: params.slug },
    include: { category: true },
  });

  if (!product) {
    return {
      title: "Product Not Found",
    };
  }

  return {
    title: product.name,
    description: product.description,
  };
}

interface ProductPageProps {
  params: {
    slug: string;
  };
}

export default async function ProductPage({ params }: ProductPageProps) {
  const rawProduct = await prisma.product.findUnique({
    where: { slug: params.slug },
    select: {
      id: true,
      name: true,
      description: true,
      image: true,
      price: true,
      stock: true,
      reservedStock: true,
      slug: true,
      isActive: true,
      status: true,
      categoryId: true,
      createdAt: true,
      updatedAt: true,
      sku: true,
      inventoryTracking: true,
      lowStockThreshold: true,
      images: {
        select: {
          id: true,
          url: true,
          order: true,
          productId: true,
          createdAt: true,
          updatedAt: true,
        },
      },
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
    },
  });

  if (!rawProduct) {
    notFound();
  }

  const product = rawProduct as unknown as Product;

  const rawRelatedProducts = await prisma.product.findMany({
    where: {
      categoryId: product.categoryId,
      id: { not: product.id },
      isActive: true,
    },
    select: {
      id: true,
      name: true,
      description: true,
      image: true,
      price: true,
      stock: true,
      reservedStock: true,
      slug: true,
      isActive: true,
      status: true,
      categoryId: true,
      createdAt: true,
      updatedAt: true,
      sku: true,
      inventoryTracking: true,
      lowStockThreshold: true,
      images: {
        select: {
          id: true,
          url: true,
          order: true,
          productId: true,
          createdAt: true,
          updatedAt: true,
        },
      },
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
    },
    take: 4,
  });

  const relatedProducts = rawRelatedProducts as unknown as Product[];

  const breadcrumbItems = [
    { label: "Home", href: "/" },
    { label: "Shop", href: "/shop" },
    ...(product.category
      ? [{ label: product.category.name, href: `/shop/categories/${product.category.slug}` }]
      : []),
    { label: product.name, href: `/shop/products/${product.slug}` },
  ];

  // Helper function to convert Prisma category to our Category type
  const convertCategory = (prismaCategory: any) => ({
    id: prismaCategory.id,
    name: prismaCategory.name,
    slug: prismaCategory.slug,
    description: prismaCategory.description || null,
    image: prismaCategory.image || null,
    isActive: prismaCategory.isActive,
    parentId: prismaCategory.parentId || null,
    seoTitle: prismaCategory.seoTitle || null,
    seoDescription: prismaCategory.seoDescription || null,
    seoKeywords: prismaCategory.seoKeywords || null,
    createdAt: prismaCategory.createdAt,
    updatedAt: prismaCategory.updatedAt,
    order: prismaCategory.order,
  });

  // Convert Prisma model to our Product type
  const typedProduct = {
    ...product,
    category: product.category ? convertCategory(product.category) : null,
    images: product.images.map(img => ({
      ...img,
      id: Number(img.id),
      productId: Number(img.productId),
    })),
    tags: product.tags || [],
    variants: product.variants || [],
    metafields: product.metafields || [],
  };

  // Convert related products
  const typedRelatedProducts = relatedProducts.map(p => ({
    ...p,
    category: p.category ? convertCategory(p.category) : null,
    images: p.images.map(img => ({
      ...img,
      id: Number(img.id),
      productId: Number(img.productId),
    })),
    tags: p.tags || [],
    variants: p.variants || [],
    metafields: p.metafields || [],
  }));

  return (
    <div className="container mx-auto px-4 py-8">
      <Breadcrumb items={breadcrumbItems} />
      <div className="mt-8 grid grid-cols-1 gap-8 md:grid-cols-2">
        <ProductGallery 
          images={typedProduct.images.map(img => img.url)} 
          name={typedProduct.name} 
        />
        <ProductInfo product={typedProduct} />
      </div>
      <div className="mt-16">
        <RelatedProducts products={typedRelatedProducts} />
      </div>
    </div>
  );
} 