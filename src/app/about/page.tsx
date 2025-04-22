import { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "About Us | BinWahab",
  description: "Learn about BinWahab's journey in Malaysian traditional fashion",
};

export default function AboutPage() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <main className="flex-1">
        {/* Hero Section */}
        <div className="relative bg-primary text-primary-foreground py-24 sm:py-32">
          <div className="absolute inset-0 bg-[url('/images/about-hero.jpg')] bg-cover bg-center opacity-50"></div>
          <div className="absolute inset-0 bg-gradient-to-r from-primary to-transparent"></div>
          <div className="relative container mx-auto px-4 md:px-6">
            <div className="max-w-3xl">
              <span className="inline-block text-sm uppercase tracking-wider mb-4 border border-primary-foreground/20 rounded-full px-4 py-1 bg-primary-foreground/10 backdrop-blur-sm">
                Our Story
              </span>
              <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight mb-6">
                About BinWahab
              </h1>
              <p className="text-lg sm:text-xl text-primary-foreground/90 mb-8 leading-relaxed">
                A journey of passion, tradition, and innovation in Malaysian fashion
              </p>
            </div>
          </div>
        </div>

        {/* Story Section */}
        <div className="container mx-auto px-4 md:px-6 py-12 sm:py-16">
          <div className="max-w-4xl mx-auto">
            <div className="prose prose-lg dark:prose-invert max-w-none">
              <h2 className="text-2xl sm:text-3xl font-bold mb-6 text-foreground">Our Heritage</h2>
              <p className="mb-6 text-muted-foreground">
                BinWahab is more than just a fashion brand; it's a celebration of Malaysian cultural heritage. 
                Founded with a vision to preserve and modernize traditional Malaysian fashion, we've been crafting 
                elegant pieces that bridge the gap between tradition and contemporary style.
              </p>
              
              <h2 className="text-2xl sm:text-3xl font-bold mb-6 mt-12 text-foreground">Our Craftsmanship</h2>
              <p className="mb-6 text-muted-foreground">
                Every piece in our collection is meticulously crafted with attention to detail and respect for 
                traditional techniques. From the selection of premium fabrics to the intricate embroidery work, 
                we ensure that each garment tells a story of Malaysian craftsmanship.
              </p>
              
              <h2 className="text-2xl sm:text-3xl font-bold mb-6 mt-12 text-foreground">Our Vision</h2>
              <p className="mb-6 text-muted-foreground">
                We envision a future where Malaysian traditional fashion is celebrated globally, where our 
                heritage is worn with pride, and where each piece we create contributes to the preservation 
                of our cultural identity.
              </p>
            </div>
          </div>
        </div>

        {/* Values Section */}
        <div className="bg-muted/30 py-12 sm:py-16">
          <div className="container mx-auto px-4 md:px-6">
            <div className="max-w-4xl mx-auto">
              <h2 className="text-2xl sm:text-3xl font-bold text-center mb-12 text-foreground">Our Values</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="text-center">
                  <div className="w-16 h-16 bg-background rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
                    <span className="text-2xl">🎨</span>
                  </div>
                  <h3 className="text-xl font-semibold mb-2 text-foreground">Innovation</h3>
                  <p className="text-muted-foreground">Blending traditional designs with modern aesthetics</p>
                </div>
                <div className="text-center">
                  <div className="w-16 h-16 bg-background rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
                    <span className="text-2xl">🌟</span>
                  </div>
                  <h3 className="text-xl font-semibold mb-2 text-foreground">Quality</h3>
                  <p className="text-muted-foreground">Committed to excellence in every stitch</p>
                </div>
                <div className="text-center">
                  <div className="w-16 h-16 bg-background rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
                    <span className="text-2xl">💫</span>
                  </div>
                  <h3 className="text-xl font-semibold mb-2 text-foreground">Heritage</h3>
                  <p className="text-muted-foreground">Preserving and celebrating Malaysian culture</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="bg-background py-12 sm:py-16 border-t">
          <div className="container mx-auto px-4 md:px-6 text-center">
            <h2 className="text-2xl sm:text-3xl font-bold mb-6 text-foreground">Join Our Journey</h2>
            <p className="text-lg sm:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Experience the elegance of Malaysian traditional fashion with BinWahab
            </p>
            <Button size="lg" className="gap-2" asChild>
              <Link href="/shop">
                Explore Collections
                <ArrowRight className="h-5 w-5" />
              </Link>
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
} 