import { Metadata } from "next";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { ProductGallery } from "@/components/shop/product-gallery";
import { ProductInfo } from "@/components/shop/product-info";
import { Breadcrumb } from "@/components/shop/breadcrumb";
import { RelatedProducts } from "@/components/shop/related-products";
import { Product, ProductStatus } from "@/types/product";
import { Prisma } from "@prisma/client";

type PrismaProduct = Prisma.ProductGetPayload<{
  include: {
    category: true;
    images: true;
    variants: {
      include: {
        _count: true;
      }
    };
  };
}>;

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
  const rawProduct = await prisma.product.findFirst({
    where: {
      OR: [
        { slug: params.slug },
        { handle: params.slug },
        { id: parseInt(params.slug) || undefined }
      ]
    },
    include: {
      category: true,
      images: {
        orderBy: {
          order: 'asc'
        }
      },
      variants: {
        where: { isActive: true },
        select: {
          id: true,
          name: true,
          sku: true,
          price: true,
          compareAtPrice: true,
          stock: true,
          reservedStock: true,
          options: true,
          images: true,
          inventoryTracking: true,
          lowStockThreshold: true,
          productId: true,
          isActive: true,
          barcode: true,
          weight: true,
          weightUnit: true,
          dimensions: true,
          attributes: true
        }
      }
    }
  }) as PrismaProduct | null;

  if (!rawProduct) {
    notFound();
  }

  // Convert Prisma model to our Product type
  const typedProduct: Product = {
    id: rawProduct.id,
    name: rawProduct.name,
    description: rawProduct.description,
    descriptionHtml: rawProduct.descriptionHtml,
    handle: rawProduct.handle || null,
    price: rawProduct.price,
    stock: rawProduct.stock,
    reservedStock: rawProduct.reservedStock,
    slug: rawProduct.slug || null,
    isActive: rawProduct.isActive,
    status: rawProduct.status as ProductStatus,
    image: rawProduct.image,
    sku: rawProduct.sku,
    inventoryTracking: rawProduct.inventoryTracking,
    lowStockThreshold: rawProduct.lowStockThreshold,
    images: rawProduct.images.map(img => ({
      id: Number(img.id),
      url: img.url,
      order: img.order,
      productId: Number(img.productId),
      createdAt: img.createdAt,
      updatedAt: img.updatedAt
    })),
    variants: rawProduct.variants.map(variant => ({
      id: Number(variant.id),
      name: variant.name,
      sku: variant.sku,
      price: variant.price,
      compareAtPrice: variant.compareAtPrice,
      stock: variant.stock,
      reservedStock: variant.reservedStock,
      options: variant.options as Record<string, string>,
      images: variant.images,
      inventoryTracking: variant.inventoryTracking,
      lowStockThreshold: variant.lowStockThreshold || null,
      productId: Number(rawProduct.id),
      isActive: variant.isActive,
      barcode: variant.barcode || null,
      weight: variant.weight || null,
      weightUnit: variant.weightUnit || null,
      dimensions: variant.dimensions as Record<string, any> | null,
      attributes: variant.attributes as Record<string, any> | null
    })),
    category: rawProduct.category,
    categoryId: rawProduct.categoryId,
    createdAt: rawProduct.createdAt,
    updatedAt: rawProduct.updatedAt
  };

  const relatedProducts = await prisma.product.findMany({
    where: {
      categoryId: rawProduct?.categoryId || '',
      NOT: {
        id: rawProduct?.id
      },
      isActive: true
    },
    take: 4,
    include: {
      category: true,
      images: {
        orderBy: {
          order: 'asc'
        }
      },
      variants: {
        where: { isActive: true },
        select: {
          id: true,
          name: true,
          sku: true,
          price: true,
          compareAtPrice: true,
          stock: true,
          reservedStock: true,
          options: true,
          images: true,
          inventoryTracking: true,
          lowStockThreshold: true,
          productId: true,
          isActive: true,
          barcode: true,
          weight: true,
          weightUnit: true,
          dimensions: true,
          attributes: true
        }
      }
    }
  }) as PrismaProduct[];

  // Filter out products with null categories and map to Product type
  const productsWithCategories = relatedProducts
    .filter(p => p.category !== null)
    .map(p => ({
      id: p.id,
      name: p.name,
      description: p.description,
      descriptionHtml: p.descriptionHtml,
      handle: p.handle || null,
      price: p.price,
      stock: p.stock,
      reservedStock: p.reservedStock,
      slug: p.slug || null,
      isActive: p.isActive,
      status: p.status as ProductStatus,
      image: p.image,
      sku: p.sku,
      inventoryTracking: p.inventoryTracking,
      lowStockThreshold: p.lowStockThreshold,
      images: p.images.map(img => ({
        id: Number(img.id),
        url: img.url,
        order: img.order,
        productId: Number(img.productId),
        createdAt: img.createdAt,
        updatedAt: img.updatedAt
      })),
      variants: p.variants.map(variant => ({
        id: Number(variant.id),
        name: variant.name,
        sku: variant.sku,
        price: variant.price,
        compareAtPrice: variant.compareAtPrice,
        stock: variant.stock,
        reservedStock: variant.reservedStock,
        options: variant.options as Record<string, string>,
        images: variant.images,
        inventoryTracking: variant.inventoryTracking,
        lowStockThreshold: variant.lowStockThreshold || null,
        productId: Number(p.id),
        isActive: variant.isActive,
        barcode: variant.barcode || null,
        weight: variant.weight || null,
        weightUnit: variant.weightUnit || null,
        dimensions: variant.dimensions as Record<string, any> | null,
        attributes: variant.attributes as Record<string, any> | null
      })),
      category: p.category,
      categoryId: p.categoryId,
      createdAt: p.createdAt,
      updatedAt: p.updatedAt
    })) as Product[];

  console.log('Transformed variants:', typedProduct.variants);

  return (
    <div className="bg-white">
      <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6 sm:py-24 lg:max-w-7xl lg:px-8">
        <div className="lg:grid lg:grid-cols-2 lg:items-start lg:gap-x-8">
          <ProductGallery images={typedProduct.images.map(img => img.url)} name={typedProduct.name} />
          <ProductInfo product={typedProduct} />
        </div>
        <RelatedProducts products={productsWithCategories} />
      </div>
    </div>
  );
} 