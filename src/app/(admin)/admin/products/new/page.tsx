import { ProductForm } from "@/components/admin/product-form";
import { execute } from "@/lib/prisma";

export default async function NewProductPage() {
  const [categories, collections] = await execute(async (prisma) => {
    return Promise.all([
      prisma.category.findMany({
        orderBy: {
          name: "asc",
        },
      }),
      prisma.collection.findMany({
        select: {
          id: true,
          name: true,
        },
        orderBy: {
          name: "asc",
        },
      }),
    ]);
  });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">New Product</h1>
        <p className="text-muted-foreground">
          Create a new product in your store.
        </p>
      </div>

      <ProductForm categories={categories} collections={collections} />
    </div>
  );
} 