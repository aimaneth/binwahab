import { Metadata } from "next";
import { Navbar } from "@/components/ui/navbar";
import { Footer } from "@/components/ui/footer";
import { CollectionProductCard } from "@/components/shop/collection-product-card";
import { ProductFilters } from "@/components/shop/product-filters";
import { SearchBar } from "@/components/shop/search-bar";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Product, Category, ProductCollection } from "@prisma/client";

interface ProductWithCategory {
  id: string;
  name: string;
  price: number;
  image: string | null;
  slug: string;
  category: {
    name: string;
  };
}

type CollectionWithProducts = {
  id: string;
  name: string;
  description: string | null;
  image: string | null;
  products: ProductWithCategory[];
};

async function getCollection(collectionId: string): Promise<CollectionWithProducts | null> {
  const collection = await prisma.collection.findUnique({
    where: { id: collectionId },
    include: {
      products: {
        include: {
          product: {
            include: {
              category: true,
            }
          }
        }
      }
    }
  });

  if (!collection) {
    return null;
  }

  // Filter out products with null categories and convert to CollectionProduct type
  const validProducts = collection.products
    .filter(pc => pc.product.category !== null && pc.product.slug !== null)
    .map(pc => ({
      id: pc.product.id.toString(),
      name: pc.product.name,
      price: Number(pc.product.price),
      image: pc.product.image,
      slug: pc.product.slug!,
      category: {
        name: pc.product.category!.name
      }
    } satisfies ProductWithCategory));

  return {
    id: collection.id,
    name: collection.name,
    description: collection.description,
    image: collection.image,
    products: validProducts
  };
}

export async function generateMetadata({ params }: { params: { collectionId: string } }): Promise<Metadata> {
  const collection = await getCollection(params.collectionId);
  
  if (!collection) {
    return {
      title: "Collection Not Found | BinWahab",
      description: "The requested collection could not be found",
    };
  }
  
  return {
    title: `${collection.name} | BinWahab`,
    description: collection.description || `Browse our ${collection.name} collection`,
  };
}

export default async function CollectionPage({ params }: { params: { collectionId: string } }) {
  const collection = await getCollection(params.collectionId);
  
  if (!collection) {
    notFound();
  }

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Navbar />
      
      <main className="flex-1">
        {/* Collection Header */}
        <div className="bg-black text-white py-12">
          <div className="container mx-auto px-4">
            <h1 className="text-3xl md:text-4xl font-bold mb-4">{collection.name}</h1>
            {collection.description && (
              <p className="text-lg text-gray-300 max-w-2xl">{collection.description}</p>
            )}
          </div>
        </div>

        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col gap-8">
            {/* Search and Filters Header */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <SearchBar />
              <ProductFilters />
            </div>

            {/* Products Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {collection.products.map((product) => (
                <CollectionProductCard key={product.id} product={product} />
              ))}
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
} 