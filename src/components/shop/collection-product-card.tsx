import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { formatPrice } from "@/lib/utils";

interface CollectionProduct {
  id: string;
  name: string;
  price: number;
  image: string | null;
  slug: string;
  category: {
    name: string;
  };
}

interface CollectionProductCardProps {
  product: CollectionProduct;
}

export function CollectionProductCard({ product }: CollectionProductCardProps) {
  return (
    <Card className="overflow-hidden">
      <Link href={`/shop/products/${product.slug}`}>
        <div className="relative aspect-square">
          <Image
            src={product.image || "/placeholder.png"}
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
        <p className="text-sm text-muted-foreground">{product.category.name}</p>
        <p className="mt-2 font-semibold">{formatPrice(product.price)}</p>
      </CardContent>
      <CardFooter className="p-4 pt-0">
        <Button className="w-full">Add to Cart</Button>
      </CardFooter>
    </Card>
  );
} 