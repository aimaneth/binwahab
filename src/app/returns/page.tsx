import { Metadata } from "next"
import { PolicyLayout } from "@/components/layouts/PolicyLayout"
import { Card, CardContent } from "@/components/ui/card"
import { RefreshCw, Calendar, Package, AlertCircle, CheckCircle2, Ban } from "lucide-react"

export const metadata: Metadata = {
  title: "Returns & Exchanges | BinWahab",
  description: "Learn about our returns and exchange policies for your purchases.",
}

export default function ReturnsPage() {
  return (
    <PolicyLayout
      heading="Returns & Exchanges"
      subheading="Our commitment to your satisfaction with clear and fair return policies"
    >
      <div className="space-y-8">
        {/* Return Policy Overview */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <RefreshCw className="h-6 w-6 text-primary" />
              <h2 className="text-2xl font-bold">Return Policy Overview</h2>
            </div>
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold text-primary mb-2">Return Window</h3>
                <p className="text-muted-foreground">
                  • 14 days return window from the date of delivery<br />
                  • Items must be unworn, unwashed, and with original tags attached<br />
                  • Original receipt or proof of purchase required
                </p>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-primary mb-2">Refund Options</h3>
                <p className="text-muted-foreground">
                  • Full refund to original payment method<br />
                  • Store credit option available<br />
                  • Exchange for different size or color (subject to availability)
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Return Process */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <Package className="h-6 w-6 text-primary" />
              <h2 className="text-2xl font-bold">Return Process</h2>
            </div>
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold text-primary mb-2">How to Return</h3>
                <p className="text-muted-foreground">
                  1. Contact our customer service to initiate a return<br />
                  2. Fill out the return form provided in your order<br />
                  3. Pack the item(s) securely in original packaging<br />
                  4. Attach the provided return label<br />
                  5. Drop off at any Pos Malaysia branch
                </p>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-primary mb-2">Processing Time</h3>
                <p className="text-muted-foreground">
                  • Returns are processed within 3-5 business days of receipt<br />
                  • Refunds may take 5-7 business days to appear in your account<br />
                  • You will receive email notifications at each step
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Non-Returnable Items */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <Ban className="h-6 w-6 text-primary" />
              <h2 className="text-2xl font-bold">Non-Returnable Items</h2>
            </div>
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold text-primary mb-2">Excluded Items</h3>
                <p className="text-muted-foreground">
                  • Intimate apparel and undergarments<br />
                  • Sale items marked as "Final Sale"<br />
                  • Customized or altered items<br />
                  • Items without original tags or packaging<br />
                  • Items showing signs of wear or use
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Exchange Policy */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <CheckCircle2 className="h-6 w-6 text-primary" />
              <h2 className="text-2xl font-bold">Exchange Policy</h2>
            </div>
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold text-primary mb-2">Exchange Options</h3>
                <p className="text-muted-foreground">
                  • Free size exchanges within 14 days<br />
                  • Color exchanges subject to availability<br />
                  • Different style exchanges will be processed as a return and new purchase<br />
                  • Price differences will be charged or refunded accordingly
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
                <h3 className="text-lg font-semibold text-primary mb-2">Return Shipping</h3>
                <p className="text-muted-foreground">
                  • Free returns for Malaysian customers<br />
                  • International returns shipping cost borne by customer<br />
                  • Use our provided return label to ensure proper tracking<br />
                  • Items must be returned in original packaging
                </p>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-primary mb-2">Quality Check</h3>
                <p className="text-muted-foreground">
                  • All returns undergo quality inspection<br />
                  • Items damaged by customer may be rejected<br />
                  • Defective items will be fully refunded including shipping<br />
                  • Photo evidence may be required for damaged items
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </PolicyLayout>
  )
} 