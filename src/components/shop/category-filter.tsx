"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Category {
  id: string;
  name: string;
}

export function CategoryFilter() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const currentCategory = searchParams.get("category") || "all";

  useEffect(() => {
    async function fetchCategories() {
      try {
        const response = await fetch("/api/categories");
        if (!response.ok) throw new Error("Failed to fetch categories");
        const data = await response.json();
        setCategories(data);
      } catch (error) {
        console.error("Error fetching categories:", error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchCategories();
  }, []);

  const handleCategoryChange = (categoryId: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (categoryId && categoryId !== "all") {
      params.set("category", categoryId);
    } else {
      params.delete("category");
    }
    router.push(`/shop?${params.toString()}`);
  };

  if (isLoading) {
    return (
      <Select disabled>
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Loading categories..." />
        </SelectTrigger>
      </Select>
    );
  }

  return (
    <Select value={currentCategory} onValueChange={handleCategoryChange}>
      <SelectTrigger className="w-[180px]">
        <SelectValue placeholder="All Categories" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">All Categories</SelectItem>
        {categories.map((category) => (
          <SelectItem key={category.id} value={category.id}>
            {category.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
} 