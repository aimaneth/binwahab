'use client';

import Image from "next/image";
import Link from "next/link";
import { Product } from "@/types/product";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { formatPrice } from "@/lib/utils";
import { Eye } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  const imageUrl = product.images && product.images.length > 0 
    ? product.images[0].url 
    : product.image || "/images/fallback-product.jpg";
  
  // Ensure we have a valid slug, fallback to product ID if not
  const productUrl = `/shop/products/${product.slug || `product-${product.id}`}`;

  // Check if product is out of stock
  const isOutOfStock = product.variants.length > 0
    ? product.variants.every(variant => variant.stock <= variant.reservedStock)
    : product.stock <= product.reservedStock;

  // Get available sizes from variants
  const availableSizes = product.variants
    .filter(variant => variant.stock > variant.reservedStock && variant.isActive)
    .map(variant => variant.options.Size)
    .filter((size, index, self) => size && self.indexOf(size) === index)
    .sort((a, b) => {
      const sizeOrder = { 'S': 1, 'M': 2, 'L': 3, 'XL': 4, 'XXL': 5 };
      return (sizeOrder[a] || 99) - (sizeOrder[b] || 99);
    });

  return (
    <Card className="group overflow-hidden">
      <Link href={productUrl}>
        <div className="relative aspect-square overflow-hidden bg-gray-100">
          <Image
            src={imageUrl}
            alt={product.name}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
          />
          {isOutOfStock && (
            <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
              <Badge variant="destructive" className="text-sm font-semibold">
                Out of Stock
              </Badge>
            </div>
          )}
        </div>
      </Link>
      <CardContent className="p-4">
        <Link href={productUrl}>
          <h3 className="font-semibold group-hover:text-primary transition-colors">{product.name}</h3>
        </Link>
        {product.category && (
          <p className="text-sm text-muted-foreground">{product.category.name}</p>
        )}
        <div className="mt-2 flex items-center justify-between">
          <p className="font-semibold">{formatPrice(Number(product.price))}</p>
          {availableSizes.length > 0 && (
            <div className="flex gap-1">
              {availableSizes.map((size) => (
                <Badge key={size} variant="outline" className="text-xs">
                  {size}
                </Badge>
              ))}
            </div>
          )}
        </div>
      </CardContent>
      <CardFooter className="p-4 pt-0">
        <Link href={productUrl} className="w-full">
          <Button 
            className="w-full gap-2" 
            variant={isOutOfStock ? "destructive" : "secondary"}
          >
            <Eye className="h-4 w-4" />
            {isOutOfStock ? "Notify When Available" : "View Details"}
          </Button>
        </Link>
      </CardFooter>
    </Card>
  );
}