"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { Category, ProductStatus } from "@prisma/client";

interface ProductFiltersProps {
  categories: Category[];
}

const priceRanges = [
  { value: "0-50", label: "Under $50" },
  { value: "50-100", label: "From $50 to $100" },
  { value: "100-200", label: "From $100 to $200" },
  { value: "200+", label: "Over $200" },
];

const statusOptions = [
  { value: ProductStatus.ACTIVE, label: "Active" },
  { value: ProductStatus.DRAFT, label: "Draft" },
  { value: ProductStatus.ARCHIVED, label: "Archived" },
];

export function ProductFilters({ categories }: ProductFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [selectedFilters, setSelectedFilters] = useState<Record<string, string>>({});

  useEffect(() => {
    // Initialize selected filters from URL params
    const filters: Record<string, string> = {};
    searchParams.forEach((value, key) => {
      filters[key] = value;
    });
    setSelectedFilters(filters);
  }, [searchParams]);

  const createQueryString = useCallback(
    (name: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) {
        params.set(name, value);
      } else {
        params.delete(name);
      }
      return params.toString();
    },
    [searchParams]
  );

  const handleFilterChange = (filterId: string, value: string) => {
    const newFilters = { ...selectedFilters, [filterId]: value };
    setSelectedFilters(newFilters);
    router.push(`?${createQueryString(filterId, value)}`);
  };

  return (
    <form className="space-y-6">
      {/* Categories Filter */}
      <div>
        <h3 className="text-sm font-medium text-gray-900">Categories</h3>
        <div className="mt-4 space-y-4">
          {categories.map((category) => (
            <div key={category.id} className="flex items-center">
              <input
                id={`category-${category.id}`}
                name="category"
                value={category.id}
                type="radio"
                checked={selectedFilters.category === category.id}
                onChange={() => handleFilterChange("category", category.id)}
                className="h-4 w-4 border-gray-300 text-primary-600 focus:ring-primary-600"
              />
              <label
                htmlFor={`category-${category.id}`}
                className="ml-3 text-sm text-gray-600"
              >
                {category.name}
              </label>
            </div>
          ))}
        </div>
      </div>

      {/* Price Range Filter */}
      <div>
        <h3 className="text-sm font-medium text-gray-900">Price Range</h3>
        <div className="mt-4 space-y-4">
          {priceRanges.map((range) => (
            <div key={range.value} className="flex items-center">
              <input
                id={`price-${range.value}`}
                name="price"
                value={range.value}
                type="radio"
                checked={selectedFilters.price === range.value}
                onChange={() => handleFilterChange("price", range.value)}
                className="h-4 w-4 border-gray-300 text-primary-600 focus:ring-primary-600"
              />
              <label
                htmlFor={`price-${range.value}`}
                className="ml-3 text-sm text-gray-600"
              >
                {range.label}
              </label>
            </div>
          ))}
        </div>
      </div>

      {/* Status Filter */}
      <div>
        <h3 className="text-sm font-medium text-gray-900">Status</h3>
        <div className="mt-4 space-y-4">
          {statusOptions.map((status) => (
            <div key={status.value} className="flex items-center">
              <input
                id={`status-${status.value}`}
                name="status"
                value={status.value}
                type="radio"
                checked={selectedFilters.status === status.value}
                onChange={() => handleFilterChange("status", status.value)}
                className="h-4 w-4 border-gray-300 text-primary-600 focus:ring-primary-600"
              />
              <label
                htmlFor={`status-${status.value}`}
                className="ml-3 text-sm text-gray-600"
              >
                {status.label}
              </label>
            </div>
          ))}
        </div>
      </div>

      {/* Stock Filter */}
      <div>
        <h3 className="text-sm font-medium text-gray-900">Stock Status</h3>
        <div className="mt-4 space-y-4">
          <div className="flex items-center">
            <input
              id="stock-in"
              name="stock"
              value="in"
              type="radio"
              checked={selectedFilters.stock === "in"}
              onChange={() => handleFilterChange("stock", "in")}
              className="h-4 w-4 border-gray-300 text-primary-600 focus:ring-primary-600"
            />
            <label
              htmlFor="stock-in"
              className="ml-3 text-sm text-gray-600"
            >
              In Stock
            </label>
          </div>
          <div className="flex items-center">
            <input
              id="stock-low"
              name="stock"
              value="low"
              type="radio"
              checked={selectedFilters.stock === "low"}
              onChange={() => handleFilterChange("stock", "low")}
              className="h-4 w-4 border-gray-300 text-primary-600 focus:ring-primary-600"
            />
            <label
              htmlFor="stock-low"
              className="ml-3 text-sm text-gray-600"
            >
              Low Stock
            </label>
          </div>
          <div className="flex items-center">
            <input
              id="stock-out"
              name="stock"
              value="out"
              type="radio"
              checked={selectedFilters.stock === "out"}
              onChange={() => handleFilterChange("stock", "out")}
              className="h-4 w-4 border-gray-300 text-primary-600 focus:ring-primary-600"
            />
            <label
              htmlFor="stock-out"
              className="ml-3 text-sm text-gray-600"
            >
              Out of Stock
            </label>
          </div>
        </div>
      </div>
    </form>
  );
} 