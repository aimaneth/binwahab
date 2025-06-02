import { notFound } from "next/navigation";
import { ProductForm } from "@/components/admin/product-form";
import { execute } from "@/lib/prisma";

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

    const [product, categories, collections] = await execute(async (prisma) => {
      return Promise.all([
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
    });

    if (!product) {
      notFound();
    }

    // Serialize the product data for client component
    const serializedProduct = {
      id: product.id.toString(),
      name: product.name,
      description: product.description || "",
      price: Number(product.price),
      categoryId: product.categoryId || "",
      image: product.image,
      isActive: product.isActive,
      createdAt: product.createdAt,
      updatedAt: product.updatedAt,
      slug: product.slug || "",
      stock: product.stock || 0,
      status: product.status,
      collections: product.collections?.map(pc => ({
        collectionId: pc.collectionId
      })) || [],
      variants: product.variants?.map(variant => ({
        id: variant.id.toString(),
        productId: variant.productId.toString(),
        name: variant.name,
        price: Number(variant.price),
        compareAtPrice: variant.compareAtPrice ? Number(variant.compareAtPrice) : null,
        stock: variant.stock || 0,
        isActive: variant.isActive,
        options: variant.options || {},
      })) || [],
      images: product.images?.map(img => img.url) || []
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
    // Return a user-friendly error instead of notFound
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Error Loading Product</h1>
          <p className="text-muted-foreground">
            There was an error loading the product. Please try again.
          </p>
        </div>
      </div>
    );
  }
} 