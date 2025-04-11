"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { formatPrice } from "@/utils/format";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  GridLayout, 
  ListLayout, 
  CarouselLayout 
} from "@/components/ui/layouts";
import { Collection } from "@/types/collection";
import { CollectionImage } from "./collection-image";

interface Product {
  id: string;
  name: string;
  description: string | null;
  price: number;
  image: string | null;
  category: {
    name: string;
  };
  stock: number;
  status: string;
}

interface CollectionPreviewProps {
  collection: Collection;
}

export function CollectionPreview({ collection }: CollectionPreviewProps) {
  return (
    <div className="space-y-4">
      <CollectionImage
        image={collection.image}
        image2={collection.image2}
        alt={collection.name}
        className="w-full rounded-lg"
      />
      <div className="space-y-2">
        <h3 className="text-lg font-semibold">{collection.name}</h3>
        {collection.description && (
          <p className="text-sm text-muted-foreground">{collection.description}</p>
        )}
      </div>
    </div>
  );
}

function ProductCard({ product }: { product: Product }) {
  return (
    <div className="group relative rounded-lg border p-2 hover:shadow-md transition-shadow">
      <div className="aspect-square overflow-hidden rounded-md">
        {product.image ? (
          <img
            src={product.image}
            alt={product.name}
            className="h-full w-full object-cover object-center"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-muted">
            <span className="text-muted-foreground">No image</span>
          </div>
        )}
      </div>
      <div className="mt-2 space-y-1">
        <h3 className="font-medium text-sm">{product.name}</h3>
        <p className="text-sm font-medium">{formatPrice(product.price)}</p>
        <div className="flex items-center gap-1">
          <Badge variant="outline" className="text-xs">
            {product.category.name}
          </Badge>
          {product.stock <= 10 && product.stock > 0 && (
            <Badge variant="secondary" className="text-xs">
              Low Stock
            </Badge>
          )}
          {product.stock === 0 && (
            <Badge variant="destructive" className="text-xs">
              Out of Stock
            </Badge>
          )}
        </div>
      </div>
    </div>
  );
}

function ProductListItem({ product }: { product: Product }) {
  return (
    <div className="flex items-center gap-4 rounded-lg border p-3 hover:shadow-md transition-shadow">
      <div className="h-16 w-16 overflow-hidden rounded-md">
        {product.image ? (
          <img
            src={product.image}
            alt={product.name}
            className="h-full w-full object-cover object-center"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-muted">
            <span className="text-muted-foreground text-xs">No image</span>
          </div>
        )}
      </div>
      <div className="flex-1">
        <h3 className="font-medium">{product.name}</h3>
        <p className="text-sm text-muted-foreground">{product.category.name}</p>
        {product.description && (
          <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
            {product.description}
          </p>
        )}
      </div>
      <div className="text-right">
        <p className="font-medium">{formatPrice(product.price)}</p>
        <div className="mt-1">
          {product.stock <= 10 && product.stock > 0 && (
            <Badge variant="secondary" className="text-xs">
              Low Stock
            </Badge>
          )}
          {product.stock === 0 && (
            <Badge variant="destructive" className="text-xs">
              Out of Stock
            </Badge>
          )}
        </div>
      </div>
    </div>
  );
}

function LoadingSkeleton({ layout }: { layout: string }) {
  if (layout === "grid") {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="rounded-lg border p-2">
            <Skeleton className="aspect-square w-full rounded-md" />
            <div className="mt-2 space-y-2">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-1/4" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (layout === "list") {
    return (
      <div className="space-y-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 rounded-lg border p-3">
            <Skeleton className="h-16 w-16 rounded-md" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-1/3" />
              <Skeleton className="h-3 w-1/4" />
              <Skeleton className="h-3 w-2/3" />
            </div>
            <div className="text-right space-y-2">
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-3 w-20" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="flex gap-4 overflow-x-auto pb-4">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="flex-shrink-0 w-48 rounded-lg border p-2">
          <Skeleton className="aspect-square w-full rounded-md" />
          <div className="mt-2 space-y-2">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-1/4" />
            <Skeleton className="h-3 w-1/2" />
          </div>
        </div>
      ))}
    </div>
  );
} 