import { notFound } from 'next/navigation';
import { Metadata } from 'next';

// ISR Configuration for product pages
export const revalidate = 60; // Revalidate every 60 seconds

interface ProductPageProps {
  params: {
    slug: string;
  };
}

// Generate static params for popular products
export async function generateStaticParams() {
  // Generate static pages for most popular products
  const popularProducts = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/products/popular`)
    .then(res => res.json())
    .catch(() => []);
  
  return popularProducts.map((product: any) => ({
    slug: product.slug,
  }));
}

// Generate metadata with ISR
export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const product = await getProduct(params.slug);
  
  if (!product) {
    return {
      title: 'Product Not Found',
    };
  }

  return {
    title: `${product.title} - BINWAHAB`,
    description: product.description,
    openGraph: {
      title: product.title,
      description: product.description,
      images: product.images?.map((img: any) => img.url) || [],
    },
  };
}

async function getProduct(slug: string) {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/products/${slug}`, {
      // Enable ISR caching
      next: { 
        revalidate: 60, // Cache for 60 seconds
        tags: [`product-${slug}`] // Enable tag-based revalidation
      }
    });
    
    if (!response.ok) {
      return null;
    }
    
    return response.json();
  } catch (error) {
    console.error('Error fetching product:', error);
    return null;
  }
}

export default async function ProductPage({ params }: ProductPageProps) {
  const product = await getProduct(params.slug);

  if (!product) {
    notFound();
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid md:grid-cols-2 gap-8">
        {/* Product images with optimized loading */}
        <div className="space-y-4">
          {product.images?.map((image: any, index: number) => (
            <div key={index} className="aspect-square relative">
              <OptimizedImage
                src={image.url}
                alt={`${product.title} - Image ${index + 1}`}
                fill
                priority={index === 0} // Prioritize first image
                sizes="(max-width: 768px) 100vw, 50vw"
                quality={90}
              />
            </div>
          ))}
        </div>

        {/* Product details */}
        <div className="space-y-6">
          <h1 className="text-3xl font-bold">{product.title}</h1>
          <p className="text-xl font-semibold">${product.price}</p>
          <p className="text-gray-600">{product.description}</p>
          
          {/* Add to cart with dynamic loading */}
          <div className="animate-pulse bg-gray-200 h-12 rounded" />
        </div>
      </div>

      {/* Related products with lazy loading */}
      <section className="mt-16">
        <h2 className="text-2xl font-bold mb-8">Related Products</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="animate-pulse bg-gray-200 aspect-square rounded" />
          ))}
        </div>
      </section>
    </div>
  );
}

// Dynamic imports for heavy components
import dynamic from 'next/dynamic';
import { OptimizedImage } from '@/components/ui/optimized-image';

/* 
// Example dynamic components (uncomment when actual components exist):

const LazyAddToCartButton = dynamic(() => import('@/components/shop/add-to-cart-button'), {
  loading: () => <div className="animate-pulse bg-gray-200 h-12 rounded" />,
  ssr: false,
});

const LazyRelatedProducts = dynamic(() => import('@/components/shop/related-products'), {
  loading: () => (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="animate-pulse bg-gray-200 aspect-square rounded" />
      ))}
    </div>
  ),
  ssr: false,
});
*/ 