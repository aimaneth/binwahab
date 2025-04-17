import { Metadata } from "next";
import { PolicyLayout } from "@/components/layouts/PolicyLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Phone, 
  Mail, 
  MapPin, 
  Clock,
  MessagesSquare,
  Facebook,
  Instagram,
  Twitter
} from "lucide-react";

export const metadata: Metadata = {
  title: "Contact Us",
  description: "Get in touch with our team. Find our contact information, locations, and business hours.",
};

const contactMethods = [
  {
    title: "Bangi Hotline",
    icon: <Phone className="h-6 w-6" />,
    details: "+601114324225",
    description: "Our Bangi customer service team"
  },
  {
    title: "Johor Hotline",
    icon: <Phone className="h-6 w-6" />,
    details: "+60124162989",
    description: "Our Johor customer service team"
  },
  {
    title: "Email",
    icon: <Mail className="h-6 w-6" />,
    details: "support@binwahab.com",
    description: "For general inquiries and support"
  },
  {
    title: "Live Chat",
    icon: <MessagesSquare className="h-6 w-6" />,
    details: "Available on our website",
    description: "Chat with our customer service team"
  }
];

const socialMedia = [
  {
    name: "Facebook",
    icon: Facebook,
    url: "https://www.facebook.com/binwahab.kurta",
  },
  {
    name: "Instagram",
    icon: Instagram,
    url: "https://www.instagram.com/99binwahab/",
  }
];

const storeLocations = [
  {
    name: "Bangi Branch",
    address: {
      line1: "No 5-11-01 Jalan Medan Pusat Bandar 8A",
      line2: "Seksyen 9, 43650 Bandar Baru Bangi",
      line3: "Selangor, Malaysia"
    },
    mapsUrl: "https://www.google.com/maps/search/?api=1&query=No+5-11-01+Jalan+Medan+Pusat+Bandar+8A+Seksyen+9+43650+Bandar+Baru+Bangi+Selangor",
    phone: "+601114324225"
  },
  {
    name: "Johor Bahru Branch 1",
    address: {
      line1: "No 16, Jalan Padi Emas 1/5",
      line2: "Uda Business Center, Bandar Baru Uda",
      line3: "81200 Johor Bahru, Malaysia"
    },
    mapsUrl: "https://www.google.com/maps/search/?api=1&query=No+16+Jalan+Padi+Emas+1/5+Uda+Business+Center+Bandar+Baru+Uda+81200+Johor+Bahru",
    phone: "+60124162989"
  },
  {
    name: "Johor Bahru Branch 2",
    address: {
      line1: "No 23, Jalan Padi Emas 1/5",
      line2: "Uda Business Center, Bandar Baru Uda",
      line3: "81200 Johor Bahru, Malaysia"
    },
    mapsUrl: "https://www.google.com/maps/search/?api=1&query=No+23+Jalan+Padi+Emas+1/5+Uda+Business+Center+Bandar+Baru+Uda+81200+Johor+Bahru",
    phone: "+60124162989"
  }
];

export default function ContactPage() {
  return (
    <PolicyLayout
      heading="Contact Us"
      subheading="We're here to help. Reach out to us through any of these channels."
    >
      <section className="space-y-12">
        {/* Contact Methods */}
        <div className="grid gap-6 md:grid-cols-2">
          {contactMethods.map((method) => (
            <Card key={method.title}>
              <CardContent className="flex items-start space-x-4 p-6">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                  {method.icon}
                </div>
                <div>
                  <h3 className="font-semibold">{method.title}</h3>
                  <p className="text-lg font-medium mt-1">{method.details}</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    {method.description}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Business Hours */}
        <div>
          <h2 className="text-2xl font-bold tracking-tight mb-6 flex items-center gap-2">
            <Clock className="h-6 w-6" />
            Business Hours
          </h2>
          <Card>
            <CardContent className="p-6">
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold">All Branches Operating Hours</h3>
                  <p className="text-muted-foreground">
                    Monday - Friday: 10:30 AM - 7:00 PM<br />
                    Saturday - Sunday: 10:30 AM - 8:00 PM<br />
                    Public Holidays: Please contact the store
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold">Customer Service Hours</h3>
                  <p className="text-muted-foreground">
                    Monday - Friday: 10:30 AM - 7:00 PM<br />
                    Saturday - Sunday: 10:30 AM - 8:00 PM<br />
                    Public Holidays: Please contact the store
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Store Locations */}
        <div>
          <h2 className="text-2xl font-bold tracking-tight mb-6 flex items-center gap-2">
            <MapPin className="h-6 w-6" />
            Store Locations
          </h2>
          <div className="grid gap-6">
            {storeLocations.map((location) => (
              <Card key={location.name}>
                <CardContent className="p-6">
                  <div className="flex flex-col md:flex-row md:justify-between md:items-start">
                    <div>
                      <h3 className="font-semibold text-lg">{location.name}</h3>
                      <p className="text-muted-foreground mt-2">
                        {location.address.line1}<br />
                        {location.address.line2}<br />
                        {location.address.line3}
                      </p>
                      <p className="text-sm mt-2">
                        <span className="font-medium">Phone:</span> {location.phone}
                      </p>
                      <div className="mt-2 space-y-1">
                        <p className="text-sm font-medium">Operating Hours:</p>
                        <p className="text-sm text-muted-foreground">
                          Monday - Friday: 10:30 AM - 7:00 PM<br />
                          Saturday - Sunday: 10:30 AM - 8:00 PM<br />
                          Public Holidays: Please contact the store
                        </p>
                      </div>
                    </div>
                    <div className="mt-4 md:mt-0">
                      <a 
                        href={location.mapsUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <Button variant="outline" className="gap-2">
                          <MapPin className="h-4 w-4" />
                          Get Directions
                        </Button>
                      </a>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Social Media */}
        <div>
          <h2 className="text-2xl font-bold tracking-tight mb-6">Connect With Us</h2>
          <div className="flex gap-4">
            {socialMedia.map((platform) => (
              <a
                key={platform.name}
                href={platform.url}
                className="flex items-center justify-center h-12 w-12 rounded-full bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
                target="_blank"
                rel="noopener noreferrer"
              >
                <platform.icon className="h-6 w-6" />
                <span className="sr-only">{platform.name}</span>
              </a>
            ))}
          </div>
        </div>
      </section>
    </PolicyLayout>
  );
} 