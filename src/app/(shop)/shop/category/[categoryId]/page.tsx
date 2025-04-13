import { Metadata } from "next";
import { Navbar } from "@/components/ui/navbar";
import { Footer } from "@/components/ui/footer";
import { ProductCard } from "@/components/shop/product-card";
import { ProductFilters } from "@/components/shop/product-filters";
import { SearchBar } from "@/components/shop/search-bar";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Product as PrismaProduct, Category as PrismaCategory } from "@prisma/client";
import { Product, ProductStatus } from "@/types/product";

// Fashion categories
const categories = [
  {
    id: "mens",
    name: "Men's Collection",
    description: "Discover our latest men's fashion pieces",
  },
  {
    id: "womens",
    name: "Women's Collection",
    description: "Explore our elegant women's fashion line",
  },
  {
    id: "accessories",
    name: "Accessories",
    description: "Complete your look with our accessories",
  },
  {
    id: "new-arrivals",
    name: "New Arrivals",
    description: "Be the first to shop our newest styles",
  },
  {
    id: "sale",
    name: "Sale",
    description: "Limited time offers on selected items",
  },
  {
    id: "sustainable",
    name: "Sustainable Fashion",
    description: "Eco-friendly and ethically made pieces",
  },
];

// Sample fashion products data
const products = {
  mens: [
    {
      id: "m1",
      name: "Classic Oxford Shirt",
      price: 89.99,
      images: ["/images/products/mens/oxford-shirt.jpg"],
      category: { name: "Men's Collection" },
    },
    {
      id: "m2",
      name: "Slim Fit Blazer",
      price: 199.99,
      images: ["/images/products/mens/blazer.jpg"],
      category: { name: "Men's Collection" },
    },
    {
      id: "m3",
      name: "Tailored Trousers",
      price: 129.99,
      images: ["/images/products/mens/trousers.jpg"],
      category: { name: "Men's Collection" },
    },
    {
      id: "m4",
      name: "Cashmere Sweater",
      price: 159.99,
      images: ["/images/products/mens/sweater.jpg"],
      category: { name: "Men's Collection" },
    },
    {
      id: "m5",
      name: "Leather Derby Shoes",
      price: 179.99,
      images: ["/images/products/mens/shoes.jpg"],
      category: { name: "Men's Collection" },
    },
    {
      id: "m6",
      name: "Wool Coat",
      price: 299.99,
      images: ["/images/products/mens/coat.jpg"],
      category: { name: "Men's Collection" },
    },
  ],
  womens: [
    {
      id: "w1",
      name: "Silk Blouse",
      price: 129.99,
      images: ["/images/products/womens/blouse.jpg"],
      category: { name: "Women's Collection" },
    },
    {
      id: "w2",
      name: "Tailored Blazer",
      price: 189.99,
      images: ["/images/products/womens/blazer.jpg"],
      category: { name: "Women's Collection" },
    },
    {
      id: "w3",
      name: "A-Line Dress",
      price: 159.99,
      images: ["/images/products/womens/dress.jpg"],
      category: { name: "Women's Collection" },
    },
    {
      id: "w4",
      name: "High-Waisted Pants",
      price: 139.99,
      images: ["/images/products/womens/pants.jpg"],
      category: { name: "Women's Collection" },
    },
    {
      id: "w5",
      name: "Cashmere Cardigan",
      price: 179.99,
      images: ["/images/products/womens/cardigan.jpg"],
      category: { name: "Women's Collection" },
    },
    {
      id: "w6",
      name: "Leather Pumps",
      price: 149.99,
      images: ["/images/products/womens/pumps.jpg"],
      category: { name: "Women's Collection" },
    },
  ],
  accessories: [
    {
      id: "a1",
      name: "Leather Tote Bag",
      price: 199.99,
      images: ["/images/products/accessories/tote.jpg"],
      category: { name: "Accessories" },
    },
    {
      id: "a2",
      name: "Silk Scarf",
      price: 79.99,
      images: ["/images/products/accessories/scarf.jpg"],
      category: { name: "Accessories" },
    },
    {
      id: "a3",
      name: "Gold-Plated Watch",
      price: 249.99,
      images: ["/images/products/accessories/watch.jpg"],
      category: { name: "Accessories" },
    },
    {
      id: "a4",
      name: "Leather Belt",
      price: 89.99,
      images: ["/images/products/accessories/belt.jpg"],
      category: { name: "Accessories" },
    },
    {
      id: "a5",
      name: "Designer Sunglasses",
      price: 159.99,
      images: ["/images/products/accessories/sunglasses.jpg"],
      category: { name: "Accessories" },
    },
    {
      id: "a6",
      name: "Pearl Necklace",
      price: 129.99,
      images: ["/images/products/accessories/necklace.jpg"],
      category: { name: "Accessories" },
    },
  ],
  "new-arrivals": [
    {
      id: "n1",
      name: "Limited Edition Jacket",
      price: 299.99,
      images: ["/images/products/new-arrivals/jacket.jpg"],
      category: { name: "New Arrivals" },
    },
    {
      id: "n2",
      name: "Designer Handbag",
      price: 399.99,
      images: ["/images/products/new-arrivals/handbag.jpg"],
      category: { name: "New Arrivals" },
    },
    {
      id: "n3",
      name: "Exclusive Dress",
      price: 259.99,
      images: ["/images/products/new-arrivals/dress.jpg"],
      category: { name: "New Arrivals" },
    },
  ],
  sale: [
    {
      id: "s1",
      name: "Summer Dress",
      price: 79.99,
      images: ["/images/products/sale/dress.jpg"],
      category: { name: "Sale" },
    },
    {
      id: "s2",
      name: "Casual Shirt",
      price: 49.99,
      images: ["/images/products/sale/shirt.jpg"],
      category: { name: "Sale" },
    },
    {
      id: "s3",
      name: "Leather Wallet",
      price: 39.99,
      images: ["/images/products/sale/wallet.jpg"],
      category: { name: "Sale" },
    },
  ],
  sustainable: [
    {
      id: "su1",
      name: "Organic Cotton T-Shirt",
      price: 49.99,
      images: ["/images/products/sustainable/tshirt.jpg"],
      category: { name: "Sustainable Fashion" },
    },
    {
      id: "su2",
      name: "Recycled Denim Jeans",
      price: 129.99,
      images: ["/images/products/sustainable/jeans.jpg"],
      category: { name: "Sustainable Fashion" },
    },
    {
      id: "su3",
      name: "Eco-Friendly Sweater",
      price: 119.99,
      images: ["/images/products/sustainable/sweater.jpg"],
      category: { name: "Sustainable Fashion" },
    },
  ],
};

