import { Product, Category } from "@prisma/client";
import { ProductCard } from "./product-card";
import { CollectionSort } from "./collection-sort";

interface ProductWithRelations extends Product {
  category: Category | null;
  images?: { url: string }[];
}

interface ProductGridProps {
  products: ProductWithRelations[];
  showSort?: boolean;
}

export function ProductGrid({ products, showSort = true }: ProductGridProps) {
  return (
    <div className="space-y-6">
      {showSort && <CollectionSort />}
      <div className="grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 xl:gap-x-8">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </div>
  );
} 