'use client';

import { CategoryFilter } from "@/components/shop/category-filter";
import { CollectionFilter } from "@/components/shop/collection-filter";
import { SortSelect } from "@/components/shop/sort-select";
import { SearchInput } from "@/components/shop/search-input";
import { usePathname } from "next/navigation"

export function ShopFilters() {
  const pathname = usePathname()
  
  return (
    <div className="sticky top-20 z-30 w-full bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex flex-col gap-4 py-4">
        <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
          <div className="w-full sm:w-[300px] lg:w-[400px]">
            <SearchInput baseUrl={pathname} />
          </div>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 w-full sm:w-auto">
            <CollectionFilter />
            <CategoryFilter />
            <SortSelect />
          </div>
        </div>
        <div className="h-px bg-border" />
      </div>
    </div>
  );
} 