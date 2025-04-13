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

  return (
    <div className="container mx-auto px-4 py-8">
      <Breadcrumb items={breadcrumbItems} />
      <div className="mt-8 grid grid-cols-1 gap-8 md:grid-cols-2">
        <ProductGallery 
          images={product.images.map(img => img.url)} 
          name={product.name} 
        />
        <ProductInfo product={product} />
      </div>
      <div className="mt-16">
        <RelatedProducts products={relatedProducts} />
      </div>
    </div>
  );
} 