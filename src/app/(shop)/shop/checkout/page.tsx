import { Metadata } from "next";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { CheckoutConfig } from "@/components/stripe/checkout-config";
import { CartItem as PrismaCartItem, Product, ProductVariant } from "@prisma/client";

export const metadata: Metadata = {
  title: "Checkout - BINWAHAB",
  description: "Complete your purchase",
};

type CartItemWithDetails = PrismaCartItem & {
  product: Product;
  variant: ProductVariant | null;
};

export default async function CheckoutPage() {
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

  // Filter out items with null products and cast to the correct type
  const validItems = (cart?.items?.filter(item => item.product !== null) || []) as CartItemWithDetails[];
  const isEmpty = validItems.length === 0;

  if (isEmpty) {
    redirect("/shop/cart");
  }

  // Transform items to match the CheckoutConfig component's expected type
  const checkoutItems = validItems.map((item) => ({
    id: item.id.toString(),
    quantity: item.quantity,
    product: {
      id: item.product.id.toString(),
      name: item.product.name,
      price: item.product.price.toString(),
      image: item.product.image || undefined,
      description: item.product.description || undefined,
    },
    variant: item.variant ? {
      id: item.variant.id.toString(),
      sku: item.variant.sku,
      price: item.variant.price.toString(),
      name: item.variant.name,
      image: item.variant.images[0] || undefined,
    } : undefined,
  }));

  return (
    <main className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Checkout</h1>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <CheckoutConfig items={checkoutItems} />
        </div>
      </div>
    </main>
  );
} 