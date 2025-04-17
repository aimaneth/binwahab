import { Metadata } from "next"
import { PolicyLayout } from "@/components/layouts/PolicyLayout"
import { Card, CardContent } from "@/components/ui/card"
import { 
  CheckCircle2, 
  Key, 
  UserCircle, 
  ShoppingBag, 
  CreditCard, 
  Truck, 
  RefreshCw,
  ShieldAlert,
  Scale,
  AlertCircle,
  Mail,
  Phone
} from "lucide-react"

export const metadata: Metadata = {
  title: "Terms of Service | BinWahab",
  description: "Read our terms of service and conditions for using our website and services.",
}

export default function TermsPage() {
  return (
    <PolicyLayout
      heading="Terms of Service"
      subheading="Last updated: March 15, 2024"
    >
      <div className="space-y-8">
        {/* Acceptance */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <CheckCircle2 className="h-6 w-6 text-primary" />
              <h2 className="text-2xl font-bold">1. Acceptance of Terms</h2>
            </div>
            <p className="text-muted-foreground">
              By accessing and using this website, you accept and agree to be bound by the terms and
              provision of this agreement. If you do not agree to abide by the above, please do not use
              this service.
            </p>
          </CardContent>
        </Card>

        {/* Use License */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <Key className="h-6 w-6 text-primary" />
              <h2 className="text-2xl font-bold">2. Use License</h2>
            </div>
            <div className="space-y-4">
              <p className="text-muted-foreground">
                Permission is granted to temporarily download one copy of the materials (information or
                software) on Binwahab's website for personal, non-commercial transitory viewing only.
                This is the grant of a license, not a transfer of title, and under this license you may not:
              </p>
              <ul className="list-none space-y-2 text-muted-foreground">
                <li>• Modify or copy the materials</li>
                <li>• Use the materials for any commercial purpose</li>
                <li>• Attempt to decompile or reverse engineer any software contained on the website</li>
                <li>• Remove any copyright or other proprietary notations from the materials</li>
                <li>• Transfer the materials to another person or "mirror" the materials on any other server</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* Account Responsibilities */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <UserCircle className="h-6 w-6 text-primary" />
              <h2 className="text-2xl font-bold">3. Account Responsibilities</h2>
            </div>
            <p className="text-muted-foreground">
              If you create an account on our website, you are responsible for maintaining the
              confidentiality of your account and password and for restricting access to your computer.
              You agree to accept responsibility for all activities that occur under your account.
            </p>
          </CardContent>
        </Card>

        {/* Product Information */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <ShoppingBag className="h-6 w-6 text-primary" />
              <h2 className="text-2xl font-bold">4. Product Information</h2>
            </div>
            <p className="text-muted-foreground">
              We strive to provide accurate product descriptions and pricing. However, we do not warrant
              that product descriptions or prices are accurate, complete, reliable, current, or error-free.
              If a product is not as described, your sole remedy is to return it in unused condition.
            </p>
          </CardContent>
        </Card>

        {/* Pricing and Payment */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <CreditCard className="h-6 w-6 text-primary" />
              <h2 className="text-2xl font-bold">5. Pricing and Payment</h2>
            </div>
            <p className="text-muted-foreground">
              All prices are subject to change without notice. We reserve the right to modify or
              discontinue any product or service without notice. We shall not be liable to you or any
              third party for any modification, price change, suspension, or discontinuance of the service.
            </p>
          </CardContent>
        </Card>

        {/* Shipping and Delivery */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <Truck className="h-6 w-6 text-primary" />
              <h2 className="text-2xl font-bold">6. Shipping and Delivery</h2>
            </div>
            <p className="text-muted-foreground">
              Shipping times and costs may vary based on location and selected shipping method. We are
              not responsible for delays caused by customs, weather conditions, or other circumstances
              beyond our control.
            </p>
          </CardContent>
        </Card>

        {/* Returns and Refunds */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <RefreshCw className="h-6 w-6 text-primary" />
              <h2 className="text-2xl font-bold">7. Returns and Refunds</h2>
            </div>
            <p className="text-muted-foreground">
              Please refer to our Returns Policy for detailed information about returns, refunds, and
              exchanges. All returns must comply with our stated policies and procedures.
            </p>
          </CardContent>
        </Card>

        {/* Limitation of Liability */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <ShieldAlert className="h-6 w-6 text-primary" />
              <h2 className="text-2xl font-bold">8. Limitation of Liability</h2>
            </div>
            <p className="text-muted-foreground">
              In no event shall Binwahab be liable for any damages (including, without limitation,
              damages for loss of data or profit, or due to business interruption) arising out of the
              use or inability to use the materials on our website.
            </p>
          </CardContent>
        </Card>

        {/* Governing Law */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <Scale className="h-6 w-6 text-primary" />
              <h2 className="text-2xl font-bold">9. Governing Law</h2>
            </div>
            <p className="text-muted-foreground">
              These terms and conditions are governed by and construed in accordance with the laws of
              Malaysia and you irrevocably submit to the exclusive jurisdiction of the courts
              in Malaysia.
            </p>
          </CardContent>
        </Card>

        {/* Changes to Terms */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <AlertCircle className="h-6 w-6 text-primary" />
              <h2 className="text-2xl font-bold">10. Changes to Terms</h2>
            </div>
            <p className="text-muted-foreground">
              We reserve the right to modify these terms at any time. We do so by posting and drawing
              attention to the updated terms on the site. Your decision to continue to visit and make
              use of the site after such changes have been made constitutes your formal acceptance of
              the new Terms of Service.
            </p>
          </CardContent>
        </Card>

        {/* Contact Information */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <Mail className="h-6 w-6 text-primary" />
              <h2 className="text-2xl font-bold">Contact Information</h2>
            </div>
            <p className="text-muted-foreground mb-4">
              If you have any questions about our Terms of Service, please contact us at:
            </p>
            <div className="space-y-2 text-muted-foreground">
              <p className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                legal@binwahab.com
              </p>
              <p className="flex items-center gap-2">
                <Phone className="h-4 w-4" />
                +601114324225
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </PolicyLayout>
  )
} 