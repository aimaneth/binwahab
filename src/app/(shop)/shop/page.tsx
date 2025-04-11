import { Metadata } from "next";
import { ProductGrid } from "@/components/shop/product-grid";
import { CategoryFilter } from "@/components/shop/category-filter";
import { SortSelect } from "@/components/shop/sort-select";
import { SearchInput } from "@/components/shop/search-input";

export const metadata: Metadata = {
  title: "Shop - BINWAHAB",
  description: "Browse our collection of trendy fashion items",
};

interface ShopPageProps {
  searchParams: { [key: string]: string | string[] | undefined };
}

export default function ShopPage({ searchParams }: ShopPageProps) {
  return (
    <main className="container mx-auto px-4 py-8">
      <div className="flex flex-col gap-8">
        <div className="flex flex-col gap-4">
          <h1 className="text-3xl font-bold">Shop</h1>
          <p className="text-muted-foreground">
            Browse our collection of high-quality products
          </p>
        </div>

        <div className="flex flex-col md:flex-row gap-4 items-start">
          <div className="w-full md:w-64 space-y-4">
            <SearchInput />
            <CategoryFilter />
          </div>
          <div className="flex-1 space-y-4">
            <div className="flex justify-end">
              <SortSelect />
            </div>
            <ProductGrid searchParams={searchParams} />
          </div>
        </div>
      </div>
    </main>
  );
} 