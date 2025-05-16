import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import { useCart } from '@/hooks/use-cart';

interface CurlecCheckoutProps {
  orderId: string;
  amount: number;
  onPaymentComplete?: (paymentId: string) => void;
  onPaymentFailure?: (error: string) => void;
}

declare global {
  interface Window {
    Razorpay: any;
  }
}

export function CurlecCheckout({ orderId, amount, onPaymentComplete, onPaymentFailure }: CurlecCheckoutProps) {
  const { data: session } = useSession();
  const { clearCart } = useCart();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [razorpayKey, setRazorpayKey] = useState<string | null>(null);
  const [debugInfo, setDebugInfo] = useState<string[]>([]);

  // Add a debug log function - only log critical errors
  const logDebug = (message: string) => {
    // Only log to console in development mode
    if (process.env.NODE_ENV === 'development') {
      console.log(`[CurlecCheckout] ${message}`);
    }
    
    // Only add critical errors to the debug info state (avoid verbose logging)
    if (message.includes('error') || message.includes('failed') || message.includes('Retry')) {
      setDebugInfo(prev => [...prev, message]);
    }
  };

  // Fetch the key from the server instead of relying on NEXT_PUBLIC_ env variable
  useEffect(() => {
    const fetchKey = async () => {
      try {
        const response = await fetch('/api/curlec/get-key');
        if (response.ok) {
          const data = await response.json();
          setRazorpayKey(data.key);
        } else {
          throw new Error(`Failed to load payment gateway key: ${response.status}`);
        }
      } catch (error) {
        console.error('Error fetching Razorpay key:', error);
        logDebug(`Key fetch error: ${error instanceof Error ? error.message : String(error)}`);
        setError('Failed to initialize payment gateway. Please try again later.');
      }
    };

    fetchKey();
  }, []);

  // A more resilient retry approach when Razorpay fails
  const useIframeRedirect = () => {
    logDebug('Payment failed to initialize, attempting retry...');
    
    // Add a short delay and try again with native integration
    setTimeout(() => {
      try {
        // Create script element
        const script = document.createElement('script');
        script.src = 'https://checkout.razorpay.com/v1/checkout.js';
        script.async = true;
        script.onload = () => {
          // Try to initialize Razorpay again after a short delay
          setTimeout(() => {
            try {
              handlePayment();
            } catch (err) {
              logDebug('Retry failed: ' + (err instanceof Error ? err.message : String(err)));
              setLoading(false);
              setError('Payment gateway could not be initialized. Please try again later.');
            }
          }, 1000);
        };
        script.onerror = () => {
          logDebug('Script loading failed on retry');
          setLoading(false);
          setError('Payment gateway could not be loaded. Please try again later.');
        };
        
        // Remove any existing scripts first
        const existingScript = document.querySelector('script[src="https://checkout.razorpay.com/v1/checkout.js"]');
        if (existingScript) {
          document.body.removeChild(existingScript);
        }
        
        // Append the new script
        document.body.appendChild(script);
      } catch (err) {
        logDebug('Retry attempt failed: ' + (err instanceof Error ? err.message : String(err)));
        setLoading(false);
        setError('Payment gateway could not be loaded. Please refresh the page and try again.');
      }
    }, 1500);
  };

  const handlePayment = async () => {
    if (!orderId || !amount) {
      setError('Missing order details. Please try again.');
      return;
    }

    if (!session?.user) {
      setError('Please log in to proceed with payment');
      return;
    }

    if (!razorpayKey) {
      setError('Payment gateway not properly configured');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Verify the URL protocol for localhost
      const host = window.location.host;
      const protocol = host.includes('localhost') ? 'http' : 'https';
      const baseUrl = `${protocol}://${host}`;

      // Dynamically load Razorpay
      if (!window.Razorpay) {
        // Create a promise to wait for the script to load
        const loadRazorpayScript = new Promise((resolve, reject) => {
          // Create script element
          const script = document.createElement('script');
          script.src = 'https://checkout.razorpay.com/v1/checkout.js';
          script.async = true;
          
          // Set up onload and onerror handlers
          script.onload = () => {
            resolve(true);
          };
          script.onerror = () => {
            logDebug('Script loading failed');
            reject(new Error('Failed to load payment gateway'));
          };
          
          // Append the script to the document body
          document.body.appendChild(script);
        });
        
        try {
          // Wait for the script to load
          await loadRazorpayScript;
        } catch (error) {
          logDebug(`Script load error: ${error instanceof Error ? error.message : String(error)}`);
          // Fall back to iframe immediately if script fails to load
          useIframeRedirect();
          return;
        }
      }

      // Wait a moment to ensure Razorpay is fully initialized
      setTimeout(() => {
        try {
          if (!window.Razorpay) {
            logDebug('Razorpay not available in window after loading');
            // Try fallback approach
            useIframeRedirect();
            return;
          }

          // Following exactly the Curlec docs format for options
          const options = {
            key: razorpayKey,
            amount: (amount * 100).toString(), // Amount in sen
            currency: 'MYR',
            name: 'BINWAHAB Shop', // Business name
            description: 'Payment for your order',
            image: 'https://binwahab.com/images/logo.png',
            order_id: orderId, // Order ID from the API
            // Remove callback_url and use handler instead since Razorpay's redirect isn't working properly
            handler: function(response: any) {
              // Log the response for debugging
              console.log('Payment success:', response);
              
              // Verify the payment on our server
              fetch('/api/curlec/verify-payment', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  razorpay_payment_id: response.razorpay_payment_id,
                  razorpay_order_id: response.razorpay_order_id,
                  razorpay_signature: response.razorpay_signature,
                }),
              })
              .then(res => res.json())
              .then(async (data) => {
                if (data.success) {
                  try {
                    // Clear the cart immediately on successful payment
                    await clearCart();
                    // Redirect to success page
                    window.location.href = `/shop/checkout/success?payment_id=${response.razorpay_payment_id}&order_id=${data.orderId}`;
                  } catch (error) {
                    console.error('Error clearing cart:', error);
                    // Still redirect to success page even if cart clearing fails
                    window.location.href = `/shop/checkout/success?payment_id=${response.razorpay_payment_id}&order_id=${data.orderId}`;
                  }
                } else {
                  throw new Error(data.error || 'Payment verification failed');
                }
              })
              .catch(error => {
                console.error('Payment verification error:', error);
                if (onPaymentFailure) {
                  onPaymentFailure(error.message || 'Payment verification failed');
                }
                setError('Payment verification failed. Please contact support.');
                setLoading(false);
              });
            },
            modal: {
              ondismiss: function() {
                setLoading(false);
                // Redirect to cancel page on modal dismiss
                window.location.href = '/shop/checkout/cancel';
              },
              escape: true,
              animation: true
            },
            prefill: {
              name: session.user.name || undefined,
              email: session.user.email || undefined,
              contact: '' // Would need to get from user profile if available
            },
            notes: {
              address: 'Customer Address',
              order_id: orderId // Store the order ID in notes for verification
            },
            theme: {
              color: '#6366F1'
            }
          };

          const rzp = new window.Razorpay(options);

          rzp.on('payment.success', function(response: any) {
            if (onPaymentComplete) {
              onPaymentComplete(response.razorpay_payment_id);
            }
            setLoading(false);
          });

          rzp.on('payment.error', function(response: any) {
            logDebug(`Payment failed: ${JSON.stringify(response)}`);
            if (onPaymentFailure) {
              onPaymentFailure(response.error?.description || 'Payment failed');
            }
            setError('Payment failed. Please try again.');
            setLoading(false);
          });

          try {
            rzp.open();
            
            // Additional check - if after 3 seconds the page is still here, 
            // the checkout might have failed silently or been blocked
            setTimeout(() => {
              if (document.body.contains(document.getElementById('rzp-button1'))) {
                logDebug('Razorpay checkout failed to open, trying retry');
                useIframeRedirect();
              }
            }, 3000);
          } catch (openError) {
            logDebug(`Error opening Razorpay: ${openError instanceof Error ? openError.message : String(openError)}`);
            // If opening fails, try fallback
            useIframeRedirect();
          }
        } catch (err) {
          logDebug(`Error initializing payment: ${err instanceof Error ? err.message : String(err)}`);
          setLoading(false);
          setError(err instanceof Error ? err.message : 'An unknown error occurred');
          // Try fallback as a last resort
          useIframeRedirect();
        }
      }, 1000); // Increase timeout to 1 second for more reliable initialization
    } catch (err) {
      logDebug(`Error during checkout: ${err instanceof Error ? err.message : String(err)}`);
      console.error('Error initializing payment:', err);
      setError(err instanceof Error ? err.message : 'An error occurred initializing payment');
      setLoading(false);
      // Try fallback as a last resort
      useIframeRedirect();

      toast({
        title: "Payment Error",
        description: "There was an error initializing the payment gateway. Please try again.",
        variant: "destructive"
      });
    }
  };

  useEffect(() => {
    // Clean up script on component unmount
    return () => {
      const script = document.querySelector('script[src="https://checkout.razorpay.com/v1/checkout.js"]');
      if (script) {
        document.body.removeChild(script);
      }
    };
  }, []);

  if (error) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader>
          <CardTitle className="text-destructive">Payment Error</CardTitle>
        </CardHeader>
        <CardContent>
          <p>{error}</p>
          {debugInfo.length > 0 && process.env.NODE_ENV === 'development' && (
            <div className="mt-4 p-2 bg-muted overflow-auto max-h-40 text-xs">
              {debugInfo.map((message, index) => (
                <p key={index}>{message}</p>
              ))}
            </div>
          )}
        </CardContent>
        <CardFooter className="flex justify-end">
          <Button onClick={() => setError(null)}>Try Again</Button>
        </CardFooter>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Complete Your Payment</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="mb-4">Amount to pay: RM {amount.toFixed(2)}</p>
        <p className="text-sm text-muted-foreground mb-4">
          You will be redirected to the Curlec payment gateway to complete your payment securely.
        </p>
        {debugInfo.length > 0 && process.env.NODE_ENV === 'development' && (
          <div className="mt-4 p-2 bg-muted overflow-auto max-h-40 text-xs">
            {debugInfo.map((message, index) => (
              <p key={index}>{message}</p>
            ))}
          </div>
        )}
      </CardContent>
      <CardFooter className="flex justify-end">
        <Button
          onClick={handlePayment}
          disabled={loading || !razorpayKey}
          className="w-full"
        >
          {loading ? (
            <>
              <Loader className="mr-2 h-4 w-4 animate-spin" />
              Processing...
            </>
          ) : !razorpayKey ? (
            <>
              <Loader className="mr-2 h-4 w-4 animate-spin" />
              Initializing...
            </>
          ) : (
            'Pay Now'
          )}
        </Button>
      </CardFooter>
    </Card>
  );
} 