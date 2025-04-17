import { Metadata } from "next";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { CartItems } from "@/components/shop/cart-items";
import { CartSummary } from "@/components/shop/cart-summary";
import { Steps } from "@/components/ui/steps";
import { CartItem as PrismaCartItem } from "@prisma/client";
import { CartItem } from "@/types/cart";
import { CartInitializer } from "@/components/shop/cart-initializer";
import { Decimal } from "decimal.js";
import { Product, ProductVariant } from "@prisma/client";
import { ShoppingBag } from "lucide-react";

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

  // Transform cart items to match CartSummary props type
  const validPrismaItems = (cart?.items?.filter(item => item.product !== null) || []).map(item => ({
    id: item.id,
    userId: item.userId,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
    quantity: item.quantity,
    productId: item.productId,
    variantId: item.variantId,
    cartId: item.cartId,
    product: {
      ...item.product!,
      price: Number(item.product!.price)
    },
    variant: item.variant ? {
      ...item.variant,
      price: Number(item.variant.price)
    } : undefined
  }));

  // Transform to CartItem type for CartItems component
  const validCartItems = validPrismaItems.map(item => ({
    id: item.id,
    quantity: item.quantity,
    product: {
      id: item.product.id,
      name: item.product.name,
      price: Number(item.product.price),
      image: item.product.image || undefined,
      description: item.product.description || undefined,
    },
    variant: item.variant ? {
      id: item.variant.id,
      sku: item.variant.sku,
      name: item.variant.name,
      price: Number(item.variant.price),
      image: item.variant.images[0] || undefined,
    } : undefined,
  }));

  const isEmpty = validPrismaItems.length === 0;

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
            {isEmpty ? (
              <div className="max-w-3xl mx-auto">
                <CartItems items={validCartItems} />
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                <div className="lg:col-span-8">
                  <CartItems items={validCartItems} />
                </div>
                <div className="lg:col-span-4">
                  <div className="sticky top-8">
                    <CartSummary items={validPrismaItems} />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 