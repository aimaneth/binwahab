import Image from "next/image";
import Link from "next/link";
import { Product, Category } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { formatPrice } from "@/lib/utils";

interface ProductCardProps {
  product: Product & {
    category: Category | null;
    images?: { url: string }[];
  };
}

export function ProductCard({ product }: ProductCardProps) {
  const imageUrl = product.images && product.images.length > 0 
    ? product.images[0].url 
    : product.image || "/images/fallback-product.jpg";

  return (
    <Card className="overflow-hidden">
      <Link href={`/shop/products/${product.slug}`}>
        <div className="relative aspect-square">
          <Image
            src={imageUrl}
            alt={product.name}
            fill
            className="object-cover"
          />
        </div>
      </Link>
      <CardContent className="p-4">
        <Link href={`/shop/products/${product.slug}`}>
          <h3 className="font-semibold hover:underline">{product.name}</h3>
        </Link>
        {product.category && (
          <p className="text-sm text-muted-foreground">{product.category.name}</p>
        )}
        <p className="mt-2 font-semibold">{formatPrice(Number(product.price))}</p>
      </CardContent>
      <CardFooter className="p-4 pt-0">
        <Button className="w-full">Add to Cart</Button>
      </CardFooter>
    </Card>
  );
} 