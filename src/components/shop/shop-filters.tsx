'use client';

import { CategoryFilter } from "@/components/shop/category-filter";
import { SortSelect } from "@/components/shop/sort-select";
import { SearchInput } from "@/components/shop/search-input";

export function ShopFilters() {
  return (
    <div className="flex flex-col md:flex-row gap-4">
      <SearchInput />
      <div className="flex gap-4">
        <CategoryFilter />
        <SortSelect />
      </div>
    </div>
  );
} 