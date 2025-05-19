"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { formatPrice } from "@/lib/utils";
import { Clock, CreditCard, Loader2, Shield, Truck } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { ShippingAddressForm } from "./shipping-address-form";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { useSession } from "next-auth/react";
import { CurlecCheckout } from "./CurlecCheckout";
import { useCart } from "@/hooks/use-cart";

interface Address {
  id: string;
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  phone: string;
  isDefault: boolean;
}

export function CartSummary({ shippingState = "Selangor" }: { shippingState?: string }) {
  const router = useRouter();
  const { data: session } = useSession();
  const [shipping, setShipping] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [estimatedDelivery, setEstimatedDelivery] = useState<string>("");
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string>();
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [curlecOrder, setCurlecOrder] = useState<{ id: string; amount: number } | null>(null);
  const [showPayment, setShowPayment] = useState(false);
  const [paymentComplete, setPaymentComplete] = useState(false);
  const [paymentId, setPaymentId] = useState<string | null>(null);
  const { items } = useCart();

  useEffect(() => {
    // Fetch user's addresses
    const fetchAddresses = async () => {
      try {
        const response = await fetch('/api/addresses');
        if (!response.ok) throw new Error('Failed to fetch addresses');
        const data = await response.json();
        setAddresses(data);
        // Set the default address if available
        const defaultAddress = data.find((addr: Address) => addr.isDefault);
        if (defaultAddress) {
          setSelectedAddressId(defaultAddress.id);
        }
      } catch (error) {
        console.error('Error fetching addresses:', error);
      }
    };

    fetchAddresses();
  }, []);

  useEffect(() => {
    const calculateShipping = async () => {
      setIsLoading(true);
      try {
        const subtotal = items.reduce(
          (sum, item) => {
            const price = item.variant?.price ?? item.product.price;
            return sum + (Number(price) * item.quantity);
          },
          0
        );
        
        const response = await fetch('/api/shipping/calculate', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            state: shippingState,
            orderValue: subtotal,
            orderWeight: 0,
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to calculate shipping');
        }

        const { cost } = await response.json();
        setShipping(cost);

        const today = new Date();
        const minDelivery = new Date(today);
        minDelivery.setDate(today.getDate() + 3);
        const maxDelivery = new Date(today);
        maxDelivery.setDate(today.getDate() + 5);
        
        const formatDate = (date: Date) => {
          return date.toLocaleDateString('en-MY', { 
            month: 'short', 
            day: 'numeric'
          });
        };

        setEstimatedDelivery(`${formatDate(minDelivery)} - ${formatDate(maxDelivery)}`);
      } catch (error) {
        console.error("Failed to calculate shipping:", error);
        setShipping(0);
      } finally {
        setIsLoading(false);
      }
    };

    calculateShipping();
  }, [items, shippingState]);

  const handleAddressSubmit = async (data: any) => {
    try {
      const response = await fetch('/api/addresses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error('Failed to save address');
      }

      const newAddress = await response.json();
      setAddresses(prev => [...prev, newAddress]);
      setSelectedAddressId(newAddress.id);
      setShowAddressForm(false);
      toast.success('Address saved successfully');
    } catch (error) {
      toast.error('Failed to save address');
    }
  };

  const handleCheckout = async () => {
    if (!selectedAddressId) {
      toast.error('Please select a shipping address');
      return;
    }

    try {
      setIsProcessing(true);

      const checkoutItems = items.map(item => ({
        id: item.product.id,
        name: item.variant?.name || item.product.name,
        description: `${item.product.name}${item.variant ? ` - ${item.variant.name}` : ''}`,
        price: Number(item.variant?.price || item.product.price),
        quantity: item.quantity,
        images: item.product.images ? item.product.images : [],
        variantId: item.variant?.sku
      }));

      // Create an order in our database first
      const orderResponse = await fetch('/api/checkout/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          items: checkoutItems,
          shippingAddressId: selectedAddressId,
          paymentMethod: 'curlec'
        })
      });

      if (!orderResponse.ok) {
        const errorData = await orderResponse.json();
        throw new Error(errorData.error || 'Failed to create order');
      }

      const orderData = await orderResponse.json();

      // Create a Curlec order
      const curlecResponse = await fetch('/api/curlec/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: total,
          orderId: orderData.id,
          shippingAddressId: selectedAddressId
        })
      });

      if (!curlecResponse.ok) {
        const errorData = await curlecResponse.json();
        throw new Error(errorData.error || 'Failed to create payment');
      }

      const curlecData = await curlecResponse.json();
      setCurlecOrder({
        id: curlecData.id,
        amount: total
      });
      setShowPayment(true);
      setIsProcessing(false);
      
    } catch (err) {
      console.error("Checkout error:", err);
      setIsProcessing(false);
      toast.error('Failed to proceed to checkout');
    }
  };

  const handlePaymentComplete = (paymentId: string) => {
    setPaymentId(paymentId);
    setPaymentComplete(true);
    // Redirect to order success page
    router.push(`/shop/checkout/success?payment_id=${paymentId}`);
  };

  const handlePaymentFailure = (error: string) => {
    toast.error(`Payment failed: ${error}`);
    setShowPayment(false);
    setCurlecOrder(null);
  };

  if (items.length === 0) {
    return null;
  }

  const subtotal = items.reduce(
    (sum, item) => {
      const price = item.variant?.price ?? item.product.price;
      return sum + (Number(price) * item.quantity);
    },
    0
  );
  const tax = subtotal * 0.06; // 6% GST
  const total = subtotal + tax + shipping;

  // If we're showing the payment interface
  if (showPayment && curlecOrder) {
    return (
      <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
        <div className="p-6 space-y-4">
          <h2 className="text-lg font-semibold">Complete Your Payment</h2>
          
          <div className="space-y-2">
            <div className="flex justify-between text-sm font-semibold">
              <span>Total Amount</span>
              <span>{formatPrice(total)}</span>
            </div>
          </div>
          
          <CurlecCheckout 
            orderId={curlecOrder.id}
            amount={curlecOrder.amount}
            onPaymentComplete={handlePaymentComplete}
            onPaymentFailure={handlePaymentFailure}
          />
          
          <Button
            variant="outline"
            className="w-full mt-4"
            onClick={() => {
              setShowPayment(false);
              setCurlecOrder(null);
            }}
          >
            Cancel Payment
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
      <div className="p-6 space-y-4">
        <h2 className="text-lg font-semibold">Order Summary</h2>
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Subtotal</span>
            <span>{formatPrice(subtotal)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span>Tax (6% SST)</span>
            <span>{formatPrice(tax)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span>Shipping</span>
            <span>{isLoading ? "Calculating..." : formatPrice(shipping)}</span>
          </div>
          <Separator className="my-2" />
          <div className="flex justify-between text-sm font-semibold">
            <span>Total</span>
            <span>{formatPrice(total)}</span>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Truck className="h-4 w-4" />
            <span>Estimated delivery: {estimatedDelivery}</span>
            <Image
              src="/courier-logos/jnt.png"
              alt="J&T Express"
              width={40}
              height={20}
              className="ml-auto"
            />
          </div>
        </div>

        {/* Payment Information */}
        <div className="space-y-2">
          <h3 className="font-medium">Payment Provider</h3>
          <div className="flex items-center gap-3 rounded-md border p-3 bg-muted/50">
            <Image
              src="/payment-logos/curlec.svg"
              alt="Curlec"
              width={70}
              height={30}
              className="h-8 w-auto"
            />
            <div>
              <p className="text-sm text-muted-foreground">Secure direct payment with Malaysian banks</p>
            </div>
          </div>
        </div>

        {/* Shipping Address Section */}
        <div className="space-y-4">
          <h3 className="font-medium">Shipping Address</h3>
          {addresses.length > 0 ? (
            <div className="space-y-4">
              <select
                className="w-full p-2 border rounded-md"
                value={selectedAddressId}
                onChange={(e) => setSelectedAddressId(e.target.value)}
              >
                <option value="">Select an address</option>
                {addresses.map((address) => (
                  <option key={address.id} value={address.id}>
                    {address.street}, {address.city}, {address.state} {address.zipCode}
                  </option>
                ))}
              </select>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => setShowAddressForm(true)}
              >
                Add New Address
              </Button>
            </div>
          ) : (
            <Button
              variant="outline"
              className="w-full"
              onClick={() => setShowAddressForm(true)}
            >
              Add Shipping Address
            </Button>
          )}
        </div>

        <Dialog open={showAddressForm} onOpenChange={setShowAddressForm}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Add Shipping Address</DialogTitle>
            </DialogHeader>
            <ShippingAddressForm
              onSubmit={handleAddressSubmit}
              isLoading={isProcessing}
            />
          </DialogContent>
        </Dialog>

        <div className="space-y-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Shield className="h-4 w-4" />
            <span>Protected by buyer guarantee</span>
          </div>
          <Button
            className="w-full"
            size="lg"
            onClick={handleCheckout}
            disabled={isLoading || isProcessing || !selectedAddressId}
          >
            {isProcessing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Calculating...
              </>
            ) : (
              "Proceed with payment"
            )}
          </Button>
        </div>
      </div>
    </div>
  );
} 