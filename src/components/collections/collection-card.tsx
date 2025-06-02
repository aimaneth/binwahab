"use client";

import Link from "next/link";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ImageWithFallback } from "@/components/ui/image-with-fallback";
import { ArrowRight } from "lucide-react";

interface CollectionCardProps {
  collection: {
    id: string;
    name: string;
    description: string | null;
    image: string | null;
    image2?: string | null;
    slug: string;
  };
  variant?: "default" | "featured" | "complete";
}

export function CollectionCard({ collection, variant = "default" }: CollectionCardProps) {
  const isFeatured = variant === "featured";
  const isComplete = variant === "complete";
  const DEFAULT_COLLECTION_IMAGE = "/images/fallback-collection.jpg";

  return (
    <Card className={`overflow-hidden ${isFeatured ? "border-2 border-primary" : ""}`}>
      <Link href={`/shop/collection/${collection.slug}`}>
        <div className="relative aspect-[4/3]">
          {isFeatured && collection.image2 ? (
            <div className="grid grid-cols-2 h-full">
              <div className="relative">
                <ImageWithFallback
                  src={collection.image || DEFAULT_COLLECTION_IMAGE}
                  alt={collection.name}
                  fill
                  className="object-cover"
                  type="collection"
                />
              </div>
              <div className="relative">
                <ImageWithFallback
                  src={collection.image2}
                  alt={`${collection.name} - Secondary`}
                  fill
                  className="object-cover"
                  type="collection"
                />
              </div>
            </div>
          ) : (
            <ImageWithFallback
              src={collection.image || DEFAULT_COLLECTION_IMAGE}
              alt={collection.name}
              fill
              className="object-cover"
              type="collection"
            />
          )}
          {isFeatured && (
            <div className="absolute top-3 left-3 bg-primary text-primary-foreground px-3 py-1 rounded-full text-sm font-medium">
              Featured
            </div>
          )}
        </div>
      </Link>
      <CardContent className="p-4">
        <Link href={`/shop/collection/${collection.slug}`}>
          <h3 className="text-xl font-semibold hover:underline">{collection.name}</h3>
        </Link>
        {collection.description && (
          <p className="text-muted-foreground line-clamp-2 mt-2">{collection.description}</p>
        )}
      </CardContent>
      <CardFooter className="p-4 pt-0">
        <Button asChild variant={isFeatured ? "default" : "outline"} className="w-full">
          <Link href={`/shop/collection/${collection.slug}`}>
            View Collection
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
} 