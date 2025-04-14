"use client"

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatPrice } from "@/lib/utils";
import { Collection, Product } from "@prisma/client";
import { 
  Image as ImageIcon,
  Package,
  Tag,
  DollarSign,
  BarChart,
  Eye,
  ShoppingCart,
  Clock,
  Calendar
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Pagination } from "@/components/ui/pagination";

interface CollectionPreviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  collection: Collection;
}

interface ProductWithStats extends Product {
  views?: number;
  clicks?: number;
  conversions?: number;
}

export function CollectionPreviewDialog({
  open,
  onOpenChange,
  collection,
}: CollectionPreviewDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [products, setProducts] = useState<ProductWithStats[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(12);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [analytics, setAnalytics] = useState({
    totalViews: 0,
    totalClicks: 0,
    totalConversions: 0,
    averageConversionRate: 0,
  });

  useEffect(() => {
    if (open) {
      fetchProducts();
      fetchAnalytics();
    }
  }, [open, collection.id, currentPage, itemsPerPage]);

  const fetchProducts = async () => {
    try {
      setIsLoading(true);
      const queryParams = new URLSearchParams({
        page: currentPage.toString(),
        limit: itemsPerPage.toString(),
        preview: "true",
      });
      
      const response = await fetch(`/api/admin/collections/${collection.id}/preview?${queryParams}`);
      if (!response.ok) throw new Error("Failed to fetch preview products");
      
      const data = await response.json();
      setProducts(data.products);
      setTotalItems(data.pagination.total);
      setTotalPages(data.pagination.totalPages);
    } catch (error) {
      console.error("Error fetching preview products:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchAnalytics = async () => {
    try {
      const response = await fetch(`/api/admin/collections/${collection.id}/analytics`);
      if (!response.ok) throw new Error("Failed to fetch analytics");
      
      const data = await response.json();
      setAnalytics(data);
    } catch (error) {
      console.error("Error fetching analytics:", error);
    }
  };

  const renderProductGrid = () => (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {isLoading ? (
        Array.from({ length: 8 }).map((_, i) => (
          <Card key={i} className="overflow-hidden">
            <Skeleton className="aspect-square w-full" />
            <CardContent className="p-4 space-y-2">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
              <Skeleton className="h-4 w-1/4" />
            </CardContent>
          </Card>
        ))
      ) : (
        products.map((product) => (
          <Card key={product.id} className="overflow-hidden group">
            <div className="relative">
              <div className="aspect-square bg-muted flex items-center justify-center">
                {product.image ? (
                  <img 
                    src={product.image} 
                    alt={product.name} 
                    className="w-full h-full object-cover transition-transform group-hover:scale-105"
                  />
                ) : (
                  <ImageIcon className="h-12 w-12 text-muted-foreground" />
                )}
              </div>
              <div className="absolute top-2 right-2">
                <Badge variant={product.status === "ACTIVE" ? "success" : "secondary"}>
                  {product.status}
                </Badge>
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
              </div>
              <div className="flex items-center mt-2 text-sm text-muted-foreground">
                <Package className="h-4 w-4 mr-1" />
                <span className={(product.stock ?? 0) > 10 ? "text-green-600" : (product.stock ?? 0) > 0 ? "text-amber-600" : "text-red-600"}>
                  {product.stock ?? 0} in stock
                </span>
              </div>
            </CardContent>
            <CardFooter className="p-4 pt-0 flex justify-between text-xs text-muted-foreground">
              <div className="flex items-center">
                <Eye className="h-3 w-3 mr-1" />
                {product.views ?? 0}
              </div>
              <div className="flex items-center">
                <ShoppingCart className="h-3 w-3 mr-1" />
                {product.conversions ?? 0}
              </div>
            </CardFooter>
          </Card>
        ))
      )}
    </div>
  );

  const renderProductList = () => (
    <div className="space-y-2">
      {isLoading ? (
        Array.from({ length: 5 }).map((_, i) => (
          <Card key={i} className="p-4">
            <div className="flex items-center gap-4">
              <Skeleton className="h-16 w-16 rounded-md" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-1/3" />
                <Skeleton className="h-3 w-1/4" />
              </div>
              <Skeleton className="h-8 w-20" />
            </div>
          </Card>
        ))
      ) : (
        products.map((product) => (
          <Card key={product.id} className="p-4">
            <div className="flex items-center gap-4">
              <div className="h-16 w-16 rounded-md overflow-hidden bg-muted flex items-center justify-center">
                {product.image ? (
                  <img 
                    src={product.image} 
                    alt={product.name} 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <ImageIcon className="h-8 w-8 text-muted-foreground" />
                )}
              </div>
              <div className="flex-1">
                <h3 className="font-medium">{product.name}</h3>
                <p className="text-sm text-muted-foreground truncate max-w-md">
                  {product.description || "No description"}
                </p>
                <div className="flex items-center mt-1 text-sm">
                  <Package className="h-3 w-3 mr-1 text-muted-foreground" />
                  <span className={(product.stock ?? 0) > 10 ? "text-green-600" : (product.stock ?? 0) > 0 ? "text-amber-600" : "text-red-600"}>
                    {product.stock ?? 0} in stock
                  </span>
                  <span className="mx-2">•</span>
                  <Badge variant={product.status === "ACTIVE" ? "success" : "secondary"} className="text-xs">
                    {product.status}
                  </Badge>
                </div>
              </div>
              <div className="text-right">
                <div className="font-medium">{formatPrice(product.price)}</div>
                <div className="flex items-center justify-end gap-4 mt-1 text-xs text-muted-foreground">
                  <div className="flex items-center">
                    <Eye className="h-3 w-3 mr-1" />
                    {product.views ?? 0}
                  </div>
                  <div className="flex items-center">
                    <ShoppingCart className="h-3 w-3 mr-1" />
                    {product.conversions ?? 0}
                  </div>
                </div>
              </div>
            </div>
          </Card>
        ))
      )}
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[900px] max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Collection Preview - {collection.name}</DialogTitle>
          <DialogDescription>
            Preview how this collection will appear to customers.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-hidden flex flex-col">
          <Tabs defaultValue="grid" className="w-full" onValueChange={(value) => setViewMode(value as "grid" | "list")}>
            <div className="flex items-center justify-between p-4 border-b">
              <TabsList>
                <TabsTrigger value="grid">Grid View</TabsTrigger>
                <TabsTrigger value="list">List View</TabsTrigger>
              </TabsList>
              
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 text-sm">
                  <Eye className="h-4 w-4 text-muted-foreground" />
                  <span>{analytics.totalViews.toLocaleString()} views</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <ShoppingCart className="h-4 w-4 text-muted-foreground" />
                  <span>{analytics.totalConversions.toLocaleString()} purchases</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <BarChart className="h-4 w-4 text-muted-foreground" />
                  <span>{analytics.averageConversionRate.toFixed(1)}% conversion</span>
                </div>
              </div>
            </div>
            
            <TabsContent value="grid" className="flex-1 overflow-auto p-4">
              {renderProductGrid()}
            </TabsContent>
            
            <TabsContent value="list" className="flex-1 overflow-auto p-4">
              {renderProductList()}
            </TabsContent>
          </Tabs>

          <div className="p-4 border-t flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Items per page:</span>
              <select 
                className="h-8 rounded-md border border-input bg-background px-3 py-1 text-sm"
                value={itemsPerPage}
                onChange={(e) => {
                  setItemsPerPage(parseInt(e.target.value));
                  setCurrentPage(1);
                }}
              >
                <option value="12">12</option>
                <option value="24">24</option>
                <option value="48">48</option>
              </select>
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
          >
            Close
          </Button>
          <Button>
            View on Frontend
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 