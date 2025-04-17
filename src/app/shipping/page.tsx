import { Metadata } from "next"
import { PolicyLayout } from "@/components/layouts/PolicyLayout"
import { Card, CardContent } from "@/components/ui/card"
import { Truck, Clock, Globe2, AlertCircle, BadgeCheck } from "lucide-react"

export const metadata: Metadata = {
  title: "Shipping Information | BinWahab",
  description: "Learn about our shipping policies, delivery times, and shipping methods.",
}

export default function ShippingPage() {
  return (
    <PolicyLayout
      heading="Shipping Information"
      subheading="Everything you need to know about our shipping policies and delivery services"
    >
      <div className="space-y-8">
        {/* Delivery Methods */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <Truck className="h-6 w-6 text-primary" />
              <h2 className="text-2xl font-bold">Delivery Methods</h2>
            </div>
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold text-primary mb-2">Our Delivery Partner</h3>
                <p className="text-muted-foreground mb-4">
                  We partner with J&T Express, a trusted logistics provider, to ensure reliable and efficient delivery of your orders. J&T Express offers extensive coverage across Malaysia with real-time tracking capabilities.
                </p>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-primary mb-2">Standard Delivery</h3>
                <p className="text-muted-foreground">
                  • 3-5 working days for West Malaysia<br />
                  • 5-7 working days for East Malaysia<br />
                  • Free shipping for orders above RM150
                </p>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-primary mb-2">Express Delivery</h3>
                <p className="text-muted-foreground">
                  • 1-2 working days for West Malaysia<br />
                  • 2-3 working days for East Malaysia<br />
                  • Additional RM15 shipping fee
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Processing Time */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <Clock className="h-6 w-6 text-primary" />
              <h2 className="text-2xl font-bold">Order Processing</h2>
            </div>
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold text-primary mb-2">Processing Timeline</h3>
                <p className="text-muted-foreground">
                  • Orders are processed within 24-48 hours<br />
                  • Orders placed during weekends or public holidays will be processed the next working day<br />
                  • You will receive a tracking number once your order is shipped
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* International Shipping */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <Globe2 className="h-6 w-6 text-primary" />
              <h2 className="text-2xl font-bold">International Shipping</h2>
            </div>
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold text-primary mb-2">Available Regions</h3>
                <p className="text-muted-foreground">
                  • Singapore: 3-5 working days<br />
                  • Brunei: 5-7 working days<br />
                  • Indonesia: 7-10 working days<br />
                  • Other Southeast Asian countries: 10-14 working days
                </p>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-primary mb-2">International Rates</h3>
                <p className="text-muted-foreground">
                  • Shipping rates are calculated based on weight and destination<br />
                  • Free shipping for international orders above RM500<br />
                  • Custom duties and taxes are the responsibility of the customer
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Important Notes */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <AlertCircle className="h-6 w-6 text-primary" />
              <h2 className="text-2xl font-bold">Important Information</h2>
            </div>
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold text-primary mb-2">Delivery Guidelines</h3>
                <p className="text-muted-foreground">
                  • Please ensure your shipping address is complete and accurate<br />
                  • A signature may be required upon delivery<br />
                  • We are not responsible for delays caused by customs or weather conditions<br />
                  • Contact our customer service if you haven't received your order within the expected timeframe
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tracking Orders */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <BadgeCheck className="h-6 w-6 text-primary" />
              <h2 className="text-2xl font-bold">Track Your Order</h2>
            </div>
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold text-primary mb-2">Tracking Information</h3>
                <p className="text-muted-foreground">
                  • Track your order using the tracking number provided in your shipping confirmation email<br />
                  • Visit <a href="https://jtexpress.my/tracking" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">J&T Express Tracking</a> to track your package<br />
                  • Updates are provided at key stages of the delivery process<br />
                  • Contact our customer service team if you need assistance with tracking your order
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </PolicyLayout>
  )
} 