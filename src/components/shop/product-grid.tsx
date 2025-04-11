import { prisma } from "@/lib/prisma";
import { Product, Category, Prisma } from "@prisma/client";
import { ProductCard } from "./product-card";
import { Skeleton } from "@/components/ui/skeleton";

interface ProductGridProps {
  searchParams: { [key: string]: string | string[] | undefined };
}

export async function ProductGrid({ searchParams }: ProductGridProps) {
  const { category, sort, q } = searchParams;

  const where: Prisma.ProductWhereInput = {
    isActive: true,
    ...(category && { categoryId: category as string }),
    ...(q && {
      OR: [
        { name: { contains: q as string, mode: Prisma.QueryMode.insensitive } },
        { description: { contains: q as string, mode: Prisma.QueryMode.insensitive } },
      ],
    }),
  };

  const orderBy: Prisma.ProductOrderByWithRelationInput = {
    ...(sort === "price-asc" && { price: Prisma.SortOrder.asc }),
    ...(sort === "price-desc" && { price: Prisma.SortOrder.desc }),
    ...(sort === "name-asc" && { name: Prisma.SortOrder.asc }),
    ...(sort === "name-desc" && { name: Prisma.SortOrder.desc }),
    ...(!sort && { createdAt: Prisma.SortOrder.desc }),
  };

  const products = await prisma.product.findMany({
    where,
    orderBy,
    include: {
      category: true,
    },
  });

  if (products.length === 0) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-medium text-foreground mb-2">
          No products found
        </h2>
        <p className="text-muted-foreground">
          Try adjusting your search or filter criteria
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {products.map((product: Product & { category: Category }) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}

export function ProductGridSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {[...Array(8)].map((_, i) => (
        <div key={i} className="space-y-4">
          <Skeleton className="aspect-square w-full" />
          <Skeleton className="h-6 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="h-10 w-full" />
        </div>
      ))}
    </div>
  );
} 