"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Steps } from "@/components/ui/steps";
import { Button } from "@/components/ui/button";
import { CheckCircle2, XCircle } from "lucide-react";
import Link from "next/link";
import { useCart } from "@/hooks/use-cart";

export default function ConfirmationPage() {
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<"success" | "error" | "loading">("loading");
  const [message, setMessage] = useState("");
  const { clearClientAndServerCart } = useCart();

  const sessionId = searchParams.get("session_id");
  const orderId = searchParams.get("order_id");

  useEffect(() => {
    const verifyPayment = async () => {
      const sessionId = searchParams.get("session_id");
      
      if (!sessionId) {
        setStatus("error");
        setMessage("No session information found.");
        return;
      }

      try {
        const response = await fetch(`/api/checkout/verify?session_id=${sessionId}`);
        const data = await response.json();

        if (data.paymentStatus === "paid" || data.paymentStatus === "success") {
          setStatus("success");
          setMessage("Your payment was successful and your order has been placed.");
          clearClientAndServerCart();
        } else if (data.paymentStatus === "failed") {
          setStatus("error");
          setMessage(data.error || "There was an issue processing your payment.");
        }
      } catch (error) {
        console.error("Verification error:", error);
        // If we get an error after cart is cleared, but payment was successful
        if (error instanceof Error && error.message.includes("cart")) {
          setStatus("success");
          setMessage("Your payment has been processed successfully!");
        } else {
          setStatus("error");
          setMessage("Failed to verify payment status.");
        }
      }
    };

    verifyPayment();
  }, [searchParams, clearClientAndServerCart]);

  const steps = [
    { title: "Shopping Cart", href: "/shop/cart", status: "complete" as const },
    { title: "Checkout & Payment", href: "#", status: "complete" as const },
    { title: "Order Confirmation", href: "#", status: "current" as const },
  ];

  return (
    <main className="container mx-auto px-4 py-8">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Order Confirmation</h1>

        {/* Progress Steps */}
        <div className="mb-12">
          <Steps steps={steps} />
        </div>

        <div className="text-center py-12">
          {status === "loading" ? (
            <div className="flex flex-col items-center space-y-4">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
              <p className="text-lg">Verifying your payment...</p>
            </div>
          ) : status === "success" ? (
            <div className="flex flex-col items-center space-y-6">
              <CheckCircle2 className="h-16 w-16 text-green-500" />
              <div className="space-y-2">
                <h2 className="text-2xl font-semibold text-green-500">Payment Successful!</h2>
                <p className="text-gray-600">{message}</p>
                {sessionId && (
                  <p className="text-sm text-gray-500 mt-2">Session ID: {sessionId}</p>
                )}
                {orderId && (
                  <p className="text-sm text-gray-500 mt-2">Order ID: {orderId}</p>
                )}
                <p className="text-sm text-gray-500 mt-2">
                  A confirmation email has been sent to your email address.
                </p>
              </div>
              <div className="flex gap-4 mt-8">
                <Button asChild>
                  <Link href="/shop">Continue Shopping</Link>
                </Button>
                <Button asChild variant="outline">
                  <Link href="/orders">View Orders</Link>
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center space-y-6">
              <XCircle className="h-16 w-16 text-red-500" />
              <div className="space-y-2">
                <h2 className="text-2xl font-semibold text-red-500">Payment Failed</h2>
                <p className="text-gray-600">{message}</p>
              </div>
              <div className="flex gap-4 mt-8">
                <Button asChild>
                  <Link href="/shop/cart">Return to Cart</Link>
                </Button>
                <Button asChild variant="outline">
                  <Link href="/shop">Continue Shopping</Link>
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  );
} 