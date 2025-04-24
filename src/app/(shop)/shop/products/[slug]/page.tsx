import { Metadata } from "next";
import { notFound } from "next/navigation";
import { PrismaClient } from "@prisma/client";
import { ProductGallery } from "@/components/shop/product-gallery";
import { ProductInfo } from "@/components/shop/product-info";
import { Breadcrumb } from "@/components/shop/breadcrumb";
import { RelatedProducts } from "@/components/shop/related-products";
import { Product, ProductStatus, ProductImage, ProductVariant } from "@/types/product";

const prisma = new PrismaClient();

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
  if (!params.slug) {
    notFound();
  }

  try {
    // Check if the slug is in the format "product-{id}"
    const productIdMatch = params.slug.match(/^product-(\d+)$/);
    const productId = productIdMatch ? parseInt(productIdMatch[1]) : null;

    const rawProduct = await prisma.product.findFirst({
      where: {
        OR: [
          { slug: params.slug },
          { id: productId || undefined },
          { handle: params.slug }
        ],
        status: "ACTIVE"
      },
      include: {
        category: true,
        images: {
          orderBy: {
            order: 'asc'
          }
        },
        variants: {
          where: {
            isActive: true
          }
        }
      }
    });

    if (!rawProduct) {
      notFound();
    }

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

    // Ensure variants have the correct shape
    const variants = rawProduct.variants.map(variant => ({
      ...variant,
      id: Number(variant.id),
      price: variant.price.toString(),
      compareAtPrice: variant.compareAtPrice?.toString() || null,
      weight: variant.weight?.toString() || null,
      options: variant.options as Record<string, string> || {},
      dimensions: variant.dimensions as Record<string, any> || {},
      attributes: variant.options as Record<string, any> || {},
      images: [],
      inventoryTracking: variant.inventoryTracking || false,
      lowStockThreshold: variant.lowStockThreshold || null,
      productId: Number(variant.productId),
      isActive: variant.isActive || false,
      barcode: variant.barcode || null,
      weightUnit: variant.weightUnit || null,
    }));

    // Convert Prisma model to our Product type with proper type checking
    const product = {
      id: Number(rawProduct.id),
      name: rawProduct.name,
      description: rawProduct.description,
      descriptionHtml: rawProduct.descriptionHtml || null,
      handle: rawProduct.handle || null,
      price: rawProduct.price.toString(),
      stock: rawProduct.stock,
      reservedStock: rawProduct.reservedStock,
      slug: rawProduct.slug || null,
      isActive: rawProduct.isActive,
      status: rawProduct.status as ProductStatus,
      image: rawProduct.image || null,
      sku: rawProduct.sku || null,
      inventoryTracking: rawProduct.inventoryTracking,
      lowStockThreshold: rawProduct.lowStockThreshold,
      category: rawProduct.category ? convertCategory(rawProduct.category) : null,
      categoryId: rawProduct.categoryId || null,
      images: rawProduct.images.map(img => ({
        id: Number(img.id),
        url: img.url,
        order: img.order,
        productId: Number(img.productId),
        createdAt: img.createdAt,
        updatedAt: img.updatedAt,
      })) as ProductImage[],
      variants: variants as ProductVariant[],
      createdAt: rawProduct.createdAt,
      updatedAt: rawProduct.updatedAt,
    } as Product;

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

    // Convert related products
    const typedRelatedProducts = relatedProducts.map(p => ({
      ...p,
      category: p.category ? convertCategory(p.category) : null,
      images: p.images.map(img => ({
        ...img,
        id: Number(img.id),
        productId: Number(img.productId),
      })),
      variants: p.variants || [],
    }));

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
          <RelatedProducts products={typedRelatedProducts} />
        </div>
      </div>
    );
  } catch (error) {
    console.error("Error loading product:", error);
    notFound();
  }
} 