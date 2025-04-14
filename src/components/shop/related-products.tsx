"use client";

import Link from "next/link";
import Image from "next/image";
import { Product as PrismaProduct, Category } from "@prisma/client";
import { Product } from "@/types/product";
import { formatPrice } from "@/lib/utils";
import { ProductCard } from "./product-card";

interface RelatedProductsProps {
  products: Product[];
}

export function RelatedProducts({ products }: RelatedProductsProps) {
  if (products.length === 0) return null;

  return (
    <div>
      <h2 className="text-2xl font-semibold mb-6">Related Products</h2>
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </div>
  );
} 