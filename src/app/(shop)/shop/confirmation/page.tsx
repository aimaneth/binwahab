"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Steps } from "@/components/ui/steps";
import { Button } from "@/components/ui/button";
import { CheckCircle2, XCircle } from "lucide-react";
import Link from "next/link";
import { useCart } from "@/hooks/use-cart";
import { useSession } from "next-auth/react";

export default function ConfirmationPage() {
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<"success" | "error" | "loading">("loading");
  const [message, setMessage] = useState("");
  const { clearClientAndServerCart } = useCart();
  const { data: session, status: sessionStatus } = useSession();

  // Get all possible payment identifiers
  const sessionId = searchParams.get("session_id");
  const orderId = searchParams.get("order_id");
  const paymentId = searchParams.get("payment_id");
  const statusParam = searchParams.get("status");
  const messageParam = searchParams.get("message");
  
  // Additional Curlec parameters
  const razorpay_payment_id = searchParams.get("razorpay_payment_id");
  const razorpay_order_id = searchParams.get("razorpay_order_id");
  const razorpay_signature = searchParams.get("razorpay_signature");

  useEffect(() => {
    const verifyPayment = async () => {
      // Clear cart immediately for better UX if success is indicated
      if (statusParam === "success") {
        await clearClientAndServerCart();
      }
      
      // Check if we have a status parameter directly from the URL
      // This would be the case for Curlec redirects that already went through verification
      if (statusParam) {
        if (statusParam === "success") {
          setStatus("success");
          setMessage(messageParam || "Your payment was successful and your order has been placed.");
          return;
        } else if (statusParam === "error") {
          setStatus("error");
          setMessage(messageParam || "There was an issue processing your payment.");
          return;
        }
      }
      
      // Handle Curlec direct callback with verification parameters
      if (razorpay_payment_id && razorpay_order_id && razorpay_signature) {
        try {
          // Need to verify on server since we have signature
          const verifyResponse = await fetch(`/api/curlec/verify-payment?razorpay_payment_id=${razorpay_payment_id}&razorpay_order_id=${razorpay_order_id}&razorpay_signature=${razorpay_signature}`);
          
          // A redirect response means verification succeeded and we should reload to get status
          if (verifyResponse.redirected) {
            window.location.href = verifyResponse.url;
            return;
          }
          
          // Otherwise, check for success in response
          const data = await verifyResponse.json().catch(() => ({ success: false }));
          
          if (data.success) {
            setStatus("success");
            setMessage("Your payment was successful and your order has been placed.");
            await clearClientAndServerCart();
          } else {
            setStatus("error");
            setMessage(data.error || "Payment verification failed");
          }
          return;
        } catch (error) {
          console.error("Error verifying Curlec payment:", error);
          setStatus("error");
          setMessage("Error verifying payment signature");
          return;
        }
      }
      
      // Handle case where we don't have proper payment identifiers
      if (!sessionId && !paymentId && !razorpay_payment_id) {
        setStatus("error");
        setMessage("No payment information found.");
        return;
      }

      // If we're not authenticated and this appears to be a Curlec payment (has payment_id)
      // we can show success based on URL parameters since the verification was done server-side
      if (sessionStatus === "unauthenticated" && (paymentId || razorpay_payment_id)) {
        setStatus("success");
        setMessage("Your payment was successfully processed! You may need to login to view your order details.");
        return;
      }

      try {
        let apiUrl;
        let isStripePayment = !!sessionId && sessionId.startsWith('cs_');
        
        // Determine which API to call based on payment identifiers
        if (isStripePayment) {
          // This is a Stripe payment
          apiUrl = `/api/checkout/verify?session_id=${sessionId}`;
        } else if (paymentId || sessionId) {
          // This is likely a Curlec payment - use the payment ID if available, otherwise the session ID
          const id = paymentId || sessionId;
          apiUrl = `/api/curlec/verify-direct?payment_id=${id}&order_id=${orderId || ''}`;
        } else {
          throw new Error("Unable to determine payment method");
        }

        const response = await fetch(apiUrl);
        const data = await response.json();

        if (data.success || data.paymentStatus === "paid" || data.status === "paid") {
          setStatus("success");
          setMessage("Your payment was successful and your order has been placed.");
          await clearClientAndServerCart();
        } else {
          setStatus("error");
          setMessage(data.error || data.message || "There was an issue processing your payment.");
        }
      } catch (error) {
        console.error("Verification error:", error);
        // If we have status=success in URL params, trust it even if verification fails
        if (statusParam === "success") {
          setStatus("success");
          setMessage("Your payment appears to have been processed successfully!");
          await clearClientAndServerCart();
        } else {
          setStatus("error");
          setMessage("Failed to verify payment status.");
        }
      }
    };

    verifyPayment();
  }, [searchParams, clearClientAndServerCart, sessionStatus, statusParam, messageParam, paymentId, razorpay_payment_id, razorpay_order_id, razorpay_signature]);

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
                {paymentId && (
                  <p className="text-sm text-gray-500 mt-2">Payment ID: {paymentId}</p>
                )}
                {orderId && (
                  <p className="text-sm text-gray-500 mt-2">Order ID: {orderId}</p>
                )}
                <p className="text-sm text-gray-500 mt-2">
                  {session ? "A confirmation email has been sent to your email address." : "Please log in to view your order details."}
                </p>
              </div>
              <div className="flex gap-4 mt-8">
                <Button asChild>
                  <Link href="/shop">Continue Shopping</Link>
                </Button>
                {session ? (
                  <Button asChild variant="outline">
                    <Link href="/orders">View Orders</Link>
                  </Button>
                ) : (
                  <Button asChild variant="outline">
                    <Link href="/login?callbackUrl=/orders">Login to View Orders</Link>
                  </Button>
                )}
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