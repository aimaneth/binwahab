import { Metadata } from "next"
import { PolicyLayout } from "@/components/layouts/PolicyLayout"

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "Read our terms of service and conditions for using our website and services.",
}

export default function TermsPage() {
  return (
    <PolicyLayout
      heading="Terms of Service"
      subheading="Last updated: March 15, 2024"
    >
      <section className="space-y-6">
        <h2>1. Acceptance of Terms</h2>
        <p>
          By accessing and using this website, you accept and agree to be bound by the terms and
          provision of this agreement. If you do not agree to abide by the above, please do not use
          this service.
        </p>

        <h2>2. Use License</h2>
        <p>
          Permission is granted to temporarily download one copy of the materials (information or
          software) on Binwahab's website for personal, non-commercial transitory viewing only.
          This is the grant of a license, not a transfer of title, and under this license you may not:
        </p>
        <ul>
          <li>Modify or copy the materials</li>
          <li>Use the materials for any commercial purpose</li>
          <li>Attempt to decompile or reverse engineer any software contained on the website</li>
          <li>Remove any copyright or other proprietary notations from the materials</li>
          <li>Transfer the materials to another person or "mirror" the materials on any other server</li>
        </ul>

        <h2>3. Account Responsibilities</h2>
        <p>
          If you create an account on our website, you are responsible for maintaining the
          confidentiality of your account and password and for restricting access to your computer.
          You agree to accept responsibility for all activities that occur under your account.
        </p>

        <h2>4. Product Information</h2>
        <p>
          We strive to provide accurate product descriptions and pricing. However, we do not warrant
          that product descriptions or prices are accurate, complete, reliable, current, or error-free.
          If a product is not as described, your sole remedy is to return it in unused condition.
        </p>

        <h2>5. Pricing and Payment</h2>
        <p>
          All prices are subject to change without notice. We reserve the right to modify or
          discontinue any product or service without notice. We shall not be liable to you or any
          third party for any modification, price change, suspension, or discontinuance of the service.
        </p>

        <h2>6. Shipping and Delivery</h2>
        <p>
          Shipping times and costs may vary based on location and selected shipping method. We are
          not responsible for delays caused by customs, weather conditions, or other circumstances
          beyond our control.
        </p>

        <h2>7. Returns and Refunds</h2>
        <p>
          Please refer to our Returns Policy for detailed information about returns, refunds, and
          exchanges. All returns must comply with our stated policies and procedures.
        </p>

        <h2>8. Limitation of Liability</h2>
        <p>
          In no event shall Binwahab be liable for any damages (including, without limitation,
          damages for loss of data or profit, or due to business interruption) arising out of the
          use or inability to use the materials on our website.
        </p>

        <h2>9. Governing Law</h2>
        <p>
          These terms and conditions are governed by and construed in accordance with the laws of
          [Your Jurisdiction] and you irrevocably submit to the exclusive jurisdiction of the courts
          in that location.
        </p>

        <h2>10. Changes to Terms</h2>
        <p>
          We reserve the right to modify these terms at any time. We do so by posting and drawing
          attention to the updated terms on the site. Your decision to continue to visit and make
          use of the site after such changes have been made constitutes your formal acceptance of
          the new Terms of Service.
        </p>

        <h2>Contact Information</h2>
        <p>
          If you have any questions about our Terms of Service, please contact us at:
        </p>
        <p>
          Email: legal@binwahab.com<br />
          Address: [Your Business Address]<br />
          Phone: [Your Business Phone]
        </p>
      </section>
    </PolicyLayout>
  )
} 