"use client";

import Link from "next/link";
import Image from "next/image";
import { Product } from '@prisma/client';
import { formatPrice } from "@/utils/format";

interface RelatedProductsProps {
  products: (Product & {
    category: Category;
  })[];
}

export function RelatedProducts({ products }: RelatedProductsProps) {
  if (products.length === 0) {
    return null;
  }

  return (
    <div className="mt-16 sm:mt-24">
      <h2 className="text-2xl font-bold tracking-tight text-foreground">
        Customers also purchased
      </h2>

      <div className="mt-6 grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-4 xl:gap-x-8">
        {products.map((product: Product) => (
          <div key={product.id} className="group relative">
            <div className="aspect-h-1 aspect-w-1 w-full overflow-hidden rounded-md bg-muted lg:aspect-none group-hover:opacity-75 lg:h-80">
              <Image
                src={product.images?.[0] || '/placeholder.png'}
                alt={product.name}
                width={500}
                height={500}
                className="h-full w-full object-cover object-center lg:h-full lg:w-full"
              />
            </div>
            <div className="mt-4 flex justify-between">
              <div>
                <h3 className="text-sm text-foreground">
                  <Link href={`/products/${product.slug}`}>
                    <span aria-hidden="true" className="absolute inset-0" />
                    {product.name}
                  </Link>
                </h3>
                <p className="mt-1 text-sm text-muted-foreground">{product.category.name}</p>
              </div>
              <p className="text-sm font-medium text-foreground">
                {formatPrice(product.price)}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
} 