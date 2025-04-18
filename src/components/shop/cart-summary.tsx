"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { formatPrice } from "@/lib/utils";
import { CartItem, Product, ProductVariant } from "@prisma/client";
import { Clock, CreditCard, Loader2, Shield, Truck } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { ShippingAddressForm } from "./shipping-address-form";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";

interface CartSummaryProps {
  items: (CartItem & {
    product: Omit<Product, 'price'> & { price: number };
    variant?: (Omit<ProductVariant, 'price'> & { price: number }) | null;
  })[];
  shippingState?: string;
}

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

export function CartSummary({ items, shippingState = "Selangor" }: CartSummaryProps) {
  const [shipping, setShipping] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [estimatedDelivery, setEstimatedDelivery] = useState<string>("");
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string>();
  const [showAddressForm, setShowAddressForm] = useState(false);

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
        name: item.variant?.name || item.product.name,
        description: `${item.product.name}${item.variant ? ` - ${item.variant.name}` : ''}`,
        price: Number(item.variant?.price || item.product.price),
        quantity: item.quantity,
        images: item.product.image ? [item.product.image] : []
      }));

      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          items: checkoutItems,
          shippingAddressId: selectedAddressId
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to create checkout session");
      }

      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error("No checkout URL received");
      }
    } catch (err) {
      console.error("Checkout error:", err);
      setIsProcessing(false);
      toast.error('Failed to proceed to checkout');
    }
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
            <span>Tax (6% GST)</span>
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
            <CreditCard className="h-4 w-4" />
            <span>Secure payment via Stripe</span>
          </div>
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
              "Proceed to Payment"
            )}
          </Button>
        </div>
      </div>
    </div>
  );
} 