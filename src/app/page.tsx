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

interface Product {
  id: string;
  name: string;
  price: number;
  slug: string;
  images: { url: string }[];
  category: {
    id: string;
    name: string;
  };
}

interface Collection {
  id: string;
  name: string;
  description: string | null;
  image: string | null;
  image2: string | null;
  slug: string;
  products: Product[];
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
      <section className="relative h-screen w-full">
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
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center p-8">
                  <div className="text-center text-white space-y-4 max-w-xl">
                    <h2 className="text-3xl md:text-4xl font-bold">{featuredCollections[0].name}</h2>
                    <p className="text-lg line-clamp-2">{featuredCollections[0].description}</p>
                    <Button size="lg" variant="outline" className="bg-white text-black hover:bg-white/90" asChild>
                      <Link href={`/collections/${featuredCollections[0].slug}`}>
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
      <section className="py-16 px-4 md:px-6 bg-muted/30">
        <div className="container mx-auto">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-3xl font-bold">Featured Collections</h2>
            <Button variant="outline" asChild>
              <Link href="/collections">View All Collections</Link>
            </Button>
          </div>
          {isLoading ? (
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
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
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
              {featuredCollections.flatMap(collection => 
                collection.products.map(product => {
                  const imageUrl = product.images && product.images.length > 0 
                    ? product.images[0].url 
                    : "/images/fallback-product.jpg";
                  
                  return (
                    <Card key={product.id} className="overflow-hidden">
                      <Link href={`/shop/products/${product.slug || `product-${product.id}`}`}>
                        <div className="relative aspect-[3/4]">
                          <ImageWithFallback
                            src={imageUrl}
                            alt={product.name}
                            fill
                            className="object-cover"
                            type="product"
                          />
                        </div>
                      </Link>
                      <CardContent className="p-4">
                        <Link href={`/shop/products/${product.slug || `product-${product.id}`}`}>
                          <h3 className="font-semibold hover:underline">{product.name}</h3>
                        </Link>
                        <p className="mt-2 font-semibold">{formatPrice(product.price)}</p>
                      </CardContent>
                      <CardFooter className="p-4 pt-0">
                        <Button className="w-full" asChild>
                          <Link href={`/shop/products/${product.slug || `product-${product.id}`}`}>View Details</Link>
                        </Button>
                      </CardFooter>
                    </Card>
                  );
                })
              )}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No featured collections available.</p>
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
                      <Link href={`/collections/${completeCollections[0].slug}`}>
                        Explore Collection
                      </Link>
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="w-full h-full bg-muted flex items-center justify-center">
            <p className="text-muted-foreground">No complete collections available.</p>
          </div>
        )}
      </section>

      {/* Complete Collections Products */}
      <section className="py-16 px-4 md:px-6">
        <div className="container mx-auto">
          {isLoading ? (
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
              {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
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
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
              {completeCollections.flatMap(collection => 
                collection.products.map(product => {
                  const imageUrl = product.images && product.images.length > 0 
                    ? product.images[0].url 
                    : "/images/fallback-product.jpg";
                  
                  return (
                    <Card key={product.id} className="overflow-hidden">
                      <Link href={`/shop/products/${product.slug || `product-${product.id}`}`}>
                        <div className="relative aspect-[3/4]">
                          <ImageWithFallback
                            src={imageUrl}
                            alt={product.name}
                            fill
                            className="object-cover"
                            type="product"
                          />
                        </div>
                      </Link>
                      <CardContent className="p-4">
                        <Link href={`/shop/products/${product.slug || `product-${product.id}`}`}>
                          <h3 className="font-semibold hover:underline">{product.name}</h3>
                        </Link>
                        <p className="mt-2 font-semibold">{formatPrice(product.price)}</p>
                      </CardContent>
                      <CardFooter className="p-4 pt-0">
                        <Button className="w-full" asChild>
                          <Link href={`/shop/products/${product.slug || `product-${product.id}`}`}>View Details</Link>
                        </Button>
                      </CardFooter>
                    </Card>
                  );
                })
              )}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No complete collections available.</p>
            </div>
          )}
        </div>
      </section>

      {/* Store Locations Section */}
      <section className="w-full py-12 md:py-24 lg:py-32 bg-gray-50">
        <div className="container px-4 md:px-6">
          <div className="flex flex-col items-center justify-center space-y-4 text-center">
            <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">Our Store Locations</h2>
            <p className="max-w-[700px] text-gray-500 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed dark:text-gray-400">
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
                  href="https://maps.google.com"
                  className="mt-4 inline-flex items-center text-sm text-blue-600 hover:text-blue-800"
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
                  href="https://maps.google.com"
                  className="mt-4 inline-flex items-center text-sm text-blue-600 hover:text-blue-800"
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
                  href="https://maps.google.com"
                  className="mt-4 inline-flex items-center text-sm text-blue-600 hover:text-blue-800"
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
      <section className="py-16 px-4 md:px-6 bg-primary text-primary-foreground">
        <div className="container mx-auto text-center space-y-4">
          <h2 className="text-3xl font-bold">Stay Updated</h2>
          <p className="text-lg">Subscribe to our newsletter for the latest updates and offers</p>
          <div className="max-w-md mx-auto flex gap-2">
            <input
              type="email"
              placeholder="Enter your email"
              className="flex-1 px-4 py-2 rounded-md text-black"
            />
            <Button variant="secondary">Subscribe</Button>
          </div>
        </div>
      </section>
    </div>
  );
}
