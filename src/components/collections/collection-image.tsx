"use client";

import Image from "next/image";
import { cn } from "@/lib/utils";

interface CollectionImageProps {
  image?: string | null;
  image2?: string | null;
  alt: string;
  className?: string;
}

export function CollectionImage({ image, image2, alt, className }: CollectionImageProps) {
  if (!image && !image2) {
    return (
      <div className={cn("relative aspect-square bg-muted", className)}>
        <div className="flex h-full items-center justify-center">
          <span className="text-muted-foreground">No image</span>
        </div>
      </div>
    );
  }

  if (image && image2) {
    return (
      <div className={cn("relative aspect-square grid grid-cols-2 gap-1", className)}>
        <div className="relative overflow-hidden">
          <Image
            src={image}
            alt={`${alt} - Primary`}
            fill
            className="object-cover"
          />
        </div>
        <div className="relative overflow-hidden">
          <Image
            src={image2}
            alt={`${alt} - Secondary`}
            fill
            className="object-cover"
          />
        </div>
      </div>
    );
  }

  return (
    <div className={cn("relative aspect-square overflow-hidden", className)}>
      <Image
        src={image || image2 || ""}
        alt={alt}
        fill
        className="object-cover"
      />
    </div>
  );
} 