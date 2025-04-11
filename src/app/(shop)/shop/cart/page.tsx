import { Metadata } from "next";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { CartItems } from "@/components/shop/cart-items";
import { CartSummary } from "@/components/shop/cart-summary";

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
        },
      },
    },
  });

  const isEmpty = !cart?.items || cart.items.length === 0;

  return (
    <main className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Shopping Cart</h1>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className={isEmpty ? "col-span-3" : "lg:col-span-2"}>
          <CartItems items={cart?.items || []} />
        </div>
        {!isEmpty && (
          <div className="lg:col-span-1">
            <CartSummary items={cart?.items || []} />
          </div>
        )}
      </div>
    </main>
  );
} 