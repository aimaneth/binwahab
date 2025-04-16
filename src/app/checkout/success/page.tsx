"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function CheckoutSuccessPage() {
  const [status, setStatus] = useState<string>("loading");
  const [orderId, setOrderId] = useState<string | null>(null);
  const searchParams = useSearchParams();
  const session_id = searchParams.get("session_id");

  useEffect(() => {
    const verifyPayment = async () => {
      if (!session_id) {
        setStatus("error");
        return;
      }

      try {
        const response = await fetch(`/api/checkout/verify?session_id=${session_id}`);
        const data = await response.json();
        
        if (response.ok && data.orderId) {
          setStatus(data.status);
          setOrderId(data.orderId);
        } else {
          setStatus("error");
        }
      } catch (error) {
        console.error("Payment verification error:", error);
        setStatus("error");
      }
    };

    verifyPayment();
  }, [session_id]);

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
            We couldn't verify your payment. Please contact support if you believe this is an error.
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
    <div className="max-w-2xl mx-auto p-6">
      <Alert>
        <AlertDescription>
          Thank you for your purchase! We'll send you an email confirmation shortly.
        </AlertDescription>
      </Alert>
      <div className="mt-6 flex justify-center gap-4">
        {orderId && (
          <Button asChild variant="outline">
            <Link href="/orders">View Orders</Link>
          </Button>
        )}
        <Button asChild>
          <Link href="/shop">Continue Shopping</Link>
        </Button>
      </div>
    </div>
  );
} 