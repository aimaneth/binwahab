"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";

const filters = [
  {
    id: "category",
    name: "Category",
    options: [
      { value: "t-shirts", label: "T-Shirts" },
      { value: "jackets", label: "Jackets" },
      { value: "dresses", label: "Dresses" },
      { value: "pants", label: "Pants" },
    ],
  },
  {
    id: "size",
    name: "Size",
    options: [
      { value: "xs", label: "XS" },
      { value: "s", label: "S" },
      { value: "m", label: "M" },
      { value: "l", label: "L" },
      { value: "xl", label: "XL" },
    ],
  },
  {
    id: "color",
    name: "Color",
    options: [
      { value: "black", label: "Black" },
      { value: "white", label: "White" },
      { value: "red", label: "Red" },
      { value: "blue", label: "Blue" },
    ],
  },
  {
    id: "price",
    name: "Price",
    options: [
      { value: "0-50", label: "Under $50" },
      { value: "50-100", label: "From $50 to $100" },
      { value: "100-200", label: "From $100 to $200" },
      { value: "200+", label: "Over $200" },
    ],
  },
];

export function ProductFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const createQueryString = useCallback(
    (name: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set(name, value);
      return params.toString();
    },
    [searchParams]
  );

  const handleFilterChange = (filterId: string, value: string) => {
    router.push(`/shop?${createQueryString(filterId, value)}`);
  };

  return (
    <form className="space-y-6">
      {filters.map((filter) => (
        <div key={filter.id}>
          <h3 className="text-sm font-medium text-gray-900">{filter.name}</h3>
          <div className="mt-4 space-y-4">
            {filter.options.map((option) => (
              <div key={option.value} className="flex items-center">
                <input
                  id={`${filter.id}-${option.value}`}
                  name={`${filter.id}[]`}
                  value={option.value}
                  type="radio"
                  checked={searchParams.get(filter.id) === option.value}
                  onChange={() => handleFilterChange(filter.id, option.value)}
                  className="h-4 w-4 border-gray-300 text-primary-600 focus:ring-primary-600"
                />
                <label
                  htmlFor={`${filter.id}-${option.value}`}
                  className="ml-3 text-sm text-gray-600"
                >
                  {option.label}
                </label>
              </div>
            ))}
          </div>
        </div>
      ))}
    </form>
  );
} 