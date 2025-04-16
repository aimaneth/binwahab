import { CartInitializer } from "@/components/shop/cart-initializer";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { Steps } from "@/components/ui/steps";
import { redirect } from "next/navigation";
import { CartItem } from "@/types/cart";
import { OrderItem } from "@/types/order";
import { CheckoutForm } from "@/components/shop/checkout-form";

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

  // Transform cart items for CartInitializer (uses CartItem type)
  const cartItems = (cart?.items?.filter(item => item.product !== null) || []).map(item => ({
    id: item.id,
    quantity: item.quantity,
    product: {
      id: item.product!.id,
      name: item.product!.name,
      price: item.product!.price.toString(),
      image: item.product!.image || undefined,
      description: item.product!.description || undefined,
    },
    variant: item.variant ? {
      id: item.variant.id,
      sku: item.variant.sku,
      name: item.variant.name,
      price: item.variant.price.toString(),
      image: item.variant.images[0] || undefined,
    } : undefined,
  })) as CartItem[];

  // Transform cart items for OrderSummary (uses OrderItem type)
  const orderItems = cartItems.map(item => ({
    id: item.id.toString(),
    quantity: item.quantity,
    product: {
      id: item.product.id.toString(),
      name: item.product.name,
      price: item.product.price.toString(),
      image: item.product.image,
      description: item.product.description,
    },
    variant: item.variant ? {
      id: item.variant.id.toString(),
      sku: item.variant.sku,
      name: item.variant.name,
      price: item.variant.price.toString(),
      image: item.variant.image,
    } : undefined,
  })) as OrderItem[];

  return (
    <main className="container mx-auto px-4 py-8">
      {/* Initialize cart state from server */}
      <CartInitializer items={cartItems} />
      
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Checkout</h1>
        
        <div className="mb-12">
          <Steps
            steps={[
              { title: "Cart", href: "/shop/cart", status: "complete" },
              { title: "Checkout", href: "#", status: "current" },
              { title: "Confirmation", href: "#", status: "upcoming" },
            ]}
          />
        </div>

        <CheckoutForm items={orderItems} />
      </div>
    </main>
  );
} 