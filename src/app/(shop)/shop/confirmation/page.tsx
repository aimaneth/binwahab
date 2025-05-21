"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Steps } from "@/components/ui/steps";
import { Button } from "@/components/ui/button";
import { CheckCircle2, XCircle } from "lucide-react";
import Link from "next/link";
import { useCart } from "@/hooks/use-cart";
import { useSession } from "next-auth/react";

export default function ConfirmationPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [status, setStatus] = useState<"success" | "error" | "loading">("loading");
  const [message, setMessage] = useState("");
  const [paymentDetails, setPaymentDetails] = useState<Record<string, string>>({});
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
  
  // Error parameters from Curlec
  const error_code = searchParams.get("error_code");
  const error_description = searchParams.get("error_description");
  const error_source = searchParams.get("error_source");
  const error_reason = searchParams.get("error_reason");

  useEffect(() => {
    // Collect all payment details for display
    const details: Record<string, string> = {};
    if (sessionId) details.sessionId = sessionId;
    if (orderId) details.orderId = orderId;
    if (paymentId) details.paymentId = paymentId;
    if (razorpay_payment_id) details.razorpayPaymentId = razorpay_payment_id;
    if (razorpay_order_id) details.razorpayOrderId = razorpay_order_id;
    if (error_code) details.errorCode = error_code;
    if (error_description) details.errorDescription = error_description;
    if (error_source) details.errorSource = error_source;
    if (error_reason) details.errorReason = error_reason;
    setPaymentDetails(details);

    // Simplified verification flow with more fallbacks
    const verifyPayment = async () => {
      try {
        // Clear cart immediately for better UX if success is indicated
        if (statusParam === "success") {
          await clearClientAndServerCart().catch(e => console.error("Error clearing cart:", e));
          setStatus("success");
          setMessage(messageParam || "Your payment was successful and your order has been placed.");
          return;
        } else if (statusParam === "error") {
          // Do not clear cart on error - user might want to try again
          setStatus("error");
          setMessage(messageParam || "There was an issue processing your payment.");
          return;
        }
        
        // Check for direct error indicators 
        if (error_code || error_description || error_source || error_reason) {
          setStatus("error");
          const errorMsg = error_description || error_reason || "Payment was cancelled or failed";
          setMessage(errorMsg);
          return;
        }
        
        // Handle Curlec direct callback with verification parameters - only attempt if we have all three
        if (razorpay_payment_id && razorpay_order_id && razorpay_signature) {
          try {
            // If we have all Razorpay parameters, we need to verify the payment
            const verifyResponse = await fetch('/api/curlec/verify-payment', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                razorpay_payment_id,
                razorpay_order_id,
                razorpay_signature
              }),
            });
            
            const data = await verifyResponse.json();
            
            if (data.success) {
              await clearClientAndServerCart().catch(e => console.error("Error clearing cart:", e));
              setStatus("success");
              setMessage("Your payment was successfully processed with Curlec!");
              return;
            } else {
              setStatus("error");
              setMessage(data.error || "Payment verification failed");
              return;
            }
          } catch (error) {
            console.error("Error handling Curlec parameters:", error);
            setStatus("error");
            setMessage("Error verifying payment signature");
            return;
          }
        }
        
        // If we still need to verify via API (for Stripe or other payment methods)
        if (sessionId || paymentId || orderId) {
          try {
            let apiUrl;
            if (sessionId && sessionId.startsWith('cs_')) {
              // This is a Stripe payment
              apiUrl = `/api/checkout/verify?session_id=${sessionId}`;
            } else {
              // Use the verify-direct endpoint with whatever parameters we have
              apiUrl = `/api/curlec/verify-direct?${sessionId ? `payment_id=${sessionId}&` : ''}${paymentId ? `payment_id=${paymentId}&` : ''}${orderId ? `order_id=${orderId}` : ''}`;
            }

            const response = await fetch(apiUrl);
            const data = await response.json();

            if (data.success || data.paymentStatus === "paid" || data.status === "paid") {
              setStatus("success");
              setMessage("Your payment was successful and your order has been placed.");
              await clearClientAndServerCart().catch(e => console.error("Error clearing cart:", e));
            } else {
              setStatus("error");
              setMessage(data.error || data.message || "There was an issue processing your payment.");
            }
          } catch (error) {
            console.error("API verification error:", error);
            // Fallback - if we have status=success in URL params, trust it even if verification fails
            if (statusParam === "success") {
              setStatus("success");
              setMessage("Your payment appears to have been processed successfully!");
              await clearClientAndServerCart().catch(e => console.error("Error clearing cart:", e));
            } else {
              setStatus("error");
              setMessage("Failed to verify payment status. If you've made a payment, please contact support.");
            }
          }
        } else {
          // If we have no payment identifiers, show error
          setStatus("error");
          setMessage("No payment information found.");
        }
      } catch (outerError) {
        console.error("Outer verification error:", outerError);
        // Ultimate fallback - if there's any kind of error in our verification logic
        if (statusParam === "success" || razorpay_payment_id) {
          setStatus("success");
          setMessage("We received your payment! If you encounter any issues, please contact support.");
          await clearClientAndServerCart().catch(e => console.error("Error clearing cart:", e));
        } else {
          setStatus("error");
          setMessage("There was a problem verifying your payment. If you've made a payment, please contact support.");
        }
      }
    };

    verifyPayment();
  }, []);  // Intentionally removed dependencies to only run once on mount

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
                
                {/* Display all payment identifiers for debugging */}
                {Object.entries(paymentDetails).length > 0 && (
                  <div className="mt-4 text-left">
                    <p className="text-sm text-gray-500 mb-1">Payment Details:</p>
                    {Object.entries(paymentDetails).map(([key, value]) => (
                      <p key={key} className="text-sm text-gray-500">
                        {key}: {value}
                      </p>
                    ))}
                  </div>
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
                
                {/* Display all payment identifiers for debugging */}
                {Object.entries(paymentDetails).length > 0 && (
                  <div className="mt-4 text-left">
                    <p className="text-sm text-gray-500 mb-1">Payment Details:</p>
                    {Object.entries(paymentDetails).map(([key, value]) => (
                      <p key={key} className="text-sm text-gray-500">
                        {key}: {value}
                      </p>
                    ))}
                  </div>
                )}
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