import { Metadata } from "next";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { CheckoutForm } from "@/components/shop/checkout-form";
import { CartSummary } from "@/components/shop/cart-summary";
import { CartItem, Product } from "@prisma/client";

export const metadata: Metadata = {
  title: "Checkout - BINWAHAB",
  description: "Complete your purchase",
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
        },
      },
    },
  });

  // Filter out items with null products
  const validItems = cart?.items?.filter(item => item.product !== null) || [];
  const typedItems = validItems.map(item => ({
    ...item,
    product: item.product!
  })) as (CartItem & { product: Product })[];
  const isEmpty = typedItems.length === 0;

  if (isEmpty) {
    redirect("/shop/cart");
  }

  // Get user addresses
  const addresses = await prisma.address.findMany({
    where: {
      userId: session.user.id,
    },
  });

  return (
    <main className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Checkout</h1>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <CheckoutForm addresses={addresses} />
        </div>
        <div className="lg:col-span-1">
          <CartSummary items={typedItems} />
        </div>
      </div>
    </main>
  );
} 