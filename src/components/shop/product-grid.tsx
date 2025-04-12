import { prisma } from "@/lib/prisma";
import { Product, Category, Prisma } from "@prisma/client";
import { ProductCard } from "./product-card";
import { Skeleton } from "@/components/ui/skeleton";

interface ProductGridProps {
  searchParams: { [key: string]: string | string[] | undefined };
}

export async function ProductGrid({ searchParams }: ProductGridProps) {
  const { category, sort, q, page = "1" } = searchParams;
  const currentPage = parseInt(page as string);
  const itemsPerPage = 12; // Show 12 products per page
  const skip = (currentPage - 1) * itemsPerPage;

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

  const [products, total] = await Promise.all([
    prisma.product.findMany({
      where,
      orderBy,
      skip,
      take: itemsPerPage,
      include: {
        category: true,
      },
    }),
    prisma.product.count({ where }),
  ]);

  const totalPages = Math.ceil(total / itemsPerPage);

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
    <div className="space-y-8">
      <div className="grid grid-cols-2 gap-4 sm:gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {products.map((product: Product & { category: Category | null }) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
      {totalPages > 1 && (
        <div className="flex justify-center gap-2">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
            <a
              key={pageNum}
              href={`?page=${pageNum}${category ? `&category=${category}` : ""}${sort ? `&sort=${sort}` : ""}${q ? `&q=${q}` : ""}`}
              className={`px-4 py-2 rounded-md ${
                pageNum === currentPage
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted hover:bg-muted/80"
              }`}
            >
              {pageNum}
            </a>
          ))}
        </div>
      )}
    </div>
  );
}

export function ProductGridSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-4 sm:gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {[...Array(12)].map((_, i) => (
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