import { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Footer } from "@/components/ui/footer";

export const metadata: Metadata = {
  title: "About Us | BinWahab",
  description: "Learn about BinWahab's journey in Malaysian traditional fashion",
};

export default function AboutPage() {
  return (
    <div className="min-h-screen flex flex-col bg-[#FAFAFA]">
      <main className="flex-1">
        {/* Hero Section */}
        <div className="relative bg-[#1A1A1A] text-white py-32">
          <div className="absolute inset-0 bg-[url('/images/about-hero.jpg')] bg-cover bg-center opacity-50"></div>
          <div className="absolute inset-0 bg-gradient-to-r from-black to-transparent"></div>
          <div className="relative container mx-auto px-4">
            <div className="max-w-3xl">
              <span className="inline-block text-sm uppercase tracking-wider mb-4 border border-white/20 rounded-full px-4 py-1 bg-white/10 backdrop-blur-sm">
                Our Story
              </span>
              <h1 className="text-5xl md:text-6xl font-bold tracking-tight mb-6">
                About BinWahab
              </h1>
              <p className="text-xl text-gray-300 mb-8 leading-relaxed">
                A journey of passion, tradition, and innovation in Malaysian fashion
              </p>
            </div>
          </div>
        </div>

        {/* Story Section */}
        <div className="container mx-auto px-4 py-16">
          <div className="max-w-4xl mx-auto">
            <div className="prose prose-lg max-w-none">
              <h2 className="text-3xl font-bold mb-6">Our Heritage</h2>
              <p className="mb-6">
                BinWahab is more than just a fashion brand; it's a celebration of Malaysian cultural heritage. 
                Founded with a vision to preserve and modernize traditional Malaysian fashion, we've been crafting 
                elegant pieces that bridge the gap between tradition and contemporary style.
              </p>
              
              <h2 className="text-3xl font-bold mb-6 mt-12">Our Craftsmanship</h2>
              <p className="mb-6">
                Every piece in our collection is meticulously crafted with attention to detail and respect for 
                traditional techniques. From the selection of premium fabrics to the intricate embroidery work, 
                we ensure that each garment tells a story of Malaysian craftsmanship.
              </p>
              
              <h2 className="text-3xl font-bold mb-6 mt-12">Our Vision</h2>
              <p className="mb-6">
                We envision a future where Malaysian traditional fashion is celebrated globally, where our 
                heritage is worn with pride, and where each piece we create contributes to the preservation 
                of our cultural identity.
              </p>
            </div>
          </div>
        </div>

        {/* Values Section */}
        <div className="bg-white py-16">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <h2 className="text-3xl font-bold text-center mb-12">Our Values</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="text-center">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-2xl">🎨</span>
                  </div>
                  <h3 className="text-xl font-semibold mb-2">Innovation</h3>
                  <p className="text-gray-600">Blending traditional designs with modern aesthetics</p>
                </div>
                <div className="text-center">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-2xl">🌟</span>
                  </div>
                  <h3 className="text-xl font-semibold mb-2">Quality</h3>
                  <p className="text-gray-600">Committed to excellence in every stitch</p>
                </div>
                <div className="text-center">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-2xl">💫</span>
                  </div>
                  <h3 className="text-xl font-semibold mb-2">Heritage</h3>
                  <p className="text-gray-600">Preserving and celebrating Malaysian culture</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="bg-gray-50 py-16">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl font-bold mb-6">Join Our Journey</h2>
            <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
              Experience the elegance of Malaysian traditional fashion with BinWahab
            </p>
            <Link 
              href="/shop" 
              className="inline-flex items-center px-8 py-4 bg-gray-900 text-white text-base font-medium rounded-full hover:bg-gray-800 transition-colors duration-300"
            >
              Explore Collections
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
} 