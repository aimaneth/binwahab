import { Metadata } from "next"
import { PolicyLayout } from "@/components/layouts/PolicyLayout"
import { Card, CardContent } from "@/components/ui/card"
import { Package, Truck, Clock, Globe } from "lucide-react"

export const metadata: Metadata = {
  title: "Shipping Information",
  description: "Learn about our shipping methods, delivery times, and costs.",
}

const shippingMethods = [
  {
    name: "Standard Shipping",
    icon: <Truck className="h-6 w-6" />,
    time: "3-5 business days",
    cost: "Free on orders over $50",
    description: "Best for non-urgent deliveries"
  },
  {
    name: "Express Shipping",
    icon: <Package className="h-6 w-6" />,
    time: "1-2 business days",
    cost: "$15.00",
    description: "Perfect for when you need it quickly"
  },
  {
    name: "Next Day Delivery",
    icon: <Clock className="h-6 w-6" />,
    time: "Next business day",
    cost: "$25.00",
    description: "For urgent deliveries"
  },
  {
    name: "International Shipping",
    icon: <Globe className="h-6 w-6" />,
    time: "7-14 business days",
    cost: "Varies by location",
    description: "Available for most countries"
  }
]

export default function ShippingPage() {
  return (
    <PolicyLayout
      heading="Shipping Information"
      subheading="Fast and reliable shipping to your doorstep"
    >
      <section className="space-y-6">
        <h2>Shipping Methods</h2>
        <div className="grid gap-6 md:grid-cols-2">
          {shippingMethods.map((method) => (
            <Card key={method.name}>
              <CardContent className="flex items-start space-x-4 p-6">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                  {method.icon}
                </div>
                <div className="space-y-1">
                  <h3 className="font-semibold">{method.name}</h3>
                  <p className="text-sm text-muted-foreground">
                    Delivery Time: {method.time}
                  </p>
                  <p className="text-sm font-medium">
                    Cost: {method.cost}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {method.description}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <h2>Shipping Policies</h2>
        <div className="space-y-4">
          <h3>Order Processing</h3>
          <p>
            Orders are typically processed within 1-2 business days. You will receive a confirmation
            email with tracking information once your order ships.
          </p>

          <h3>Delivery Times</h3>
          <p>
            Delivery times are estimated and may vary depending on your location and chosen shipping
            method. Delivery to remote areas may take additional time.
          </p>

          <h3>International Shipping</h3>
          <p>
            We ship to most countries worldwide. International orders may be subject to import duties
            and taxes, which are the responsibility of the recipient. Please check your country's
            customs policies before ordering.
          </p>

          <h3>Tracking Your Order</h3>
          <p>
            Once your order ships, you will receive a tracking number via email. You can track your
            package's status through our website or the carrier's tracking system.
          </p>

          <h3>Shipping Restrictions</h3>
          <p>
            Some items may have shipping restrictions to certain locations. We will notify you if
            any items in your order cannot be shipped to your address.
          </p>
        </div>

        <h2>Contact Shipping Support</h2>
        <p>
          For questions about shipping or to track an order, please contact our shipping support team:
        </p>
        <p>
          Email: shipping@binwahab.com<br />
          Phone: [Your Shipping Support Phone]<br />
          Hours: Monday - Friday, 9:00 AM - 5:00 PM [Your Timezone]
        </p>
      </section>
    </PolicyLayout>
  )
} 