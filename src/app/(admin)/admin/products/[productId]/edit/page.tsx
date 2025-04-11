import { notFound } from "next/navigation";
import { ProductForm } from "@/components/admin/product-form";
import { prisma } from "@/lib/prisma";
import { Decimal } from "@prisma/client/runtime/library";

interface EditProductPageProps {
  params: {
    productId: string;
  };
}

export default async function EditProductPage({ params }: EditProductPageProps) {
  const productId = parseInt(params.productId, 10);

  const [product, categories, collections] = await Promise.all([
    prisma.product.findUnique({
      where: {
        id: productId,
      },
      include: {
        collections: {
          include: {
            collection: true,
          },
        },
        variants: true,
        images: true,
      },
    }),
    prisma.category.findMany({
      orderBy: {
        name: "asc",
      },
    }),
    prisma.collection.findMany({
      orderBy: {
        name: "asc",
      },
    }),
  ]);

  if (!product) {
    notFound();
  }

  // Convert Decimal values to numbers and ensure correct types
  const serializedProduct = {
    ...product,
    id: String(product.id),
    categoryId: product.categoryId || "",
    slug: product.slug || undefined,
    description: product.description || "",
    price: product.price instanceof Decimal ? product.price.toNumber() : Number(product.price),
    // @ts-ignore - We know these properties exist from the include
    images: product.images ? product.images.map(img => img.url) : [],
    // @ts-ignore - We know these properties exist from the include
    variants: product.variants ? product.variants.map(variant => ({
      ...variant,
      id: String(variant.id),
      productId: String(variant.productId),
      price: variant.price instanceof Decimal ? variant.price.toNumber() : Number(variant.price),
      compareAtPrice: variant.compareAtPrice instanceof Decimal 
        ? variant.compareAtPrice.toNumber() 
        : variant.compareAtPrice ? Number(variant.compareAtPrice) 
        : null
    })) : []
  } as const;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Edit Product</h1>
        <p className="text-muted-foreground">
          Make changes to your product here.
        </p>
      </div>

      <ProductForm product={serializedProduct} categories={categories} collections={collections} />
    </div>
  );
} 