interface ProductWithCategories extends Product {
  category: {
    id: string;
    name: string;
    description: string;
    isActive: boolean;
    order: number;
    slug: string;
    image: string | null;
    createdAt: Date;
    updatedAt: Date;
    parentId: string | null;
    seoTitle: string | null;
    seoDescription: string | null;
    seoKeywords: string | null;
  } | null;
  options?: Record<string, string>;
}

export async function generateMetadata({ params }: { params: { categoryId: string } }): Promise<Metadata> {
  const category = await prisma.category.findUnique({
    where: {
      id: params.categoryId,
    },
  });

  if (!category) {
    return {
      title: "Category Not Found - BINWAHAB",
    };
  }

  return {
    title: `${category.name} - BINWAHAB`,
    description: category.description || undefined,
  };
}

export default async function CategoryPage({ params }: { params: { categoryId: string } }) {
  const category = await prisma.category.findUnique({
    where: {
      id: params.categoryId,
    },
    include: {
      products: {
        where: {
          status: "ACTIVE",
        },
        include: {
          category: true,
          images: true,
          variants: true,
        },
      },
    },
  });

  if (!category) {
    notFound();
  }

  // Fetch all categories for the filters
  const categories = await prisma.category.findMany({
    where: {
      isActive: true,
    },
    orderBy: {
      order: 'asc',
    },
  });

  // Convert Prisma products to our Product type
  const productsWithCategories = category.products.map((product) => ({
    id: product.id,
    name: product.name,
    description: product.description || "",
    descriptionHtml: product.descriptionHtml || "",
    handle: product.slug || "",
    slug: product.slug || "",
    status: product.status as ProductStatus,
    price: Number(product.price),
    stock: product.stock || 0,
    reservedStock: product.reservedStock || 0,
    isActive: product.isActive,
    image: product.images[0]?.url || "",
    sku: product.sku || "",
    inventoryTracking: product.inventoryTracking || false,
    images: product.images.map(img => ({
      id: img.id,
      url: img.url,
      order: img.order,
    })),
    variants: product.variants.map(variant => ({
      id: variant.id,
      name: variant.name,
      price: Number(variant.price),
      compareAtPrice: variant.compareAtPrice ? Number(variant.compareAtPrice) : null,
      stock: variant.stock,
      isActive: variant.isActive,
      images: variant.images as string[],
      attributes: variant.options as Record<string, string>,
    })),
    category: product.category ? {
      id: product.category.id,
      name: product.category.name,
      description: product.category.description || "",
      isActive: product.category.isActive,
      order: product.category.order,
      slug: product.category.slug || "",
      image: product.category.image || null,
      createdAt: product.category.createdAt,
      updatedAt: product.category.updatedAt,
      parentId: product.category.parentId,
      seoTitle: product.category.seoTitle || null,
      seoDescription: product.category.seoDescription || null,
      seoKeywords: product.category.seoKeywords || null,
    } : null,
    createdAt: product.createdAt,
    updatedAt: product.updatedAt,
    seo: {
      title: product.name,
      description: product.description || "",
    },
  })) as unknown as ProductWithCategories[];

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Navbar />
      
      <main className="flex-1">
        {/* Collection Header */}
        <div className="bg-black text-white py-12">
          <div className="container mx-auto px-4">
            <h1 className="text-3xl md:text-4xl font-bold mb-4">{category.name}</h1>
            {category.description && (
              <p className="text-lg text-gray-300 max-w-2xl">{category.description}</p>
            )}
          </div>
        </div>

        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col gap-8">
            {/* Search and Filters Header */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center">
                <span className="text-sm text-gray-500">
                  {category.products.length} items
                </span>
              </div>
              <SearchBar />
            </div>

            <div className="flex flex-col gap-8 lg:flex-row">
              {/* Filters Sidebar */}
              <div className="w-full lg:w-64">
                <ProductFilters categories={categories} />
              </div>

              {/* Product Grid */}
              <div className="flex-1">
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {productsWithCategories.map((product) => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
} 