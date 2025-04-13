import { useRouter, useSearchParams } from "next/navigation";
import { Select } from "@/components/ui/select";

const sortOptions = [
  { value: "manual", label: "Featured" },
  { value: "best-selling", label: "Best Selling" },
  { value: "created-desc", label: "Newest" },
  { value: "price-asc", label: "Price: Low to High" },
  { value: "price-desc", label: "Price: High to Low" },
  { value: "title-asc", label: "A-Z" },
  { value: "title-desc", label: "Z-A" },
];

export function CollectionSort() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentSort = searchParams.get("sort") || "manual";

  const handleSortChange = (value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("sort", value);
    router.push(`?${params.toString()}`);
  };

  return (
    <div className="flex items-center gap-2">
      <label htmlFor="sort" className="text-sm text-gray-600">
        Sort by:
      </label>
      <Select
        id="sort"
        value={currentSort}
        onValueChange={handleSortChange}
        className="w-48"
      >
        {sortOptions.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </Select>
    </div>
  );
} 