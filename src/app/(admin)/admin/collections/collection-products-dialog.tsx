"use client"

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DataTable } from "@/components/ui/data-table";
import { ColumnDef } from "@tanstack/react-table";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { Collection, Product } from "@prisma/client";
import { Badge } from "@/components/ui/badge";
import { formatPrice } from "@/utils/format";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Pagination } from "@/components/ui/pagination";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { 
  ChevronDown, 
  ChevronUp, 
  Filter, 
  Search, 
  X, 
  Check, 
  Image as ImageIcon,
  Package,
  Tag,
  DollarSign,
  BarChart
} from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";

interface CollectionProductsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  collection: Collection;
}

interface ProductWithSelection extends Product {
  selected?: boolean;
  category?: string;
}

// Enhanced columns with images and more details
const columns: ColumnDef<ProductWithSelection>[] = [
  {
    id: "select",
    header: ({ table }) => (
      <Checkbox
        checked={table.getIsAllPageRowsSelected()}
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Select all"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Select row"
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: "image",
    header: "Image",
    cell: ({ row }) => {
      const image = row.getValue("image") as string;
      return (
        <div className="w-12 h-12 rounded-md overflow-hidden bg-muted flex items-center justify-center">
          {image ? (
            <img 
              src={image} 
              alt={row.getValue("name")} 
              className="w-full h-full object-cover"
            />
          ) : (
            <ImageIcon className="h-6 w-6 text-muted-foreground" />
          )}
        </div>
      );
    },
    enableSorting: false,
  },
  {
    accessorKey: "name",
    header: ({ column }) => (
      <div className="flex items-center">
        <span>Name</span>
        <Button
          variant="ghost"
          size="sm"
          className="ml-2 h-8"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          {column.getIsSorted() === "asc" ? "↑" : column.getIsSorted() === "desc" ? "↓" : "↕"}
        </Button>
      </div>
    ),
    cell: ({ row }) => (
      <div className="flex flex-col">
        <span className="font-medium">{row.getValue("name")}</span>
        <span className="text-xs text-muted-foreground truncate max-w-[200px]">
          {row.original.description || "No description"}
        </span>
      </div>
    ),
  },
  {
    accessorKey: "price",
    header: ({ column }) => (
      <div className="flex items-center">
        <span>Price</span>
        <Button
          variant="ghost"
          size="sm"
          className="ml-2 h-8"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          {column.getIsSorted() === "asc" ? "↑" : column.getIsSorted() === "desc" ? "↓" : "↕"}
        </Button>
      </div>
    ),
    cell: ({ row }) => (
      <div className="flex items-center">
        <DollarSign className="h-4 w-4 mr-1 text-muted-foreground" />
        {formatPrice(row.getValue("price"))}
      </div>
    ),
  },
  {
    accessorKey: "stock",
    header: ({ column }) => (
      <div className="flex items-center">
        <span>Stock</span>
        <Button
          variant="ghost"
          size="sm"
          className="ml-2 h-8"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          {column.getIsSorted() === "asc" ? "↑" : column.getIsSorted() === "desc" ? "↓" : "↕"}
        </Button>
      </div>
    ),
    cell: ({ row }) => {
      const stock = row.getValue("stock") as number | null;
      return (
        <div className="flex items-center">
          <Package className="h-4 w-4 mr-1 text-muted-foreground" />
          <span className={(stock ?? 0) > 10 ? "text-green-600" : (stock ?? 0) > 0 ? "text-amber-600" : "text-red-600"}>
            {stock ?? 0}
          </span>
        </div>
      );
    },
  },
  {
    accessorKey: "status",
    header: ({ column }) => (
      <div className="flex items-center">
        <span>Status</span>
        <Button
          variant="ghost"
          size="sm"
          className="ml-2 h-8"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          {column.getIsSorted() === "asc" ? "↑" : column.getIsSorted() === "desc" ? "↓" : "↕"}
        </Button>
      </div>
    ),
    cell: ({ row }) => {
      const status = row.getValue("status") as string;
      return (
        <Badge variant={status === "ACTIVE" ? "success" : "secondary"}>
          {status}
        </Badge>
      );
    },
  },
  {
    accessorKey: "category",
    header: ({ column }) => (
      <div className="flex items-center">
        <span>Category</span>
        <Button
          variant="ghost"
          size="sm"
          className="ml-2 h-8"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          {column.getIsSorted() === "asc" ? "↑" : column.getIsSorted() === "desc" ? "↓" : "↕"}
        </Button>
      </div>
    ),
    cell: ({ row }) => {
      const category = row.getValue("category") as string;
      return (
        <div className="flex items-center">
          <Tag className="h-4 w-4 mr-1 text-muted-foreground" />
          {category || "Uncategorized"}
        </div>
      );
    },
  },
];

export function CollectionProductsDialog({
  open,
  onOpenChange,
  collection,
}: CollectionProductsDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [products, setProducts] = useState<ProductWithSelection[]>([]);
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchField, setSearchField] = useState<"name" | "status" | "category">("name");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [sortBy, setSortBy] = useState("name");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [viewMode, setViewMode] = useState<"table" | "grid">("table");
  const [showFilters, setShowFilters] = useState(false);
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 1000]);
  const [stockFilter, setStockFilter] = useState<"all" | "inStock" | "lowStock" | "outOfStock">("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "ACTIVE" | "INACTIVE">("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [categories, setCategories] = useState<string[]>([]);

  useEffect(() => {
    if (open) {
      fetchProducts();
      // Extract unique categories from products
      const uniqueCategories = Array.from(
        new Set(products.map((product) => product.category || "Uncategorized"))
      );
      setCategories(uniqueCategories);
    }
  }, [
    open, 
    collection.id, 
    currentPage, 
    itemsPerPage, 
    searchQuery, 
    searchField, 
    sortBy, 
    sortOrder,
    priceRange,
    stockFilter,
    statusFilter,
    categoryFilter
  ]);

  const fetchProducts = async () => {
    try {
      setIsLoading(true);
      const queryParams = new URLSearchParams({
        page: currentPage.toString(),
        limit: itemsPerPage.toString(),
        search: searchQuery,
        searchField,
        sortBy,
        sortOrder,
        minPrice: priceRange[0].toString(),
        maxPrice: priceRange[1].toString(),
        stockFilter,
        statusFilter,
        categoryFilter,
      });
      
      const response = await fetch(`/api/admin/collections/${collection.id}/products?${queryParams}`);
      if (!response.ok) throw new Error("Failed to fetch products");
      
      const data = await response.json();
      setProducts(data.products.map((product: Product) => ({
        ...product,
        selected: data.selectedProductIds.includes(product.id),
      })));
      setSelectedProducts(data.selectedProductIds);
      setTotalItems(data.pagination.total);
      setTotalPages(data.pagination.totalPages);
    } catch (error) {
      console.error("Error fetching products:", error);
      toast.error("Failed to load products");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/admin/collections/${collection.id}/products`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          productIds: selectedProducts,
        }),
      });

      if (!response.ok) throw new Error("Failed to save products");
      
      const updatedCollection = await response.json();
      toast.success("Products saved successfully");
      onOpenChange(false);
    } catch (error) {
      console.error("Error saving products:", error);
      toast.error("Failed to save products");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSort = (column: string) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(column);
      setSortOrder("asc");
    }
  };

  const handleBulkAction = (action: "selectAll" | "deselectAll" | "selectInStock" | "selectOutOfStock") => {
    switch (action) {
      case "selectAll":
        setSelectedProducts(products.map(p => p.id));
        break;
      case "deselectAll":
        setSelectedProducts([]);
        break;
      case "selectInStock":
        setSelectedProducts(products.filter(p => (p.stock ?? 0) > 0).map(p => p.id));
        break;
      case "selectOutOfStock":
        setSelectedProducts(products.filter(p => (p.stock ?? 0) === 0).map(p => p.id));
        break;
    }
  };

  const resetFilters = () => {
    setPriceRange([0, 1000]);
    setStockFilter("all");
    setStatusFilter("all");
    setCategoryFilter("all");
    setSearchQuery("");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[900px] max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Manage Products - {collection.name}</DialogTitle>
          <DialogDescription>
            Select products to add or remove from this collection.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-hidden flex flex-col">
          <Tabs defaultValue="table" className="w-full" onValueChange={(value) => setViewMode(value as "table" | "grid")}>
            <div className="flex items-center justify-between p-4 border-b">
              <TabsList>
                <TabsTrigger value="table">Table View</TabsTrigger>
                <TabsTrigger value="grid">Grid View</TabsTrigger>
              </TabsList>
              
              <div className="flex items-center gap-2">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" size="sm" className="h-8">
                      <Filter className="h-4 w-4 mr-1" />
                      Filters
                      {showFilters && <X className="h-4 w-4 ml-1" onClick={(e) => { e.stopPropagation(); setShowFilters(false); }} />}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-80 p-4">
                    <div className="space-y-4">
                      <div>
                        <h4 className="font-medium mb-2">Price Range</h4>
                        <div className="flex items-center gap-2">
                          <Input 
                            type="number" 
                            value={priceRange[0]} 
                            onChange={(e) => setPriceRange([parseInt(e.target.value), priceRange[1]])}
                            className="w-20"
                            min={0}
                            max={priceRange[1]}
                          />
                          <span>to</span>
                          <Input 
                            type="number" 
                            value={priceRange[1]} 
                            onChange={(e) => setPriceRange([priceRange[0], parseInt(e.target.value)])}
                            className="w-20"
                            min={priceRange[0]}
                            max={1000}
                          />
                        </div>
                      </div>
                      
                      <Separator />
                      
                      <div>
                        <h4 className="font-medium mb-2">Stock Status</h4>
                        <div className="space-y-2">
                          <div className="flex items-center space-x-2">
                            <Switch
                              id="inStock"
                              checked={stockFilter === "inStock"}
                              onCheckedChange={() => setStockFilter(stockFilter === "inStock" ? "all" : "inStock")}
                            />
                            <Label htmlFor="inStock">In Stock</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Switch
                              id="lowStock"
                              checked={stockFilter === "lowStock"}
                              onCheckedChange={() => setStockFilter(stockFilter === "lowStock" ? "all" : "lowStock")}
                            />
                            <Label htmlFor="lowStock">Low Stock</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Switch
                              id="outOfStock"
                              checked={stockFilter === "outOfStock"}
                              onCheckedChange={() => setStockFilter(stockFilter === "outOfStock" ? "all" : "outOfStock")}
                            />
                            <Label htmlFor="outOfStock">Out of Stock</Label>
                          </div>
                        </div>
                      </div>
                      
                      <Separator />
                      
                      <div>
                        <h4 className="font-medium mb-2">Status</h4>
                        <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as "all" | "ACTIVE" | "INACTIVE")}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select status" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All Statuses</SelectItem>
                            <SelectItem value="ACTIVE">Active</SelectItem>
                            <SelectItem value="INACTIVE">Inactive</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <Separator />
                      
                      <div>
                        <h4 className="font-medium mb-2">Category</h4>
                        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select category" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All Categories</SelectItem>
                            {categories.map((category) => (
                              <SelectItem key={category} value={category}>
                                {category}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="flex justify-between pt-2">
                        <Button variant="outline" size="sm" onClick={resetFilters}>
                          Reset Filters
                        </Button>
                        <Button size="sm" onClick={() => setShowFilters(false)}>
                          Apply Filters
                        </Button>
                      </div>
                    </div>
                  </PopoverContent>
                </Popover>
                
                <div className="flex items-center gap-2">
                  <Select
                    value={searchField}
                    onValueChange={(value: "name" | "status" | "category") => setSearchField(value)}
                  >
                    <SelectTrigger className="w-[150px]">
                      <SelectValue placeholder="Search by" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="name">Name</SelectItem>
                      <SelectItem value="status">Status</SelectItem>
                      <SelectItem value="category">Category</SelectItem>
                    </SelectContent>
                  </Select>
                  <div className="relative">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder={`Search by ${searchField}...`}
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-8 w-[200px]"
                    />
                  </div>
                </div>
              </div>
            </div>
            
            <TabsContent value="table" className="flex-1 overflow-auto">
              <div className="p-2 border-b flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => handleBulkAction("selectAll")}
                  >
                    Select All
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => handleBulkAction("deselectAll")}
                  >
                    Deselect All
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => handleBulkAction("selectInStock")}
                  >
                    Select In Stock
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => handleBulkAction("selectOutOfStock")}
                  >
                    Select Out of Stock
                  </Button>
                </div>
                <div className="text-sm text-muted-foreground">
                  {selectedProducts.length} of {products.length} products selected
                </div>
              </div>
              
              {isLoading ? (
                <div className="flex items-center justify-center h-64">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : (
                <DataTable
                  columns={columns}
                  data={products}
                  onRowSelection={(selectedRows) => {
                    setSelectedProducts(selectedRows.map((row) => row.id));
                  }}
                />
              )}
            </TabsContent>
            
            <TabsContent value="grid" className="flex-1 overflow-auto p-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {isLoading ? (
                  <div className="col-span-full flex items-center justify-center h-64">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  </div>
                ) : (
                  products.map((product) => (
                    <Card key={product.id} className="overflow-hidden">
                      <div className="relative">
                        <div className="aspect-square bg-muted flex items-center justify-center">
                          {product.image ? (
                            <img 
                              src={product.image} 
                              alt={product.name} 
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <ImageIcon className="h-12 w-12 text-muted-foreground" />
                          )}
                        </div>
                        <div className="absolute top-2 right-2">
                          <Checkbox
                            checked={selectedProducts.includes(product.id)}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setSelectedProducts([...selectedProducts, product.id]);
                              } else {
                                setSelectedProducts(selectedProducts.filter(id => id !== product.id));
                              }
                            }}
                            aria-label={`Select ${product.name}`}
                          />
                        </div>
                      </div>
                      <CardContent className="p-4">
                        <h3 className="font-medium truncate">{product.name}</h3>
                        <p className="text-sm text-muted-foreground truncate mb-2">
                          {product.description || "No description"}
                        </p>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center">
                            <DollarSign className="h-4 w-4 mr-1 text-muted-foreground" />
                            <span className="font-medium">{formatPrice(product.price)}</span>
                          </div>
                          <Badge variant={product.status === "ACTIVE" ? "success" : "secondary"}>
                            {product.status}
                          </Badge>
                        </div>
                        <div className="flex items-center mt-2 text-sm text-muted-foreground">
                          <Package className="h-4 w-4 mr-1" />
                          <span className={(product.stock ?? 0) > 10 ? "text-green-600" : (product.stock ?? 0) > 0 ? "text-amber-600" : "text-red-600"}>
                            {product.stock ?? 0} in stock
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </TabsContent>
          </Tabs>

          <div className="p-4 border-t flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Label>Items per page:</Label>
              <Select
                value={itemsPerPage.toString()}
                onValueChange={(value) => {
                  setItemsPerPage(parseInt(value));
                  setCurrentPage(1);
                }}
              >
                <SelectTrigger className="w-[80px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="5">5</SelectItem>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="20">20</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isLoading}>
            Save Products
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 