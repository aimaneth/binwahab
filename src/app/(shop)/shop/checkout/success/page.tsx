'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { CheckCircle2, ArrowRight, Receipt, Home, ShoppingBag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';

export default function PaymentSuccessPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session, status } = useSession();
  const [orderId, setOrderId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  
  const paymentId = searchParams.get('payment_id');
  
  useEffect(() => {
    const fetchOrderDetails = async () => {
      if (status === 'loading') return;
      
      if (status === 'unauthenticated') {
        router.push('/login');
        return;
      }
      
      if (!paymentId) {
        // If no payment ID is found, redirect to home page after a delay
        setTimeout(() => {
          router.push('/');
        }, 5000);
        setLoading(false);
        return;
      }
      
      try {
        // Fetch order details if needed
        const response = await fetch(`/api/orders/by-payment?paymentId=${paymentId}`);
        
        if (response.ok) {
          const data = await response.json();
          setOrderId(data.orderId);
        }
      } catch (error) {
        console.error('Error fetching order details:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchOrderDetails();
  }, [paymentId, router, status]);
  
  return (
    <div className="container max-w-lg py-16">
      <Card className="text-center">
        <CardHeader>
          <div className="mx-auto w-fit mb-4">
            <CheckCircle2 className="h-16 w-16 text-green-500" />
          </div>
          <CardTitle className="text-2xl">Payment Successful!</CardTitle>
          <CardDescription>
            Thank you for your purchase
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {paymentId && (
            <div className="bg-muted p-4 rounded-lg text-left">
              <p className="text-sm text-muted-foreground mb-1">Payment Reference:</p>
              <p className="font-medium break-all">{paymentId}</p>
            </div>
          )}
          
          {orderId && (
            <div className="bg-muted p-4 rounded-lg text-left">
              <p className="text-sm text-muted-foreground mb-1">Order ID:</p>
              <p className="font-medium">{orderId}</p>
            </div>
          )}
          
          <p className="text-muted-foreground">
            We have sent a confirmation email with your order details.
            You can also check your order status in your account.
          </p>
        </CardContent>
        <CardFooter className="flex flex-col space-y-2">
          {orderId && (
            <Button asChild className="w-full">
              <Link href={`/account/orders/${orderId}`}>
                <Receipt className="mr-2 h-4 w-4" />
                View Order Details
              </Link>
            </Button>
          )}
          
          <Button asChild variant="outline" className="w-full">
            <Link href="/shop">
              <ShoppingBag className="mr-2 h-4 w-4" />
              Continue Shopping
            </Link>
          </Button>
          
          <Button asChild variant="ghost" className="w-full">
            <Link href="/">
              <Home className="mr-2 h-4 w-4" />
              Return to Home
            </Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
} 