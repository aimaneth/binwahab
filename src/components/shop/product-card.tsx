'use client';

import Image from "next/image";
import Link from "next/link";
import { Product as PrismaProduct, Category } from "@prisma/client";
import { Product } from "@/types/product";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { formatPrice } from "@/lib/utils";
import { Eye } from "lucide-react";

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  const imageUrl = product.images && product.images.length > 0 
    ? product.images[0].url 
    : product.image || "/images/fallback-product.jpg";
  
  // Ensure we have a valid slug, fallback to product ID if not
  const productUrl = `/shop/products/${product.slug || `product-${product.id}`}`;

  // Debug log to check product data
  console.log('Product data:', { id: product.id, slug: product.slug, url: productUrl });

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
        </div>
      </Link>
      <CardContent className="p-4">
        <Link href={productUrl}>
          <h3 className="font-semibold group-hover:text-primary transition-colors">{product.name}</h3>
        </Link>
        {product.category && (
          <p className="text-sm text-muted-foreground">{product.category.name}</p>
        )}
        <p className="mt-2 font-semibold">{formatPrice(Number(product.price))}</p>
      </CardContent>
      <CardFooter className="p-4 pt-0">
        <Link href={productUrl} className="w-full">
          <Button className="w-full gap-2" variant="secondary">
            <Eye className="h-4 w-4" />
            View Details
          </Button>
        </Link>
      </CardFooter>
    </Card>
  );
} 