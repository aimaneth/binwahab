import Link from 'next/link';

export default function CollectionNotFound() {
  return (
    <div className="min-h-[calc(100vh-64px)] flex flex-col items-center justify-center bg-white p-4">
      <div className="max-w-md text-center">
        <h1 className="text-6xl font-bold text-gray-900 mb-4">404</h1>
        <h2 className="text-2xl font-semibold text-gray-800 mb-4">Collection Not Found</h2>
        <p className="text-gray-600 mb-8">
          We couldn't find the collection you're looking for. It may have been removed or the URL might be incorrect.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/shop/collections"
            className="px-6 py-3 rounded-md bg-black text-white font-medium hover:bg-gray-900 transition-colors"
          >
            View All Collections
          </Link>
          <Link
            href="/shop"
            className="px-6 py-3 rounded-md border border-gray-300 text-gray-700 font-medium hover:bg-gray-50 transition-colors"
          >
            Go to Shop
          </Link>
        </div>
      </div>
    </div>
  );
} 