import { Metadata } from "next"
import { PolicyLayout } from "@/components/layouts/PolicyLayout"

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "Learn about how we collect, use, and protect your personal information.",
}

export default function PrivacyPolicyPage() {
  return (
    <PolicyLayout
      heading="Privacy Policy"
      subheading="Last updated: March 15, 2024"
    >
      <section className="space-y-6">
        <h2>Introduction</h2>
        <p>
          At Binwahab, we take your privacy seriously. This Privacy Policy explains how we collect,
          use, disclose, and safeguard your information when you visit our website or use our services.
          Please read this privacy policy carefully. If you do not agree with the terms of this privacy
          policy, please do not access the site.
        </p>

        <h2>Information We Collect</h2>
        <p>
          We collect information that you provide directly to us, including but not limited to:
        </p>
        <ul>
          <li>Name and contact information</li>
          <li>Billing and shipping addresses</li>
          <li>Payment information</li>
          <li>Email address</li>
          <li>Phone number</li>
          <li>Any other information you choose to provide</li>
        </ul>

        <h2>How We Use Your Information</h2>
        <p>
          We use the information we collect to:
        </p>
        <ul>
          <li>Process your orders and payments</li>
          <li>Communicate with you about your orders and our services</li>
          <li>Send you marketing communications (with your consent)</li>
          <li>Improve our website and services</li>
          <li>Comply with legal obligations</li>
        </ul>

        <h2>Information Sharing</h2>
        <p>
          We may share your information with:
        </p>
        <ul>
          <li>Service providers who assist in our operations</li>
          <li>Payment processors</li>
          <li>Shipping partners</li>
          <li>Law enforcement when required by law</li>
        </ul>

        <h2>Data Security</h2>
        <p>
          We implement appropriate technical and organizational measures to maintain the security of
          your personal information, including encryption, secure servers, and regular security assessments.
        </p>

        <h2>Your Rights</h2>
        <p>
          You have the right to:
        </p>
        <ul>
          <li>Access your personal information</li>
          <li>Correct inaccurate information</li>
          <li>Request deletion of your information</li>
          <li>Object to processing of your information</li>
          <li>Withdraw consent</li>
        </ul>

        <h2>Contact Us</h2>
        <p>
          If you have questions about this Privacy Policy, please contact us at:
        </p>
        <p>
          Email: privacy@binwahab.com<br />
          Address: [Your Business Address]<br />
          Phone: [Your Business Phone]
        </p>
      </section>
    </PolicyLayout>
  )
} 