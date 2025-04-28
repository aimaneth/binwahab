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

export default function CheckoutPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session, status } = useSession();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [orderProcessing, setOrderProcessing] = useState(false);
  const [cart, setCart] = useState<any>(null);
  
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
        
        // Check if cart is empty
        if (!cartData.items || cartData.items.length === 0) {
          toast({
            title: 'Empty Cart',
            description: 'Your cart is empty. Add some products before checkout.',
            variant: 'destructive'
          });
          router.push('/shop/cart');
          return;
        }
        
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
  
  // Handle payment completion
  const handlePaymentComplete = (paymentId: string) => {
    toast({
      title: 'Payment Successful',
      description: 'Your order has been placed successfully!',
      variant: 'default'
    });
    
    // Redirect to order confirmation page
    router.push(`/shop/checkout/success?payment_id=${paymentId}`);
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
  
  // Fallback message if we don't have the necessary parameters
  return (
    <div className="container max-w-md py-10">
      <Card>
        <CardHeader>
          <CardTitle>Payment Error</CardTitle>
          <CardDescription>
            Missing payment information. Please return to your cart and try again.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground mb-4">
            We couldn't process your payment because some required information was missing.
            Please go back to your shopping cart and try the checkout process again.
          </p>
        </CardContent>
        <CardFooter>
          <Button 
            className="w-full" 
            onClick={() => router.push('/shop/cart')}
          >
            Return to Cart
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
} 