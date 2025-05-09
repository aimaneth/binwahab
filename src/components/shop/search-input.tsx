"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { useDebounce } from "@/hooks/use-debounce";
import { useEffect, useState } from "react";

interface SearchInputProps {
  baseUrl?: string;
}

export function SearchInput({ baseUrl = "/shop" }: SearchInputProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [search, setSearch] = useState(searchParams.get("q") || "");
  const debouncedSearch = useDebounce(search, 300);

  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString());
    if (debouncedSearch) {
      params.set("q", debouncedSearch);
    } else {
      params.delete("q");
    }
    router.push(`${baseUrl}?${params.toString()}`);
  }, [debouncedSearch, router, searchParams, baseUrl]);

  return (
    <div className="relative">
      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        placeholder="Search products..."
        className="pl-9"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />
    </div>
  );
} 