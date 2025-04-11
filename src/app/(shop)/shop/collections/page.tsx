import { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight } from "lucide-react";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = {
  title: "Collections | BinWahab",
  description: "Explore BinWahab's curated fashion collections",
};

async function getCollections() {
  const collections = await prisma.collection.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      products: {
        select: {
          product: {
            select: {
              id: true,
            }
          }
        }
      }
    }
  });
  
  return collections.map(collection => ({
    id: collection.id,
    name: collection.name,
    description: collection.description,
    image: collection.image,
    productCount: collection.products.length,
  }));
}

export default async function CollectionsPage() {
  const collections = await getCollections();

  return (
    <div className="min-h-screen flex flex-col bg-[#FAFAFA]">
      <main className="flex-1">
        {/* Hero Section */}
        <div className="relative bg-[#1A1A1A] text-white py-32">
          <div className="absolute inset-0 bg-[url('/images/collections-hero.jpg')] bg-cover bg-center opacity-50"></div>
          <div className="absolute inset-0 bg-gradient-to-r from-black to-transparent"></div>
          <div className="relative container mx-auto px-4">
            <div className="max-w-3xl">
              <span className="inline-block text-sm uppercase tracking-wider mb-4 border border-white/20 rounded-full px-4 py-1 bg-white/10 backdrop-blur-sm">
                Curated Collections
              </span>
              <h1 className="text-5xl md:text-6xl font-bold tracking-tight mb-6">
                Special Collections
              </h1>
              <p className="text-xl text-gray-300 mb-8 leading-relaxed">
                Discover our carefully curated collections, each telling a unique story and designed for specific occasions
              </p>
            </div>
          </div>
        </div>

        {/* Collections Grid */}
        <div className="container mx-auto px-4 py-16">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {collections.map((collection) => (
              <Link 
                key={collection.id} 
                href={`/shop/collection/${collection.id}`}
                className="group relative overflow-hidden rounded-xl bg-white border border-gray-100 hover:border-gray-200 transition-all duration-300 hover:shadow-xl"
              >
                <div className="aspect-h-1 aspect-w-1 w-full overflow-hidden bg-gray-100">
                  <div className="h-80 w-full relative">
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent z-10"></div>
                    <div className="absolute inset-0 bg-black/20 group-hover:bg-black/30 transition-colors duration-300 z-10"></div>
                    {collection.image ? (
                      <Image
                        src={collection.image}
                        alt={collection.name}
                        fill
                        className="object-cover object-center group-hover:scale-105 transition-transform duration-700"
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-gray-400 text-4xl">📦</span>
                      </div>
                    )}
                  </div>
                </div>
                <div className="absolute bottom-0 left-0 right-0 p-6 z-20">
                  <h2 className="text-2xl font-semibold text-white mb-2">{collection.name}</h2>
                  {collection.description && (
                    <p className="text-gray-200 mb-4">{collection.description}</p>
                  )}
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-300">{collection.productCount} items</span>
                    <span className="inline-flex items-center text-sm font-medium text-white bg-white/20 backdrop-blur-sm rounded-full px-4 py-2 group-hover:bg-white group-hover:text-gray-900 transition-all duration-300">
                      View Collection
                      <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
} 