import { Metadata } from "next";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { ProductGallery } from "@/components/shop/product-gallery";
import { ProductInfo } from "@/components/shop/product-info";
import { Breadcrumb } from "@/components/shop/breadcrumb";
import { RelatedProducts } from "@/components/shop/related-products";
import { Product, ProductStatus, ProductVariant } from "@/types/product";
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

  // Helper functions to safely convert types
  const toPriceString = (val: any) => val ? val.toString() : '0';
  const toNumber = (val: any) => val ? Number(val.toString()) : 0;

  // Map a raw product to our Product type
  const mapProduct = (rawProduct: any): Product => {
    // Map variants first to ensure correct typing
    const variants = (rawProduct.variants || []).map((v: any) => ({
      id: v.id,
      name: v.name || '',
      sku: v.sku || '',
      price: toPriceString(v.price),
      compareAtPrice: v.compareAtPrice ? toPriceString(v.compareAtPrice) : null,
      stock: toNumber(v.stock),
      reservedStock: toNumber(v.reservedStock),
      options: v.options || {},
      images: v.images || [],
      inventoryTracking: v.inventoryTracking || false,
      lowStockThreshold: toNumber(v.lowStockThreshold),
      productId: v.productId,
      isActive: v.isActive || false,
      barcode: v.barcode || null,
      weight: v.weight || null,
      weightUnit: v.weightUnit || null,
      dimensions: v.dimensions || null
    })) as unknown as ProductVariant[];

    return {
      id: rawProduct.id,
      name: rawProduct.name,
      description: rawProduct.description || '',
      descriptionHtml: rawProduct.descriptionHtml || '',
      handle: rawProduct.handle || null,
      price: toPriceString(rawProduct.price),
      stock: toNumber(rawProduct.stock),
      reservedStock: toNumber(rawProduct.reservedStock),
      slug: rawProduct.slug || null,
      isActive: rawProduct.isActive || false,
      status: rawProduct.status as ProductStatus,
      image: rawProduct.image || null,
      sku: rawProduct.sku || '',
      inventoryTracking: rawProduct.inventoryTracking || false,
      lowStockThreshold: toNumber(rawProduct.lowStockThreshold),
      category: rawProduct.category || null,
      images: (rawProduct.images || []).map((img: any) => ({
        id: img.id,
        url: img.url,
        order: img.order,
        productId: img.productId,
        createdAt: img.createdAt,
        updatedAt: img.updatedAt
      })),
      variants,
      categoryId: rawProduct.categoryId,
      createdAt: rawProduct.createdAt,
      updatedAt: rawProduct.updatedAt,
    };
  };

  const product = mapProduct(rawProduct);

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

  const productsWithCategories = relatedProducts.map(mapProduct);

  console.log('Transformed variants:', product.variants);

  return (
    <div className="bg-white">
      <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6 sm:py-24 lg:max-w-7xl lg:px-8">
        <div className="lg:grid lg:grid-cols-2 lg:items-start lg:gap-x-8">
          <ProductGallery images={product.images.map(img => img.url)} name={product.name} />
          <ProductInfo product={product} />
        </div>
        <RelatedProducts products={productsWithCategories} />
      </div>
    </div>
  );
} 