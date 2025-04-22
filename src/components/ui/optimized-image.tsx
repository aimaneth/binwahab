import Image, { ImageProps } from 'next/image';
import { imageLoadingConfig } from '@/lib/performance';
import { useState } from 'react';

interface OptimizedImageProps extends Omit<ImageProps, 'onLoadingComplete'> {
  fallbackSrc?: string;
}

export default function OptimizedImage({
  src,
  alt,
  className,
  fallbackSrc = '/images/fallback-product.jpg',
  ...props
}: OptimizedImageProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);

  return (
    <div className={`relative ${isLoading ? 'blur-sm' : 'blur-0'} transition-all`}>
      <Image
        src={error ? fallbackSrc : src}
        alt={alt}
        className={`transition-opacity duration-300 ${className}`}
        {...imageLoadingConfig}
        {...props}
        onLoadingComplete={() => setIsLoading(false)}
        onError={() => {
          setError(true);
          setIsLoading(false);
        }}
      />
      {isLoading && (
        <div className="absolute inset-0 bg-gray-200 animate-pulse" />
      )}
    </div>
  );
} 