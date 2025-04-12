import { prisma } from "@/lib/prisma";
import { Product, Category } from "@prisma/client";
import { ProductCard } from "./product-card";
import { Skeleton } from "@/components/ui/skeleton";

interface ProductGridProps {
  searchParams: { [key: string]: string | string[] | undefined };
}

// Define the type that ProductCard expects
interface ProductWithRelations extends Product {
  category: Category | null;
  images: Array<{ url: string }>;
}

export async function ProductGrid({ searchParams }: ProductGridProps) {
  const where = {
    isActive: true,
  };

  // Fetch products with their categories and images
  const rawProducts = await prisma.product.findMany({
    where,
    include: {
      category: true,
      images: true
    } as any
  });

  // Transform the data to match the ProductCard interface
  const products = rawProducts.map(product => ({
    ...product,
    images: (product as any).images.map((img: any) => ({ url: img.url }))
  })) as ProductWithRelations[];

  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {products.map((product) => (
        <ProductCard 
          key={product.id} 
          product={product} 
        />
      ))}
    </div>
  );
}

export function ProductGridSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-4 sm:gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {[...Array(24)].map((_, i) => (
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