import { Metadata } from "next"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { PolicyLayout } from "@/components/layouts/PolicyLayout"

export const metadata: Metadata = {
  title: "FAQ - Frequently Asked Questions",
  description: "Find answers to commonly asked questions about our products, services, shipping, returns, and more.",
}

const faqs = [
  {
    question: "What payment methods do you accept?",
    answer: "We accept all major credit cards (Visa, MasterCard), PayPal, and bank transfers (FPX). All payments are processed securely through our payment partners (Stripe)."
  },
  {
    question: "How long does shipping take?",
    answer: "Shipping times vary depending on your location and chosen shipping method. Typically, domestic orders arrive within 3-5 business days, while international orders may take 7-14 business days."
  },
  {
    question: "What is your return policy?",
    answer: "We offer a 30-day return policy for most items. Products must be unused and in their original packaging. Please visit our Returns page for detailed information and instructions."
  },
  {
    question: "Do you ship internationally?",
    answer: "Yes, we ship to most countries worldwide. Shipping costs and delivery times vary by location. You can see exact shipping costs during checkout."
  },
  {
    question: "How can I track my order?",
    answer: "Once your order ships, you'll receive a tracking number via email. You can use this number to track your package through our website or the carrier's website."
  },
  {
    question: "How do I contact customer service?",
    answer: "Our customer service team is available via email at support@binwahab.com or through our contact form. We typically respond within 24 hours during business days."
  },
  {
    question: "Do you offer wholesale pricing?",
    answer: "Yes, we offer wholesale pricing for qualified businesses. Please contact our sales team at wholesale@binwahab.com for more information."
  }
]

export default function FAQPage() {
  return (
    <PolicyLayout
      heading="Frequently Asked Questions"
      subheading="Find answers to common questions about our products and services"
    >
      <Accordion type="single" collapsible className="w-full">
        {faqs.map((faq, index) => (
          <AccordionItem key={index} value={`item-${index}`}>
            <AccordionTrigger className="text-left">
              {faq.question}
            </AccordionTrigger>
            <AccordionContent>
              <p className="text-muted-foreground">
                {faq.answer}
              </p>
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </PolicyLayout>
  )
} 