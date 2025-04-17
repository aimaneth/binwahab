import { Metadata } from "next"
import { PolicyLayout } from "@/components/layouts/PolicyLayout"
import { Card, CardContent } from "@/components/ui/card"
import { Leaf, Recycle, Box, TreePine, Factory, Heart } from "lucide-react"

export const metadata: Metadata = {
  title: "Sustainability",
  description: "Learn about our commitment to environmental sustainability and eco-friendly practices.",
}

const initiatives = [
  {
    title: "Eco-Friendly Packaging",
    icon: <Box className="h-6 w-6" />,
    description: "We use 100% recyclable packaging materials and minimize plastic use in our shipping process."
  },
  {
    title: "Sustainable Materials",
    icon: <Leaf className="h-6 w-6" />,
    description: "Our products are made from sustainably sourced materials, reducing environmental impact."
  },
  {
    title: "Recycling Program",
    icon: <Recycle className="h-6 w-6" />,
    description: "We offer a recycling program for used products, promoting circular economy practices."
  },
  {
    title: "Carbon Neutral",
    icon: <Factory className="h-6 w-6" />,
    description: "We offset our carbon emissions through verified environmental projects."
  },
  {
    title: "Tree Planting",
    icon: <TreePine className="h-6 w-6" />,
    description: "For every order, we plant a tree through our partnership with environmental organizations."
  },
  {
    title: "Community Impact",
    icon: <Heart className="h-6 w-6" />,
    description: "We support local environmental initiatives and education programs."
  }
]

export default function SustainabilityPage() {
  return (
    <PolicyLayout
      heading="Our Commitment to Sustainability"
      subheading="Building a better future through sustainable practices"
    >
      <section className="space-y-8">
        <div>
          <h2>Our Vision</h2>
          <p className="mt-4 text-muted-foreground">
            At Binwahab, we believe in conducting business responsibly and sustainably.
            Our commitment to environmental stewardship guides everything we do, from
            product development to packaging and shipping.
          </p>
        </div>

        <div>
          <h2>Sustainability Initiatives</h2>
          <div className="mt-6 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {initiatives.map((initiative) => (
              <Card key={initiative.title}>
                <CardContent className="flex flex-col items-center text-center p-6 space-y-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                    {initiative.icon}
                  </div>
                  <h3 className="font-semibold">{initiative.title}</h3>
                  <p className="text-sm text-muted-foreground">
                    {initiative.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        <div className="space-y-6">
          <h2>Environmental Impact</h2>
          <div className="space-y-4">
            <h3>Carbon Footprint Reduction</h3>
            <p>
              We actively work to reduce our carbon footprint through:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Using renewable energy in our facilities</li>
              <li>Optimizing shipping routes and consolidating deliveries</li>
              <li>Partnering with eco-conscious suppliers</li>
              <li>Implementing energy-efficient practices</li>
            </ul>
          </div>

          <div className="space-y-4">
            <h3>Waste Reduction</h3>
            <p>
              Our waste reduction strategy includes:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Minimizing packaging materials</li>
              <li>Using biodegradable alternatives where possible</li>
              <li>Implementing recycling programs</li>
              <li>Reducing water consumption in our operations</li>
            </ul>
          </div>
        </div>

        <div>
          <h2>Future Goals</h2>
          <p className="mt-4 text-muted-foreground">
            We are committed to continuous improvement in our sustainability efforts.
            Our goals for the next five years include:
          </p>
          <ul className="mt-4 list-disc pl-6 space-y-2">
            <li>Achieving 100% renewable energy usage in all operations</li>
            <li>Eliminating single-use plastics from our packaging</li>
            <li>Expanding our product recycling program globally</li>
            <li>Reducing our overall carbon emissions by 50%</li>
          </ul>
        </div>

        <div>
          <h2>Get Involved</h2>
          <p className="mt-4 text-muted-foreground">
            Join us in our sustainability journey! Learn how you can participate in
            our environmental initiatives and make a positive impact:
          </p>
          <ul className="mt-4 list-disc pl-6 space-y-2">
            <li>Participate in our recycling program</li>
            <li>Choose eco-friendly shipping options</li>
            <li>Follow our sustainability tips on social media</li>
            <li>Give feedback on our environmental initiatives</li>
          </ul>
        </div>

        <div>
          <h2>Contact Our Sustainability Team</h2>
          <p className="mt-4">
            For questions about our sustainability initiatives or to get involved, contact us:
          </p>
          <p className="mt-2">
            Email: sustainability@binwahab.com<br />
            Phone: [Your Sustainability Team Phone]<br />
            Hours: Monday - Friday, 9:00 AM - 5:00 PM [Your Timezone]
          </p>
        </div>
      </section>
    </PolicyLayout>
  )
} 