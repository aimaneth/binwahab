'use client';

import { useState, useEffect, ReactNode } from 'react';
import { apiClient } from '@/lib/api-client';

interface LoadingWrapperProps {
  children: ReactNode | ((data: any) => ReactNode);
  endpoint: string;
  fallbackData?: any;
  cacheKey?: string;
}

export function LoadingWrapper({ children, endpoint, fallbackData = [], cacheKey }: LoadingWrapperProps) {
  const [data, setData] = useState(fallbackData);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const result = await apiClient.get(endpoint);
        setData(result);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load data');
        console.error(`Error loading ${endpoint}:`, err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [endpoint]);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">Loading...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 m-4">
        <div className="flex items-center">
          <div className="text-yellow-600">⚠️</div>
          <div className="ml-2">
            <p className="text-yellow-800 font-medium">Temporary Loading Issue</p>
            <p className="text-yellow-700 text-sm">
              Data is loading... Please wait a moment. 
              <button 
                onClick={() => window.location.reload()} 
                className="ml-2 underline hover:no-underline"
              >
                Refresh page
              </button>
            </p>
          </div>
        </div>
      </div>
    );
  }

  return <>{typeof children === 'function' ? children(data) : children}</>;
}

// Optimized product grid with skeleton loading
export function ProductGrid({ products: initialProducts }: { products?: any[] }) {
  const [products, setProducts] = useState(initialProducts || []);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadProducts = async () => {
      try {
        const result = await apiClient.get('/products');
        setProducts(result);
      } catch (error) {
        console.error('Error loading products:', error);
      } finally {
        setLoading(false);
      }
    };

    if (!initialProducts) {
      loadProducts();
    } else {
      setLoading(false);
    }
  }, [initialProducts]);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">Loading products...</span>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {products?.length > 0 ? (
        products.map((product: any) => (
          <div key={product.id} className="bg-white rounded-lg shadow-sm border p-4">
            <h3 className="font-medium text-gray-900">{product.name}</h3>
            <p className="text-gray-600 text-sm mt-1">{product.description}</p>
            <p className="text-lg font-semibold text-green-600 mt-2">
              ${typeof product.price === 'object' ? product.price.toFixed(2) : product.price}
            </p>
          </div>
        ))
      ) : (
        <div className="col-span-full text-center py-8 text-gray-500">
          No products found
        </div>
      )}
    </div>
  );
} 