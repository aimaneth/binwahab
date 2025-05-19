import { Metadata } from "next";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { CartItems } from "@/components/shop/cart-items";
import { CartSummary } from "@/components/shop/cart-summary";
import { Steps } from "@/components/ui/steps";
import { CartInitializer } from "@/components/shop/cart-initializer";
import { ShoppingBag } from "lucide-react";
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
          product: {
            include: {
              images: true
            }
          },
          variant: true,
        },
      },
    },
  });

  // Transform cart items to match CartInitializer shape
  const cartItemsRaw = (cart?.items || []).filter(item => item.product !== null);
  const validCartItems: CartItem[] = cartItemsRaw.map(item => ({
    id: item.id,
    quantity: item.quantity,
    product: {
      id: item.product!.id,
      name: item.product!.name,
      price: Number(item.product!.price),
      image: item.product!.image || undefined,
      images: item.product!.images?.map(img => ({ url: img.url })) || undefined,
      description: item.product!.description || undefined,
    },
    variant: item.variant ? {
      id: item.variant.id,
      sku: item.variant.sku,
      name: item.variant.name,
      price: Number(item.variant.price),
      image: item.variant.images && item.variant.images.length > 0 ? item.variant.images[0] : undefined,
      options: item.variant.options as Record<string, string> || undefined,
    } : undefined,
  }));

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        {/* Initialize client-side cart state */}
        <CartInitializer items={validCartItems} />
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-3xl font-bold text-foreground">Shopping Cart</h1>
            <div className="flex items-center text-sm text-muted-foreground">
              <ShoppingBag className="h-5 w-5 mr-2" />
              <span>{validCartItems.length} items</span>
            </div>
          </div>
          {/* Progress Steps */}
          <div className="max-w-3xl mx-auto mb-8">
            <Steps
              steps={[
                { 
                  title: "Shopping Cart", 
                  href: "/shop/cart", 
                  status: "current" 
                },
                { 
                  title: "Checkout & Payment", 
                  href: "#", 
                  status: "upcoming" 
                }
              ]}
            />
          </div>
          {/* Cart Content */}
          <div className="mt-8">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              <div className="lg:col-span-8">
                <CartItems />
              </div>
              <div className="lg:col-span-4">
                <div className="sticky top-8">
                  <CartSummary />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 