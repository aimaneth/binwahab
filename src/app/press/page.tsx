import { Metadata } from "next"
import Image from "next/image"
import { PolicyLayout } from "@/components/layouts/PolicyLayout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Download, Newspaper, Camera, Mail } from "lucide-react"

export const metadata: Metadata = {
  title: "Press & Media",
  description: "Access press releases, media resources, and contact information for media inquiries.",
}

const pressReleases = [
  {
    date: "March 15, 2024",
    title: "Binwahab Launches Sustainable Packaging Initiative",
    category: "Sustainability",
    summary: "Leading e-commerce platform introduces 100% recyclable packaging across all shipments."
  },
  {
    date: "February 28, 2024",
    title: "Binwahab Expands to Southeast Asian Markets",
    category: "Business",
    summary: "Strategic expansion brings innovative e-commerce solutions to new regions."
  },
  {
    date: "January 15, 2024",
    title: "Binwahab Reports Record Growth in Q4 2023",
    category: "Financial",
    summary: "Company achieves milestone growth with 200% increase in customer base."
  }
]

const mediaResources = [
  {
    title: "Brand Assets",
    icon: <Camera className="h-6 w-6" />,
    description: "Download our logo, brand guidelines, and official images",
    downloadLink: "#"
  },
  {
    title: "Press Kit",
    icon: <Newspaper className="h-6 w-6" />,
    description: "Access our company fact sheet, executive bios, and product information",
    downloadLink: "#"
  },
  {
    title: "Media Coverage",
    icon: <Mail className="h-6 w-6" />,
    description: "Browse our recent media mentions and coverage highlights",
    downloadLink: "#"
  }
]

export default function PressPage() {
  return (
    <PolicyLayout
      heading="Press & Media"
      subheading="Latest news and resources for media professionals"
    >
      <section className="space-y-12">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Latest News</h2>
          <div className="mt-6 space-y-6">
            {pressReleases.map((release) => (
              <Card key={release.title}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <p className="text-sm text-muted-foreground">
                          {release.date}
                        </p>
                        <Badge>{release.category}</Badge>
                      </div>
                      <h3 className="text-xl font-semibold">{release.title}</h3>
                      <p className="text-muted-foreground">{release.summary}</p>
                    </div>
                    <Button variant="outline">Read More</Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        <div>
          <h2 className="text-3xl font-bold tracking-tight mb-6">Media Resources</h2>
          <div className="grid gap-6 md:grid-cols-3">
            {mediaResources.map((resource) => (
              <Card key={resource.title}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    {resource.icon}
                    {resource.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground mb-4">
                    {resource.description}
                  </p>
                  <Button variant="outline" className="w-full">
                    <Download className="mr-2 h-4 w-4" />
                    Download
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Company Overview</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                Binwahab is a leading e-commerce platform revolutionizing online shopping
                through innovative technology and sustainable practices. Founded in 2023,
                we serve millions of customers worldwide.
              </p>
              <div className="space-y-2">
                <p><strong>Founded:</strong> 2023</p>
                <p><strong>Headquarters:</strong> [City, Country]</p>
                <p><strong>Employees:</strong> 100+</p>
                <p><strong>Markets:</strong> Global</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Media Contact</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-semibold">Press Inquiries</h3>
                <p className="text-muted-foreground mt-2">
                  For press inquiries and interview requests, please contact our media
                  relations team:
                </p>
              </div>
              <div className="space-y-2">
                <p>Email: press@binwahab.com</p>
                <p>Phone: [Press Contact Phone]</p>
                <p>Response Time: Within 24 hours</p>
              </div>
              <Button className="w-full">
                <Mail className="mr-2 h-4 w-4" />
                Contact Press Team
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="bg-muted rounded-lg p-8">
          <h2 className="text-2xl font-bold tracking-tight mb-4">
            Awards & Recognition
          </h2>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="p-4 bg-background rounded-lg">
              <p className="font-semibold">Best E-commerce Platform 2024</p>
              <p className="text-sm text-muted-foreground">Tech Innovation Awards</p>
            </div>
            <div className="p-4 bg-background rounded-lg">
              <p className="font-semibold">Sustainability Excellence Award</p>
              <p className="text-sm text-muted-foreground">Green Business Awards 2024</p>
            </div>
          </div>
        </div>
      </section>
    </PolicyLayout>
  )
} 