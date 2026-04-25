"use client";

import { useState, useRef, useCallback } from "react";

interface ProductGalleryProps {
  images: string[];
  alt: string;
  title: string;
}

export function ProductGallery({ images, alt, title }: ProductGalleryProps) {
  const [active, setActive] = useState(0);
  const touchStart = useRef<number | null>(null);
  const touchEnd = useRef<number | null>(null);

  const hasMultiple = images.length > 1;

  const next = useCallback(() => {
    setActive((i) => (i + 1) % images.length);
  }, [images.length]);

  const prev = useCallback(() => {
    setActive((i) => (i - 1 + images.length) % images.length);
  }, [images.length]);

  const onTouchStart = (e: React.TouchEvent) => {
    touchStart.current = e.targetTouches[0].clientX;
    touchEnd.current = null;
  };

  const onTouchMove = (e: React.TouchEvent) => {
    touchEnd.current = e.targetTouches[0].clientX;
  };

  const onTouchEnd = () => {
    if (!touchStart.current || !touchEnd.current) return;
    const distance = touchStart.current - touchEnd.current;
    if (Math.abs(distance) > 50) {
      if (distance > 0) next();
      else prev();
    }
    touchStart.current = null;
    touchEnd.current = null;
  };

  if (images.length === 0) {
    return (
      <div className="aspect-square bg-brand-cream rounded-lg flex items-center justify-center text-brand-taupe">
        {title}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div
        className="aspect-square bg-brand-cream rounded-lg overflow-hidden relative select-none"
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        <img
          src={images[active]}
          alt={`${alt} - foto ${active + 1}`}
          className="w-full h-full object-cover"
          draggable={false}
        />

        {hasMultiple && (
          <>
            <button
              onClick={prev}
              className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 bg-white/80 hover:bg-white rounded-full flex items-center justify-center text-brand-dark transition-colors shadow-sm"
              aria-label="Vorige foto"
            >
              &#8249;
            </button>
            <button
              onClick={next}
              className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 bg-white/80 hover:bg-white rounded-full flex items-center justify-center text-brand-dark transition-colors shadow-sm"
              aria-label="Volgende foto"
            >
              &#8250;
            </button>
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
              {images.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setActive(i)}
                  className={`w-2 h-2 rounded-full transition-colors ${
                    i === active ? "bg-brand-gold" : "bg-white/60"
                  }`}
                  aria-label={`Foto ${i + 1}`}
                />
              ))}
            </div>
          </>
        )}
      </div>

      {hasMultiple && (
        <div className="flex gap-2">
          {images.map((img, i) => (
            <button
              key={i}
              onClick={() => setActive(i)}
              className={`w-16 h-16 rounded-md overflow-hidden border-2 transition-colors flex-shrink-0 ${
                i === active ? "border-brand-gold" : "border-transparent"
              }`}
            >
              <img
                src={img}
                alt={`${alt} - thumbnail ${i + 1}`}
                className="w-full h-full object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
