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
  try {
    const productId = parseInt(params.productId, 10);

    if (isNaN(productId)) {
      notFound();
    }

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

    // Convert Decimal values to numbers and ensure serializable data
    const serializedProduct = {
      id: String(product.id),
      name: product.name,
      description: product.description || "",
      price: product.price instanceof Decimal ? product.price.toNumber() : Number(product.price || 0),
      categoryId: product.categoryId || "",
      image: product.image,
      isActive: product.isActive,
      createdAt: product.createdAt,
      updatedAt: product.updatedAt,
      slug: product.slug || "",
      stock: product.stock || 0,
      status: product.status,
      collections: product.collections 
        ? product.collections.map(pc => ({
            collectionId: pc.collectionId
          }))
        : [],
      variants: product.variants 
        ? product.variants.map(variant => ({
            id: String(variant.id),
            productId: String(variant.productId),
            name: variant.name,
            price: variant.price instanceof Decimal ? variant.price.toNumber() : Number(variant.price || 0),
            compareAtPrice: variant.compareAtPrice 
              ? (variant.compareAtPrice instanceof Decimal 
                  ? variant.compareAtPrice.toNumber() 
                  : Number(variant.compareAtPrice))
              : null,
            stock: variant.stock || 0,
            isActive: variant.isActive,
            options: variant.options || [],
          }))
        : [],
      images: product.images 
        ? product.images.map(img => img.url)
        : []
    };

    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Edit Product</h1>
          <p className="text-muted-foreground">
            Make changes to your product here.
          </p>
        </div>

        <ProductForm 
          product={serializedProduct} 
          categories={categories} 
          collections={collections} 
        />
      </div>
    );
  } catch (error) {
    console.error("Error in EditProductPage:", error);
    notFound();
  }
} 