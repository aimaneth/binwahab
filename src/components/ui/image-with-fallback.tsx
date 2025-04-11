import Image from "next/image";
import { useState } from "react";

interface ImageWithFallbackProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
  type?: "banner" | "collection" | "product";
  fill?: boolean;
}

export function ImageWithFallback({
  src,
  alt,
  width,
  height,
  className = "",
  type = "product",
  fill = false,
}: ImageWithFallbackProps) {
  const [error, setError] = useState(false);

  const getFallbackImage = () => {
    switch (type) {
      case "banner":
        return "/images/fallback-banner.jpg";
      case "collection":
        return "/images/fallback-collection.jpg";
      case "product":
      default:
        return "/images/fallback-product.jpg";
    }
  };

  return (
    <Image
      src={error ? getFallbackImage() : src}
      alt={alt}
      {...(fill ? { fill } : { width, height })}
      className={className}
      onError={() => setError(true)}
    />
  );
} 