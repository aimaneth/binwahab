import { Metadata } from "next"
import { PolicyLayout } from "@/components/layouts/PolicyLayout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  Code, 
  Palette, 
  LineChart, 
  Users, 
  HeartHandshake,
  GraduationCap,
  Briefcase,
  Coffee
} from "lucide-react"

export const metadata: Metadata = {
  title: "Careers at Binwahab",
  description: "Join our team and help build the future of e-commerce. Explore current job openings and learn about our company culture.",
}

const benefits = [
  {
    icon: <HeartHandshake className="h-6 w-6" />,
    title: "Competitive Compensation",
    description: "Attractive salary packages and performance bonuses"
  },
  {
    icon: <GraduationCap className="h-6 w-6" />,
    title: "Learning & Development",
    description: "Professional growth opportunities and training programs"
  },
  {
    icon: <Briefcase className="h-6 w-6" />,
    title: "Flexible Work",
    description: "Remote-friendly with flexible working hours"
  },
  {
    icon: <Coffee className="h-6 w-6" />,
    title: "Work-Life Balance",
    description: "Generous vacation policy and wellness programs"
  }
]

const openings = [
  {
    department: "Engineering",
    icon: <Code className="h-6 w-6" />,
    positions: [
      {
        title: "Senior Full Stack Developer",
        type: "Full-time",
        location: "Remote",
        experience: "5+ years"
      },
      {
        title: "DevOps Engineer",
        type: "Full-time",
        location: "Hybrid",
        experience: "3+ years"
      }
    ]
  },
  {
    department: "Design",
    icon: <Palette className="h-6 w-6" />,
    positions: [
      {
        title: "UI/UX Designer",
        type: "Full-time",
        location: "Remote",
        experience: "3+ years"
      }
    ]
  },
  {
    department: "Marketing",
    icon: <LineChart className="h-6 w-6" />,
    positions: [
      {
        title: "Digital Marketing Manager",
        type: "Full-time",
        location: "On-site",
        experience: "4+ years"
      }
    ]
  },
  {
    department: "Customer Success",
    icon: <Users className="h-6 w-6" />,
    positions: [
      {
        title: "Customer Success Manager",
        type: "Full-time",
        location: "Hybrid",
        experience: "2+ years"
      }
    ]
  }
]

export default function CareersPage() {
  return (
    <PolicyLayout
      heading="Join Our Team"
      subheading="Build the future of e-commerce with us"
    >
      <section className="space-y-12">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Why Binwahab?</h2>
          <p className="mt-4 text-lg text-muted-foreground">
            We're building the next generation of e-commerce solutions, and we need
            passionate individuals to join us on this exciting journey.
          </p>
        </div>

        <div>
          <h2 className="text-2xl font-bold tracking-tight mb-6">Benefits & Perks</h2>
          <div className="grid gap-6 md:grid-cols-2">
            {benefits.map((benefit) => (
              <Card key={benefit.title}>
                <CardContent className="flex items-start space-x-4 p-6">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                    {benefit.icon}
                  </div>
                  <div>
                    <h3 className="font-semibold">{benefit.title}</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      {benefit.description}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        <div>
          <h2 className="text-2xl font-bold tracking-tight mb-6">Open Positions</h2>
          <div className="space-y-6">
            {openings.map((department) => (
              <Card key={department.department}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    {department.icon}
                    {department.department}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {department.positions.map((position) => (
                      <div
                        key={position.title}
                        className="flex items-center justify-between p-4 rounded-lg border"
                      >
                        <div className="space-y-1">
                          <h3 className="font-semibold">{position.title}</h3>
                          <div className="flex gap-2">
                            <Badge variant="secondary">{position.type}</Badge>
                            <Badge variant="outline">{position.location}</Badge>
                            <Badge variant="outline">{position.experience}</Badge>
                          </div>
                        </div>
                        <Button>Apply Now</Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        <div className="bg-muted rounded-lg p-8 text-center">
          <h2 className="text-2xl font-bold tracking-tight mb-4">
            Don't see a position that fits?
          </h2>
          <p className="text-muted-foreground mb-6">
            We're always looking for talented individuals to join our team.
            Send us your resume and we'll keep you in mind for future opportunities.
          </p>
          <Button size="lg">
            Send Open Application
          </Button>
        </div>

        <div>
          <h2 className="text-2xl font-bold tracking-tight mb-4">Our Hiring Process</h2>
          <ol className="space-y-4 list-decimal list-inside text-muted-foreground">
            <li>Application Review (1-2 days)</li>
            <li>Initial Phone Screen (30 minutes)</li>
            <li>Technical/Skills Assessment (if applicable)</li>
            <li>Team Interviews (2-3 hours)</li>
            <li>Final Interview & Offer</li>
          </ol>
        </div>

        <div>
          <h2 className="text-2xl font-bold tracking-tight mb-4">Contact HR</h2>
          <p>
            For questions about our hiring process or open positions, please contact:
          </p>
          <p className="mt-2">
            Email: careers@binwahab.com<br />
            Phone: [Your HR Phone]<br />
            Hours: Monday - Friday, 9:00 AM - 5:00 PM [Your Timezone]
          </p>
        </div>
      </section>
    </PolicyLayout>
  )
} 