"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { CheckCircle, Package, Mail, Clock } from "lucide-react";
import { formatPrice } from "@/lib/utils";

interface OrderDetails {
  orderId: string;
  status: string;
  total: number;
  items: Array<{
    name: string;
    quantity: number;
    price: number;
  }>;
}

export default function CheckoutSuccessPage() {
  const [status, setStatus] = useState<string>("loading");
  const [orderDetails, setOrderDetails] = useState<OrderDetails | null>(null);
  const [error, setError] = useState<string | null>(null);
  const searchParams = useSearchParams();
  const session_id = searchParams.get("session_id");
  const payment_id = searchParams.get("payment_id");
  const order_id = searchParams.get("order_id");

  useEffect(() => {
    const verifyPayment = async () => {
      try {
        let response;
        let data;

        // Different verification paths for Stripe vs Curlec payments
        if (session_id) {
          // Stripe payment verification
          response = await fetch(`/api/checkout/verify?session_id=${session_id}`);
          data = await response.json();
          
          if (response.ok && data.orderId) {
            setStatus(data.status);
            setOrderDetails(data);
          } else {
            throw new Error(data.error || 'Failed to verify Stripe payment');
          }
        } else if (order_id) {
          // Try to get order details directly
          console.log('Fetching order details for:', order_id);
          response = await fetch(`/api/orders/${order_id}`);
          data = await response.json();
          
          if (response.ok && data.id) {
            console.log('Order details:', data);
            setStatus(data.paymentStatus === 'PAID' ? 'complete' : data.status);
            setOrderDetails({
              orderId: data.id,
              status: data.paymentStatus === 'PAID' ? 'complete' : data.status,
              total: data.total || 0,
              items: data.items || []
            });
          } else {
            throw new Error(data.error || 'Failed to fetch order details');
          }
        } else {
          throw new Error('No payment or order information provided');
        }
      } catch (error) {
        console.error("Payment verification error:", error);
        setStatus("error");
        setError(error instanceof Error ? error.message : 'An unknown error occurred');
      }
    };

    verifyPayment();
  }, [session_id, payment_id, order_id]);

  if (status === "loading") {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (status === "error" || status === "unpaid") {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <Alert variant="destructive">
          <AlertDescription>
            {error || "We couldn't verify your payment. Please contact support if you believe this is an error."}
          </AlertDescription>
        </Alert>
        <div className="mt-6 text-center">
          <Button asChild>
            <Link href="/shop">Return to Shop</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-card rounded-lg shadow-lg p-8">
        {/* Header Section */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="h-16 w-16 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
          </div>
          <h1 className="text-3xl font-bold mb-2">Thank You for Your Order!</h1>
          <p className="text-muted-foreground text-lg">
            Your payment has been processed successfully.
          </p>
        </div>

        {/* Order Information */}
        <div className="grid gap-6 mb-8">
          <div className="border rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Package className="h-5 w-5 text-muted-foreground" />
              <h2 className="font-semibold">Order Status</h2>
            </div>
            <div className="pl-7">
              <p className="text-sm text-muted-foreground">Order #{orderDetails?.orderId}</p>
              <p className="text-sm font-medium text-green-500 mt-1">
                {orderDetails?.status === "PROCESSING" ? "Processing" : "Confirmed"}
              </p>
            </div>
          </div>

          <div className="border rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Mail className="h-5 w-5 text-muted-foreground" />
              <h2 className="font-semibold">Order Confirmation</h2>
            </div>
            <p className="pl-7 text-sm text-muted-foreground">
              We'll send you a confirmation email with your order details and tracking information.
            </p>
          </div>

          <div className="border rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="h-5 w-5 text-muted-foreground" />
              <h2 className="font-semibold">Estimated Delivery</h2>
            </div>
            <p className="pl-7 text-sm text-muted-foreground">
              Your order will be delivered within 3-5 business days.
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-center gap-4">
          <Button asChild variant="outline">
            <Link href="/orders">View Orders</Link>
          </Button>
          <Button asChild>
            <Link href="/shop">Continue Shopping</Link>
          </Button>
        </div>
      </div>
    </div>
  );
} 