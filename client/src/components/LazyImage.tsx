import { useState } from "react";

interface LazyImageProps {
  src: string;
  alt: string;
  className?: string;
  placeholder?: string;
}

export function LazyImage({ src, alt, className, placeholder }: LazyImageProps) {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);

  return (
    <div className={`relative ${className}`}>
      {!loaded && !error && (
        <div className="absolute inset-0 bg-muted animate-pulse flex items-center justify-center">
          <div className="w-12 h-12 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
        </div>
      )}
      {error && (
        <div className="absolute inset-0 bg-muted flex items-center justify-center">
          <span className="text-muted-foreground">Image failed to load</span>
        </div>
      )}
      <img
        src={src}
        alt={alt}
        className={`${className} ${loaded ? 'opacity-100' : 'opacity-0'} transition-opacity duration-300`}
        loading="lazy"
        decoding="async"
        onLoad={() => setLoaded(true)}
        onError={() => setError(true)}
      />
    </div>
  );
}

