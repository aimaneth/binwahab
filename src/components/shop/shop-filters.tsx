'use client';

import { CategoryFilter } from "@/components/shop/category-filter";
import { SortSelect } from "@/components/shop/sort-select";
import { SearchInput } from "@/components/shop/search-input";

export function ShopFilters() {
  return (
    <div className="w-full space-y-4">
      <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
        <div className="w-full sm:w-[300px] lg:w-[400px]">
          <SearchInput />
        </div>
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 w-full sm:w-auto">
          <CategoryFilter />
          <SortSelect />
        </div>
      </div>
      <div className="h-px bg-border" />
    </div>
  );
} 