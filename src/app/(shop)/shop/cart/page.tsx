import { Metadata } from "next";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { CartItems } from "@/components/shop/cart-items";
import { CartSummary } from "@/components/shop/cart-summary";
import { CartItem as PrismaCartItem, Product, ProductVariant } from "@prisma/client";
import { CartItem } from "@/types/cart";

export const metadata: Metadata = {
  title: "Shopping Cart - BINWAHAB",
  description: "View your shopping cart",
};

export default async function CartPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/login");
  }

  const cart = await prisma.cart.findUnique({
    where: {
      userId: session.user.id,
    },
    include: {
      items: {
        include: {
          product: true,
          variant: true,
        },
      },
    },
  });

  // Filter out items with null products
  const validPrismaItems = (cart?.items?.filter(item => item.product !== null) || []).map(item => ({
    ...item,
    product: item.product!,
    variant: item.variant
  })) as (PrismaCartItem & { product: Product, variant: ProductVariant | null })[];

  // Transform to CartItem type for CartItems component
  const validCartItems = validPrismaItems.map(item => ({
    id: item.id,
    quantity: item.quantity,
    product: {
      id: item.product.id,
      name: item.product.name,
      price: item.product.price.toString(),
      image: item.product.image || undefined,
      description: item.product.description || undefined,
    },
    variant: item.variant ? {
      id: item.variant.id,
      sku: item.variant.sku,
      name: item.variant.name,
      price: item.variant.price.toString(),
      image: item.variant.images[0] || undefined,
    } : undefined,
  })) satisfies CartItem[];

  const isEmpty = validPrismaItems.length === 0;

  return (
    <main className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Shopping Cart</h1>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className={isEmpty ? "col-span-3" : "lg:col-span-2"}>
          <CartItems items={validCartItems} />
        </div>
        {!isEmpty && (
          <div className="lg:col-span-1">
            <CartSummary items={validPrismaItems} />
          </div>
        )}
      </div>
    </main>
  );
} 