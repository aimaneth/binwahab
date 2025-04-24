import { Metadata } from "next";
import Link from "next/link";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { CheckCircle } from "lucide-react";
import { stripe } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";
import { formatOrderId } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Payment Successful - BINWAHAB",
  description: "Your payment has been processed successfully",
};

async function createOrder(session: any, checkoutSession: any) {
  try {
    // Get the shipping address ID from metadata
    const shippingAddressId = checkoutSession.metadata.shippingAddressId;

    // Verify the shipping address exists and belongs to the user
    const address = await prisma.address.findUnique({
      where: {
        id: shippingAddressId,
        userId: session.user.id
      }
    });

    if (!address) {
      throw new Error("Invalid shipping address");
    }

    // Parse the items from metadata
    const items = JSON.parse(checkoutSession.metadata.items);

    // Create order
    const order = await prisma.order.create({
      data: {
        userId: session.user.id,
        total: checkoutSession.amount_total / 100,
        status: "PROCESSING",
        paymentStatus: "PAID",
        paymentMethod: checkoutSession.payment_method_types[0].toUpperCase(),
        shippingAddressId: shippingAddressId,
        items: {
          create: items.map((item: any) => ({
            productId: item.productId,
            variantId: item.variantId || null,
            quantity: item.quantity,
            price: checkoutSession.line_items.data.find(
              (li: any) => li.price.product.metadata.productId === item.productId
            )?.price.unit_amount / 100 || 0,
          })),
        },
      },
      include: {
        items: true,
        shippingAddress: true,
      },
    });

    return order;
  } catch (error) {
    console.error("Error creating order:", error);
    throw error;
  }
}

export default async function PaymentSuccessPage({
  searchParams,
}: {
  searchParams: { session_id?: string };
}) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/login");
  }

  if (!searchParams.session_id) {
    redirect("/shop");
  }

  try {
    // Retrieve the checkout session
    const checkoutSession = await stripe.checkout.sessions.retrieve(
      searchParams.session_id,
      {
        expand: ['line_items', 'line_items.data.price.product'],
      }
    );

    if (checkoutSession.payment_status !== "paid") {
      throw new Error("Payment not completed");
    }

    // Create the order in our database
    const order = await createOrder(session, checkoutSession);

    return (
      <main className="container mx-auto px-4 py-16">
        <div className="max-w-2xl mx-auto text-center">
          <div className="mb-8 flex justify-center">
            <CheckCircle className="h-16 w-16 text-green-500" />
          </div>
          <h1 className="text-3xl font-bold mb-4">Thank You for Your Order!</h1>
          <p className="text-muted-foreground mb-4">
            Your payment has been processed successfully.
          </p>
          
          <div className="bg-muted/50 p-6 rounded-lg mb-8">
            <h2 className="text-xl font-semibold mb-2">Order Status</h2>
            <p className="text-lg font-medium mb-1">Order {formatOrderId(order.id)}</p>
            <p className="text-green-600 font-medium">Confirmed</p>
          </div>

          <div className="space-y-4 text-muted-foreground">
            <div>
              <h3 className="font-medium text-foreground">Order Confirmation</h3>
              <p>We'll send you a confirmation email with your order details and tracking information.</p>
            </div>
            
            <div>
              <h3 className="font-medium text-foreground">Estimated Delivery</h3>
              <p>Your order will be delivered within 3-5 business days.</p>
            </div>
          </div>

          <div className="mt-6 flex justify-center gap-4">
            <Button asChild variant="outline">
              <Link href="/orders">View Orders</Link>
            </Button>
            <Button asChild>
              <Link href="/shop">Continue Shopping</Link>
            </Button>
          </div>
        </div>
      </main>
    );
  } catch (error) {
    console.error("Error processing successful payment:", error);
    redirect("/shop");
  }
} 