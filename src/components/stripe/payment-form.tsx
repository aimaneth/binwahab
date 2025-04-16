import { useState } from "react";
import { useStripe, useElements, PaymentElement, Elements } from "@stripe/react-stripe-js";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { formatPrice } from "@/lib/utils";
import { appearance, PaymentFormProps } from "@/lib/stripe/config";
import { getStripe } from "@/lib/stripe/config";
import { Alert, AlertDescription } from "@/components/ui/alert";

// Inner component that handles the actual payment form
function CheckoutForm({ amount, returnUrl, user }: Omit<PaymentFormProps, 'clientSecret'>) {
  const stripe = useStripe();
  const elements = useElements();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      setError("Payment system is not ready yet. Please try again.");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const { error: submitError, paymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: returnUrl,
          payment_method_data: {
            billing_details: {
              name: user?.name || undefined,
              email: user?.email || undefined,
            },
          },
        },
        redirect: 'if_required',
      });

      if (submitError) {
        setError(submitError.message || "An error occurred during payment.");
        return;
      }

      if (paymentIntent?.status === 'succeeded') {
        router.push(returnUrl);
      }
    } catch (error) {
      console.error('Payment error:', error);
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  if (!stripe || !elements) {
    return (
      <div className="flex items-center justify-center p-6">
        <Loader2 className="h-6 w-6 animate-spin" />
        <span className="ml-2">Loading payment form...</span>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <PaymentElement
        options={{
          layout: 'tabs',
          defaultValues: {
            billingDetails: {
              name: user?.name || undefined,
              email: user?.email || undefined,
            },
          },
        }}
        className="w-full"
      />
      
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Button
        type="submit"
        disabled={isLoading}
        className="w-full"
      >
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Processing...
          </>
        ) : (
          `Pay ${formatPrice(amount)}`
        )}
      </Button>
    </form>
  );
}

// Wrapper component that provides Stripe Elements context
export function PaymentForm({ clientSecret, amount, returnUrl, user }: PaymentFormProps) {
  const [isReady, setIsReady] = useState(false);

  return (
    <div className="w-full max-w-xl mx-auto space-y-8">
      {!clientSecret ? (
        <div className="flex items-center justify-center p-8">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      ) : (
        <Elements 
          stripe={getStripe()} 
          options={{
            clientSecret,
            appearance,
            loader: 'auto',
          }}
        >
          <div className="bg-white rounded-lg shadow-sm p-6">
            <CheckoutForm 
              amount={amount} 
              returnUrl={returnUrl}
              user={user} 
            />
          </div>
        </Elements>
      )}
    </div>
  );
} 