"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { formatPrice } from "@/lib/utils";
import { ImageWithFallback } from "@/components/ui/image-with-fallback";
import { CollectionCard } from "@/components/collections/collection-card";
import { MapPin, ArrowRight } from "lucide-react";
import { ProductCard } from "@/components/shop/product-card";
import { Product as FullProduct } from "@/types/product";

interface Collection {
  id: string;
  name: string;
  description: string | null;
  image: string | null;
  image2: string | null;
  handle: string;
  products: FullProduct[];
}

const DEFAULT_COLLECTION_IMAGE = "/images/fallback-collection.jpg";

export default function HomePage() {
  const [featuredCollections, setFeaturedCollections] = useState<Collection[]>([]);
  const [completeCollections, setCompleteCollections] = useState<Collection[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        const [featuredCollectionsRes, completeCollectionsRes] = await Promise.all([
          fetch("/api/collections?section=FEATURED"),
          fetch("/api/collections?section=COMPLETE")
        ]);

        if (!featuredCollectionsRes.ok || !completeCollectionsRes.ok) {
          throw new Error("Failed to fetch data");
        }

        const [featuredCollectionsData, completeCollectionsData] = await Promise.all([
          featuredCollectionsRes.json(),
          completeCollectionsRes.json()
        ]);

        setFeaturedCollections(featuredCollectionsData || []);
        setCompleteCollections(completeCollectionsData || []);
      } catch (error) {
        console.error("Error fetching data:", error);
        setError("Failed to load content. Please try again later.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-red-600 mb-2">Error</h2>
          <p className="text-gray-600">{error}</p>
          <Button 
            onClick={() => window.location.reload()} 
            className="mt-4"
          >
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Banner with Featured Collections */}
      <section className="relative h-[60vh] sm:h-[70vh] w-full">
        {isLoading ? (
          <div className="w-full h-full bg-muted animate-pulse" />
        ) : featuredCollections.length > 0 ? (
          <div className="h-full">
            {featuredCollections[0] && (
              <div className="relative h-full">
                <div className="flex h-full">
                  <div className="w-1/2 h-full">
                    <ImageWithFallback
                      src={featuredCollections[0].image ?? DEFAULT_COLLECTION_IMAGE}
                      alt={featuredCollections[0].name}
                      width={1920}
                      height={1080}
                      className="w-full h-full object-cover"
                      type="collection"
                      priority
                    />
                  </div>
                  {featuredCollections[0].image2 && (
                    <div className="w-1/2 h-full">
                      <ImageWithFallback
                        src={featuredCollections[0].image2}
                        alt={`${featuredCollections[0].name} - Secondary`}
                        width={1920}
                        height={1080}
                        className="w-full h-full object-cover"
                        type="collection"
                      />
                    </div>
                  )}
                </div>
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center p-6 sm:p-8">
                  <div className="text-center text-white space-y-3 sm:space-y-4 max-w-xl">
                    <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold">{featuredCollections[0].name}</h2>
                    <p className="text-base sm:text-lg line-clamp-2">{featuredCollections[0].description}</p>
                    <Button size="lg" variant="outline" className="bg-white text-black hover:bg-white/90" asChild>
                      <Link href={`/collections/${featuredCollections[0].handle}`}>
                        Shop Now
                      </Link>
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="w-full h-full bg-muted flex items-center justify-center">
            <p className="text-muted-foreground">No featured collections available.</p>
          </div>
        )}
      </section>

      {/* Featured Collections Products */}
      <section className="py-16 px-2 sm:px-4 md:px-6 bg-muted/30">
        <div className="container px-0">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-0 sm:justify-between mb-8 px-2 sm:px-0">
            <h2 className="text-2xl sm:text-3xl font-bold">Featured Collections</h2>
            <Button variant="outline" size="sm" className="w-full sm:w-auto" asChild>
              <Link href="/collections">View All Collections</Link>
            </Button>
          </div>
          {isLoading ? (
            <div className="grid grid-cols-2 gap-x-4 gap-y-8 md:grid-cols-3 lg:grid-cols-4 md:gap-x-6 md:gap-y-10">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="animate-pulse">
                  <div className="aspect-square bg-gray-200 rounded-lg" />
                  <div className="mt-4 space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-3/4" />
                    <div className="h-3 bg-gray-200 rounded w-1/2" />
                    <div className="h-4 bg-gray-200 rounded w-1/4" />
                  </div>
                </div>
              ))}
            </div>
          ) : featuredCollections.length > 0 ? (
            <div className="grid grid-cols-2 gap-x-4 gap-y-8 md:grid-cols-3 lg:grid-cols-4 md:gap-x-6 md:gap-y-10">
              {featuredCollections.flatMap(collection => 
                collection.products.map(product => (
                  <ProductCard key={product.id} product={product} />
                ))
              )}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No featured products available.</p>
            </div>
          )}
        </div>
      </section>

      {/* Complete Collections Banner */}
      <section className="relative h-[80vh] w-full">
        {isLoading ? (
          <div className="w-full h-full bg-muted animate-pulse" />
        ) : completeCollections.length > 0 ? (
          <div className="h-full">
            <div className="relative h-full">
              <ImageWithFallback
                src={completeCollections[0].image ?? DEFAULT_COLLECTION_IMAGE}
                alt={completeCollections[0].name}
                width={1920}
                height={1080}
                className="w-full h-full object-cover"
                type="collection"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-black/70 to-black/40 flex items-center">
                <div className="container mx-auto px-4 md:px-6">
                  <div className="max-w-xl text-white space-y-4">
                    <h2 className="text-4xl md:text-5xl font-bold">{completeCollections[0].name}</h2>
                    <p className="text-lg md:text-xl line-clamp-2">{completeCollections[0].description}</p>
                    <Button size="lg" variant="outline" className="bg-white text-black hover:bg-white/90" asChild>
                      <Link href={`/collections/${completeCollections[0].handle}`}>
                        View Collection
                      </Link>
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="w-full h-full bg-muted flex items-center justify-center">
            <p className="text-muted-foreground">No best selling available.</p>
          </div>
        )}
      </section>

      {/* New Arrival Products */}
      <section className="py-16 px-2 sm:px-4 md:px-6">
        <div className="container px-0">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-0 sm:justify-between mb-8 px-2 sm:px-0">
            <h2 className="text-2xl sm:text-3xl font-bold">Best Selling</h2>
            <Button variant="outline" size="sm" className="w-full sm:w-auto" asChild>
              <Link href="/collections">View All Best Sellings</Link>
            </Button>
          </div>
          {isLoading ? (
            <div className="grid grid-cols-2 gap-x-4 gap-y-8 md:grid-cols-3 lg:grid-cols-4 md:gap-x-6 md:gap-y-10">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="animate-pulse">
                  <div className="aspect-square bg-gray-200 rounded-lg" />
                  <div className="mt-4 space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-3/4" />
                    <div className="h-3 bg-gray-200 rounded w-1/2" />
                    <div className="h-4 bg-gray-200 rounded w-1/4" />
                  </div>
                </div>
              ))}
            </div>
          ) : completeCollections.length > 0 ? (
            <div className="grid grid-cols-2 gap-x-4 gap-y-8 md:grid-cols-3 lg:grid-cols-4 md:gap-x-6 md:gap-y-10">
              {completeCollections.flatMap(collection => 
                collection.products.map(product => (
                  <ProductCard key={product.id} product={product} />
                ))
              ).slice(0, 4)}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No new arrivals available.</p>
            </div>
          )}
        </div>
      </section>

      {/* Store Locations Section */}
      <section className="w-full py-12 md:py-24 lg:py-32 bg-background">
        <div className="container px-4 md:px-6">
          <div className="flex flex-col items-center justify-center space-y-4 text-center">
            <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl text-foreground">Our Store Locations</h2>
            <p className="max-w-[700px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
              Visit us at any of our branches to experience our products in person
            </p>
          </div>
          <div className="mx-auto grid max-w-5xl grid-cols-1 gap-6 py-12 md:grid-cols-2 lg:grid-cols-3">
            <Card className="overflow-hidden">
              <div className="relative h-48 w-full">
                <img
                  src="/branch-images/bangi-branch.jpg"
                  alt="Bangi Branch"
                  className="h-full w-full object-cover"
                />
              </div>
              <CardContent className="p-4">
                <h3 className="text-xl font-bold">Bangi Branch</h3>
                <p className="mt-2 text-sm text-gray-600">
                  No 5-11-01 Jalan Medan Pusat Bandar 8A, Seksyen 9, 43650 Bandar Baru Bangi, Selangor
                </p>
                <p className="mt-2 text-sm text-gray-600">+601114324225</p>
                <Link
                  href="https://maps.app.goo.gl/6T5AEVPZfQSp8wwT8"
                  className="mt-4 inline-flex items-center text-sm text-blue-600 hover:text-blue-800"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <MapPin className="mr-2 h-4 w-4" />
                  Get Directions
                </Link>
              </CardContent>
            </Card>
            <Card className="overflow-hidden">
              <div className="relative h-48 w-full">
                <img
                  src="/branch-images/johor-branch-1.jpg"
                  alt="Johor Bahru Branch 1"
                  className="h-full w-full object-cover"
                />
              </div>
              <CardContent className="p-4">
                <h3 className="text-xl font-bold">Johor Bahru Branch 1</h3>
                <p className="mt-2 text-sm text-gray-600">
                  No 16, Jalan Padi Emas 1/5, Uda Business Center, Bandar Baru Uda, 81200 Johor Bahru
                </p>
                <p className="mt-2 text-sm text-gray-600">+60124162989</p>
                <Link
                  href="https://maps.app.goo.gl/5zkh3fCmjFdALW4F6"
                  className="mt-4 inline-flex items-center text-sm text-blue-600 hover:text-blue-800"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <MapPin className="mr-2 h-4 w-4" />
                  Get Directions
                </Link>
              </CardContent>
            </Card>
            <Card className="overflow-hidden">
              <div className="relative h-48 w-full">
                <img
                  src="/branch-images/johor-branch-2.jpg"
                  alt="Johor Bahru Branch 2"
                  className="h-full w-full object-cover"
                />
              </div>
              <CardContent className="p-4">
                <h3 className="text-xl font-bold">Johor Bahru Branch 2</h3>
                <p className="mt-2 text-sm text-gray-600">
                  No 23, Jalan Padi Emas 1/5, Uda Business Center, Bandar Baru Uda, 81200 Johor Bahru
                </p>
                <p className="mt-2 text-sm text-gray-600">+60124162989</p>
                <Link
                  href="https://maps.app.goo.gl/w8t2UNRc7wFWm8DaA"
                  className="mt-4 inline-flex items-center text-sm text-blue-600 hover:text-blue-800"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <MapPin className="mr-2 h-4 w-4" />
                  Get Directions
                </Link>
              </CardContent>
            </Card>
          </div>
          <div className="flex justify-center">
            <Link href="/contact">
              <Button variant="outline" className="gap-2">
                View More Details
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Newsletter Section */}
      <section className="py-16 px-4 md:px-6 bg-primary">
        <div className="container mx-auto text-center space-y-4">
          <h2 className="text-3xl font-bold text-primary-foreground">Stay Updated</h2>
          <p className="text-lg text-primary-foreground/90">Subscribe to our newsletter for the latest updates and offers</p>
          <div className="max-w-md mx-auto flex gap-2">
            <input
              type="email"
              placeholder="Enter your email"
              className="flex-1 px-4 py-2 rounded-md bg-background text-foreground"
            />
            <Button variant="secondary">Subscribe</Button>
          </div>
        </div>
      </section>
    </div>
  );
}
