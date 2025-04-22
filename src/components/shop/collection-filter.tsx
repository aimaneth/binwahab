'use client';

import { useCallback, useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Collection {
  id: string;
  name: string;
}

export function CollectionFilter() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [collections, setCollections] = useState<Collection[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchCollections() {
      try {
        const response = await fetch('/api/collections');
        const data = await response.json();
        setCollections(data.map((collection: any) => ({
          id: collection.id,
          name: collection.name,
        })));
      } catch (error) {
        console.error('Error fetching collections:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchCollections();
  }, []);

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

  if (loading || collections.length === 0) {
    return null;
  }

  return (
    <Select
      value={searchParams.get('collection') ?? ''}
      onValueChange={(value) => {
        router.push(
          `${pathname}?${createQueryString('collection', value)}`
        );
      }}
    >
      <SelectTrigger className="w-[180px]">
        <SelectValue placeholder="All Collections" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="">All Collections</SelectItem>
        {collections.map((collection) => (
          <SelectItem key={collection.id} value={collection.id}>
            {collection.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
} 