"use client";

import { useState, useEffect } from "react";
import { Plus, Search, Edit, Trash2, MoreHorizontal, Copy } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/components/ui/use-toast";
import { useRouter } from "next/navigation";
import { Product } from "@prisma/client";
import { formatPrice } from "@/lib/utils";
import { ImageWithFallback } from "@/components/ui/image-with-fallback";

interface ProductImage {
  id: number;
  url: string;
  order: number;
  productId: number;
  createdAt: Date;
  updatedAt: Date;
}

interface ProductVariant {
  id: number;
  name: string;
  sku: string;
  price: number;
  stock: number;
  options: Record<string, string>;
}

type ProductWithDetails = Product & {
  images: ProductImage[];
  variants: ProductVariant[];
};

export default function ProductsPage() {
  const [products, setProducts] = useState<ProductWithDetails[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const router = useRouter();

  // Fetch products
  const fetchProducts = async () => {
    try {
      const response = await fetch("/api/admin/products");
      if (!response.ok) throw new Error("Failed to fetch products");
      const data = await response.json();
      setProducts(data);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch products",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Call fetchProducts when component mounts
  useEffect(() => {
    fetchProducts();
  }, []);

  // Delete product
  const handleDelete = async (productId: number) => {
    try {
      const response = await fetch(`/api/admin/products/${productId}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Failed to delete product");

      toast({
        title: "Success",
        description: "Product deleted successfully",
      });

      // Refresh products list
      fetchProducts();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete product",
        variant: "destructive",
      });
    }
  };

  // Duplicate product
  const handleDuplicate = async (productId: number) => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/admin/products/${productId}/duplicate`, {
        method: "POST",
      });

      if (!response.ok) throw new Error("Failed to duplicate product");

      const duplicatedProduct = await response.json();

      toast({
        title: "Success",
        description: "Product duplicated successfully",
      });

      // Refresh products list
      fetchProducts();
      
      // Navigate to edit page of the duplicated product
      router.push(`/admin/products/${duplicatedProduct.id}/edit`);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to duplicate product",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Filter products based on search query
  const filteredProducts = products.filter(
    (product) =>
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      String(product.id).includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Products</h1>
          <p className="text-muted-foreground">
            Manage your product inventory and listings.
          </p>
        </div>
        <Button onClick={() => router.push("/admin/products/new")}>
          <Plus className="mr-2 h-4 w-4" />
          Add Product
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Products</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-4 flex items-center">
            <div className="relative w-full max-w-sm">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search products..."
                className="pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
          <div className="relative w-full overflow-auto">
            <table className="w-full caption-bottom text-sm">
              <thead className="[&_tr]:border-b">
                <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                  <th className="h-10 px-2 text-left align-middle font-medium text-muted-foreground">
                    Image
                  </th>
                  <th className="h-10 px-2 text-left align-middle font-medium text-muted-foreground">
                    Product ID
                  </th>
                  <th className="h-10 px-2 text-left align-middle font-medium text-muted-foreground">
                    Name
                  </th>
                  <th className="h-10 px-2 text-left align-middle font-medium text-muted-foreground">
                    Variants
                  </th>
                  <th className="h-10 px-2 text-left align-middle font-medium text-muted-foreground">
                    Price
                  </th>
                  <th className="h-10 px-2 text-left align-middle font-medium text-muted-foreground">
                    Stock
                  </th>
                  <th className="h-10 px-2 text-left align-middle font-medium text-muted-foreground">
                    Status
                  </th>
                  <th className="h-10 px-2 text-left align-middle font-medium text-muted-foreground">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="[&_tr:last-child]:border-0">
                {filteredProducts.map((product) => (
                  <tr
                    key={product.id}
                    className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted"
                  >
                    <td className="p-2 align-middle">
                      <div className="w-16 h-16 rounded-md overflow-hidden bg-muted flex items-center justify-center">
                        <ImageWithFallback
                          src={product.images?.[0]?.url || product.image || ""}
                            alt={product.name}
                            className="w-full h-full object-cover"
                          type="product"
                          />
                      </div>
                    </td>
                    <td className="p-2 align-middle">{product.id}</td>
                    <td className="p-2 align-middle">{product.name}</td>
                    <td className="p-2 align-middle">
                      <div className="space-y-1">
                        {product.variants && product.variants.length > 0 ? (
                          product.variants.map((variant) => (
                            <div key={variant.id} className="text-xs">
                              <span className="font-medium">{variant.name}</span>
                              {Object.entries(variant.options).map(([key, value]) => (
                                <span key={key} className="ml-2 text-muted-foreground">
                                  {key}: {value}
                                </span>
                              ))}
                            </div>
                          ))
                        ) : (
                          <span className="text-xs text-muted-foreground">No variants</span>
                        )}
                      </div>
                    </td>
                    <td className="p-2 align-middle">
                      {product.variants && product.variants.length > 0 ? (
                        <div className="space-y-1">
                          {product.variants.map((variant) => (
                            <div key={variant.id} className="text-xs">
                              {formatPrice(Number(variant.price))}
                            </div>
                          ))}
                        </div>
                      ) : (
                        formatPrice(Number(product.price))
                      )}
                    </td>
                    <td className="p-2 align-middle">
                      {product.variants && product.variants.length > 0 ? (
                        <div className="space-y-1">
                          {product.variants.map((variant) => (
                            <div key={variant.id} className="text-xs">
                              {variant.stock}
                            </div>
                          ))}
                        </div>
                      ) : (
                        product.stock
                      )}
                    </td>
                    <td className="p-2 align-middle">
                      <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                        product.status === "ACTIVE" 
                          ? "bg-green-50 text-green-700" 
                          : product.status === "DRAFT"
                          ? "bg-yellow-50 text-yellow-700"
                          : "bg-red-50 text-red-700"
                      }`}>
                        {product.status}
                      </span>
                    </td>
                    <td className="p-2 align-middle">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() =>
                              router.push(`/admin/products/${product.id}/edit`)
                            }
                          >
                            <Edit className="mr-2 h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleDuplicate(Number(product.id))}
                          >
                            <Copy className="mr-2 h-4 w-4" />
                            Duplicate
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleDelete(Number(product.id))}
                            className="text-red-600"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 