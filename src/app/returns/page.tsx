import { Metadata } from "next"
import { PolicyLayout } from "@/components/layouts/PolicyLayout"

export const metadata: Metadata = {
  title: "Returns & Refunds Policy",
  description: "Learn about our returns and refunds policy, including how to return items and get refunds.",
}

export default function ReturnsPage() {
  return (
    <PolicyLayout
      heading="Returns & Refunds Policy"
      subheading="Making returns simple and hassle-free"
    >
      <section className="space-y-6">
        <h2>Return Policy Overview</h2>
        <p>
          We want you to be completely satisfied with your purchase. If you're not happy with your
          order for any reason, we accept returns within 30 days of delivery for a full refund or
          exchange.
        </p>

        <h2>Return Eligibility</h2>
        <p>To be eligible for a return, your item must be:</p>
        <ul>
          <li>Unused and in the same condition that you received it</li>
          <li>In the original packaging</li>
          <li>Accompanied by the original receipt or proof of purchase</li>
          <li>Returned within 30 days of delivery</li>
        </ul>

        <h2>Non-Returnable Items</h2>
        <p>The following items cannot be returned:</p>
        <ul>
          <li>Custom or personalized orders</li>
          <li>Perishable goods</li>
          <li>Downloadable software products</li>
          <li>Gift cards</li>
          <li>Personal care items</li>
          <li>Items marked as final sale</li>
        </ul>

        <h2>Return Process</h2>
        <p>To return an item, please follow these steps:</p>
        <ol>
          <li>Contact our customer service team to initiate the return</li>
          <li>Receive a Return Merchandise Authorization (RMA) number</li>
          <li>Pack the item securely in its original packaging</li>
          <li>Include the RMA number on the outside of the package</li>
          <li>Ship the item to the provided return address</li>
        </ol>

        <h2>Refund Process</h2>
        <p>
          Once we receive your return, we will inspect it and notify you of the status of your
          refund. If approved, your refund will be processed, and a credit will automatically be
          applied to your original method of payment within 5-10 business days.
        </p>

        <h2>Return Shipping</h2>
        <p>
          You will be responsible for paying for your own shipping costs for returning your item.
          Shipping costs are non-refundable. If you receive a refund, the cost of return shipping
          will be deducted from your refund.
        </p>

        <h2>Damaged or Defective Items</h2>
        <p>
          If you receive a damaged or defective item, please contact us immediately. We will cover
          the return shipping costs and send you a replacement item at no additional cost.
        </p>

        <h2>Exchanges</h2>
        <p>
          If you need to exchange an item for a different size or color, please contact our
          customer service team. We will guide you through the exchange process and ensure you
          receive the correct item.
        </p>

        <h2>Contact Us</h2>
        <p>
          If you have any questions about our returns policy, please contact us:
        </p>
        <p>
          Email: returns@binwahab.com<br />
          Phone: [Your Returns Department Phone]<br />
          Hours: Monday - Friday, 9:00 AM - 5:00 PM [Your Timezone]
        </p>
      </section>
    </PolicyLayout>
  )
} 