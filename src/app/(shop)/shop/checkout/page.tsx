'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CurlecCheckout } from '@/components/shop/CurlecCheckout';
import { Loader, CreditCard, Info } from 'lucide-react';
import { CurlecPaymentButton } from '@/components/shop/curlec-payment-button';

export default function CheckoutPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session, status } = useSession();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [orderProcessing, setOrderProcessing] = useState(false);
  const [cart, setCart] = useState<any>(null);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('TNG_EWALLET');
  const [isPaying, setIsPaying] = useState(false);
  const paymentMethods = [
    { label: "TnG eWallet", value: "TNG_EWALLET" },
    { label: "GrabPay", value: "GRABPAY" },
    { label: "Boost", value: "BOOST" },
    { label: "FPX (Online Banking)", value: "FPX" },
    { label: "Credit Card", value: "CREDIT_CARD" },
  ];
  
  // Get parameters from URL
  const paymentMethod = searchParams.get('payment_method') || 'curlec';
  const orderId = searchParams.get('order_id');
  const amount = searchParams.get('amount') ? parseFloat(searchParams.get('amount')!) : 0;
  
  // If we have order_id and amount, and payment method is curlec, show the Curlec checkout
  const showCurlecCheckout = paymentMethod === 'curlec' && orderId && amount > 0;
  
  useEffect(() => {
    // Check if user is authenticated
    if (status === 'loading') return;
    
    if (status === 'unauthenticated') {
      toast({
        title: 'Please sign in',
        description: 'You need to be signed in to checkout',
        variant: 'destructive'
      });
      router.push('/login?callbackUrl=/shop/checkout');
      return;
    }
    
    // If we have Curlec payment info, we can skip loading the cart
    if (showCurlecCheckout) {
      setLoading(false);
      return;
    }
    
    // Otherwise, load cart data
    const getCart = async () => {
      try {
        const response = await fetch('/api/cart');
        
        if (!response.ok) {
          throw new Error('Failed to load cart');
        }
        
        const cartData = await response.json();
        
        setCart(cartData);
      } catch (error) {
        console.error('Error loading cart:', error);
        toast({
          title: 'Error',
          description: 'Failed to load your cart. Please try again.',
          variant: 'destructive'
        });
      } finally {
        setLoading(false);
      }
    };
    
    getCart();
  }, [router, status, toast, showCurlecCheckout]);
  
  // Only redirect to cart if cart is loaded and confirmed empty, and not paying
  useEffect(() => {
    if (!loading && cart && (!cart.items || cart.items.length === 0) && !isPaying) {
      toast({
        title: 'Empty Cart',
        description: 'Your cart is empty. Add some products before checkout.',
        variant: 'destructive'
      });
      router.push('/shop/cart');
    }
  }, [loading, cart, router, toast, isPaying]);
  
  // Handle payment completion
  const handlePaymentComplete = (paymentId: string) => {
    toast({
      title: 'Payment Successful',
      description: 'Your order has been placed successfully!',
      variant: 'default'
    });
    
    // Redirect to order confirmation page (shop/confirmation) with session_id
    router.push(`/shop/confirmation?session_id=${paymentId}`);
  };
  
  // Handle payment failure
  const handlePaymentFailure = (error: string) => {
    toast({
      title: 'Payment Failed',
      description: error || 'Your payment could not be processed. Please try again.',
      variant: 'destructive'
    });
    
    // Redirect back to cart
    router.push('/shop/cart');
  };
  
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }
  
  // Only render payment UI if cart is loaded and has items
  if (!cart || !cart.items || cart.items.length === 0) {
    return null;
  }
  
  // Render the Curlec checkout if we have the necessary parameters
  if (showCurlecCheckout) {
    return (
      <div className="container max-w-4xl py-10">
        <h1 className="text-3xl font-bold mb-6 text-center">Complete Your Payment</h1>
        <CurlecCheckout 
          orderId={orderId!}
          amount={amount}
          onPaymentComplete={handlePaymentComplete}
          onPaymentFailure={handlePaymentFailure}
        />
      </div>
    );
  }
  
  // Payment method selection UI
  return (
    <div className="container max-w-md py-10">
      <Card>
        <CardHeader>
          <CardTitle>Choose Payment Method</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <label className="block mb-2 font-medium">Select a payment method:</label>
            <div className="space-y-2">
              {paymentMethods.map((method) => (
                <label key={method.value} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="paymentMethod"
                    value={method.value}
                    checked={selectedPaymentMethod === method.value}
                    onChange={() => setSelectedPaymentMethod(method.value)}
                  />
                  {method.label}
                </label>
              ))}
            </div>
          </div>
        </CardContent>
        <CardFooter>
          <CurlecPaymentButton
            amount={cart?.total || 0}
            paymentMethod={selectedPaymentMethod}
            customerName={session?.user?.name || undefined}
            customerEmail={session?.user?.email || undefined}
            // Add other props as needed
            className="w-full"
            onStartPayment={() => setIsPaying(true)}
            onEndPayment={() => setIsPaying(false)}
          />
        </CardFooter>
      </Card>
    </div>
  );
} 