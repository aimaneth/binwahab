import { Metadata } from "next"
import { PolicyLayout } from "@/components/layouts/PolicyLayout"
import { Card, CardContent } from "@/components/ui/card"
import { Shield, UserCircle, Mail, Share2, Lock, FileKey, Phone, AlertCircle } from "lucide-react"

export const metadata: Metadata = {
  title: "Privacy Policy | BinWahab",
  description: "Learn about how we collect, use, and protect your personal information.",
}

export default function PrivacyPolicyPage() {
  return (
    <PolicyLayout
      heading="Privacy Policy"
      subheading="Last updated: March 15, 2024"
    >
      <div className="space-y-8">
        {/* Introduction */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <Shield className="h-6 w-6 text-primary" />
              <h2 className="text-2xl font-bold">Introduction</h2>
            </div>
            <p className="text-muted-foreground">
              At Binwahab, we take your privacy seriously. This Privacy Policy explains how we collect,
              use, disclose, and safeguard your information when you visit our website or use our services.
              Please read this privacy policy carefully. If you do not agree with the terms of this privacy
              policy, please do not access the site.
            </p>
          </CardContent>
        </Card>

        {/* Information Collection */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <UserCircle className="h-6 w-6 text-primary" />
              <h2 className="text-2xl font-bold">Information We Collect</h2>
            </div>
            <div className="space-y-4">
              <p className="text-muted-foreground">
                We collect information that you provide directly to us, including but not limited to:
              </p>
              <ul className="list-none space-y-2 text-muted-foreground">
                <li className="flex items-center gap-2">
                  <UserCircle className="h-4 w-4" />
                  Name and contact information
                </li>
                <li className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  Email address
                </li>
                <li className="flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  Phone number
                </li>
                <li className="flex items-center gap-2">
                  <FileKey className="h-4 w-4" />
                  Billing and shipping addresses
                </li>
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* Information Usage */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <Share2 className="h-6 w-6 text-primary" />
              <h2 className="text-2xl font-bold">How We Use Your Information</h2>
            </div>
            <div className="space-y-4">
              <p className="text-muted-foreground">We use the information we collect to:</p>
              <ul className="list-none space-y-2 text-muted-foreground">
                <li>• Process your orders and payments</li>
                <li>• Communicate with you about your orders and our services</li>
                <li>• Send you marketing communications (with your consent)</li>
                <li>• Improve our website and services</li>
                <li>• Comply with legal obligations</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* Information Sharing */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <Share2 className="h-6 w-6 text-primary" />
              <h2 className="text-2xl font-bold">Information Sharing</h2>
            </div>
            <div className="space-y-4">
              <p className="text-muted-foreground">We may share your information with:</p>
              <ul className="list-none space-y-2 text-muted-foreground">
                <li>• Service providers who assist in our operations</li>
                <li>• Payment processors</li>
                <li>• Shipping partners</li>
                <li>• Law enforcement when required by law</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* Data Security */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <Lock className="h-6 w-6 text-primary" />
              <h2 className="text-2xl font-bold">Data Security</h2>
            </div>
            <p className="text-muted-foreground">
              We implement appropriate technical and organizational measures to maintain the security of
              your personal information, including:
            </p>
            <ul className="list-none space-y-2 mt-4 text-muted-foreground">
              <li>• Encryption of sensitive data</li>
              <li>• Secure servers and infrastructure</li>
              <li>• Regular security assessments</li>
              <li>• Access controls and authentication</li>
            </ul>
          </CardContent>
        </Card>

        {/* Your Rights */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <FileKey className="h-6 w-6 text-primary" />
              <h2 className="text-2xl font-bold">Your Rights</h2>
            </div>
            <div className="space-y-4">
              <p className="text-muted-foreground">You have the right to:</p>
              <ul className="list-none space-y-2 text-muted-foreground">
                <li>• Access your personal information</li>
                <li>• Correct inaccurate information</li>
                <li>• Request deletion of your information</li>
                <li>• Object to processing of your information</li>
                <li>• Withdraw consent</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* Contact Information */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <AlertCircle className="h-6 w-6 text-primary" />
              <h2 className="text-2xl font-bold">Contact Us</h2>
            </div>
            <p className="text-muted-foreground mb-4">
              If you have questions about this Privacy Policy, please contact us at:
            </p>
            <div className="space-y-2 text-muted-foreground">
              <p className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                privacy@binwahab.com
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