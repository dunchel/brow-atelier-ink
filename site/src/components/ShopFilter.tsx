"use client";

import { useState, useMemo, useRef } from "react";
import Link from "next/link";
import { useCart } from "./CartProvider";

interface Product {
  id: string;
  handle: string;
  title: string;
  price: string;
  compareAtPrice?: string;
  category: string;
  brand: string;
  tags: string[];
  imageUrl: string;
  images: string[];
  imageAlt: string;
  available: boolean;
}

function formatPrice(price: string): string {
  const num = parseFloat(price.replace(",", "."));
  if (isNaN(num)) return price;
  return new Intl.NumberFormat("nl-NL", { style: "currency", currency: "EUR" }).format(num);
}

function ProductImage({ src, alt, title }: { src: string; alt: string; title: string }) {
  const [status, setStatus] = useState<"loading" | "loaded" | "error">(src ? "loading" : "error");

  if (status === "error" || !src) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center bg-brand-cream/60 gap-2 p-4">
        <svg className="w-8 h-8 text-brand-taupe/30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
        <span className="text-brand-taupe text-[10px] text-center leading-tight line-clamp-2">{title}</span>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full">
      {status === "loading" && <div className="absolute inset-0 bg-brand-cream animate-pulse" />}
      <img
        src={src}
        alt={alt}
        loading="lazy"
        decoding="async"
        onLoad={() => setStatus("loaded")}
        onError={() => setStatus("error")}
        className={`w-full h-full object-cover group-hover:scale-105 transition-all duration-500 ${
          status === "loading" ? "opacity-0" : "opacity-100"
        }`}
      />
    </div>
  );
}

// ── Swipeable fotogalerij voor enkele-tegel kaart ────────────────────────────
function CardSwiper({ images, alt, title }: { images: string[]; alt: string; title: string }) {
  const valid = images.filter(Boolean);
  const [active, setActive] = useState(0);
  const [imgStatus, setImgStatus] = useState<"loading" | "loaded" | "error">(valid.length > 0 ? "loading" : "error");
  const txStart = useRef<number | null>(null);
  const txEnd = useRef<number | null>(null);

  const goTo = (i: number) => {
    setActive(i);
    setImgStatus("loading");
  };

  const onTouchStart = (e: React.TouchEvent) => {
    txStart.current = e.targetTouches[0].clientX;
    txEnd.current = null;
  };
  const onTouchMove = (e: React.TouchEvent) => {
    txEnd.current = e.targetTouches[0].clientX;
  };
  const onTouchEnd = (e: React.TouchEvent) => {
    if (!txStart.current || !txEnd.current) return;
    const dist = txStart.current - txEnd.current;
    if (Math.abs(dist) > 40) {
      e.stopPropagation();
      if (dist > 0 && active < valid.length - 1) goTo(active + 1);
      else if (dist < 0 && active > 0) goTo(active - 1);
    }
    txStart.current = null;
    txEnd.current = null;
  };

  if (valid.length === 0 || imgStatus === "error") {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center bg-brand-cream/60 gap-2 p-4">
        <svg className="w-8 h-8 text-brand-taupe/30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
        <span className="text-brand-taupe text-[10px] text-center leading-tight line-clamp-2">{title}</span>
      </div>
    );
  }

  return (
    <div
      className="relative w-full h-full select-none"
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      {imgStatus === "loading" && <div className="absolute inset-0 bg-brand-cream animate-pulse" />}
      <img
        src={valid[active]}
        alt={`${alt}${active > 0 ? ` - foto ${active + 1}` : ""}`}
        loading="lazy"
        decoding="async"
        draggable={false}
        onLoad={() => setImgStatus("loaded")}
        onError={() => setImgStatus("error")}
        className={`w-full h-full object-cover group-hover:scale-105 transition-all duration-500 ${
          imgStatus === "loading" ? "opacity-0" : "opacity-100"
        }`}
      />

      {valid.length > 1 && (
        <>
          {active > 0 && (
            <button
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); goTo(active - 1); }}
              className="absolute left-2 top-1/2 -translate-y-1/2 w-7 h-7 bg-white/85 hover:bg-white rounded-full flex items-center justify-center text-brand-dark shadow-sm transition-colors text-base leading-none"
              aria-label="Vorige foto"
            >
              &#8249;
            </button>
          )}
          {active < valid.length - 1 && (
            <button
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); goTo(active + 1); }}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 bg-white/85 hover:bg-white rounded-full flex items-center justify-center text-brand-dark shadow-sm transition-colors text-base leading-none"
              aria-label="Volgende foto"
            >
              &#8250;
            </button>
          )}
          <div className="absolute bottom-2.5 left-1/2 -translate-x-1/2 flex gap-1.5">
            {valid.map((_, i) => (
              <button
                key={i}
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); goTo(i); }}
                className={`w-1.5 h-1.5 rounded-full transition-colors ${
                  i === active ? "bg-brand-gold" : "bg-white/70 hover:bg-white"
                }`}
                aria-label={`Foto ${i + 1}`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// Gedeelde actieknoppen — variant bepaalt styling en of preventDefault nodig is
function ActionButtons({
  productTitle,
  variant,
}: {
  productTitle: string;
  variant: "overlay" | "inline";
}) {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<"idle" | "added" | "error">("idle");
  const { addItem } = useCart();

  const resolveVariantId = async (): Promise<string | null> => {
    const res = await fetch("/api/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productTitle, resolveOnly: true }),
    });
    const data = await res.json();
    return data.variantId ?? null;
  };

  const handleAddToCart = async (e: React.MouseEvent) => {
    if (variant === "overlay") { e.preventDefault(); e.stopPropagation(); }
    if (loading) return;
    setLoading(true);
    setStatus("idle");
    try {
      const vid = await resolveVariantId();
      if (!vid) { setStatus("error"); setTimeout(() => setStatus("idle"), 2000); return; }
      await addItem(vid, 1);
      setStatus("added");
      setTimeout(() => setStatus("idle"), 2000);
    } catch {
      setStatus("error");
      setTimeout(() => setStatus("idle"), 2000);
    } finally {
      setLoading(false);
    }
  };

  const handleBuyNow = async (e: React.MouseEvent) => {
    if (variant === "overlay") { e.preventDefault(); e.stopPropagation(); }
    if (loading) return;
    setLoading(true);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productTitle, quantity: 1 }),
      });
      const data = await res.json();
      if (data.checkoutUrl) window.location.href = data.checkoutUrl;
    } catch {
      // fail silently
    } finally {
      setLoading(false);
    }
  };

  if (variant === "overlay") {
    return (
      <>
        <button
          onClick={handleAddToCart}
          disabled={loading}
          className="flex-1 py-2 text-[10px] uppercase tracking-wide font-medium bg-white/90 text-brand-dark hover:bg-brand-gold hover:text-white transition-colors rounded disabled:opacity-60 leading-none"
        >
          {loading ? "..." : status === "added" ? "Toegevoegd" : status === "error" ? "Niet gevonden" : "+ Winkelmand"}
        </button>
        <button
          onClick={handleBuyNow}
          disabled={loading}
          className="flex-1 py-2 text-[10px] uppercase tracking-wide font-medium bg-brand-gold text-white hover:bg-brand-dark transition-colors rounded disabled:opacity-60 leading-none"
        >
          Koop nu
        </button>
      </>
    );
  }

  // inline variant — standaard knoppen onder de kaart
  return (
    <>
      <button
        onClick={handleAddToCart}
        disabled={loading}
        className="flex-1 py-2.5 text-xs uppercase tracking-widest font-medium border border-brand-dark text-brand-dark hover:bg-brand-dark hover:text-white transition-colors rounded disabled:opacity-60"
      >
        {loading ? "..." : status === "added" ? "Toegevoegd!" : status === "error" ? "Niet gevonden" : "In winkelmand"}
      </button>
      <button
        onClick={handleBuyNow}
        disabled={loading}
        className="flex-1 py-2.5 text-xs uppercase tracking-widest font-medium bg-brand-gold text-white hover:bg-brand-dark transition-colors rounded disabled:opacity-60"
      >
        Koop nu
      </button>
    </>
  );
}

// ── Kaart: grid-modus (2-koloms) ──────────────────────────────────────────────
// Mobiel: eerste tik = overlay fade in, tweede tik = navigeer
// Desktop: hover = overlay fade in
function ProductCardGrid({ product }: { product: Product }) {
  const [revealed, setRevealed] = useState(false);

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (
      product.available &&
      !revealed &&
      typeof window !== "undefined" &&
      window.matchMedia("(hover: none)").matches
    ) {
      e.preventDefault();
      setRevealed(true);
      setTimeout(() => setRevealed(false), 3000);
    }
  };

  return (
    <Link href={`/shop/${product.handle}`} className="group block" onClick={handleClick}>
      <div className="aspect-square bg-brand-cream rounded-lg overflow-hidden mb-3 relative">
        <ProductImage src={product.imageUrl} alt={product.imageAlt} title={product.title} />
        {product.available ? (
          <div
            className={`absolute inset-x-0 bottom-0 transition-opacity duration-200 ${
              revealed ? "opacity-100" : "opacity-0 group-hover:opacity-100"
            }`}
          >
            <div className="flex gap-1.5 p-2 bg-gradient-to-t from-black/55 via-black/20 to-transparent">
              <ActionButtons productTitle={product.title} variant="overlay" />
            </div>
          </div>
        ) : (
          <div className="absolute inset-0 bg-white/60 flex items-center justify-center">
            <span className="text-xs font-medium text-brand-dark bg-white/90 px-3 py-1 rounded-full">
              Uitverkocht
            </span>
          </div>
        )}
      </div>
      <h3 className="font-heading text-sm md:text-base mb-0.5 group-hover:text-brand-gold transition-colors line-clamp-1">
        {product.title}
      </h3>
      {product.brand && (
        <p className="text-[10px] text-brand-taupe/60 uppercase tracking-wide mb-1">{product.brand}</p>
      )}
      <div className="flex items-center gap-2">
        <p className="text-sm text-brand-dark font-medium">{formatPrice(product.price)}</p>
        {product.compareAtPrice && (
          <p className="text-xs text-brand-taupe line-through">{formatPrice(product.compareAtPrice)}</p>
        )}
      </div>
    </Link>
  );
}

// ── Kaart: enkele-modus (1-koloms, groter) ────────────────────────────────────
// Knoppen altijd zichtbaar onder de afbeelding, foto's swipeable
function ProductCardLarge({ product }: { product: Product }) {
  const images = product.images.length > 0 ? product.images : product.imageUrl ? [product.imageUrl] : [];
  return (
    <div>
      <Link href={`/shop/${product.handle}`} className="group block">
        <div className="aspect-square bg-brand-cream rounded-xl overflow-hidden mb-4 relative">
          <CardSwiper images={images} alt={product.imageAlt} title={product.title} />
          {!product.available && (
            <div className="absolute inset-0 bg-white/60 flex items-center justify-center">
              <span className="text-sm font-medium text-brand-dark bg-white/90 px-4 py-2 rounded-full">
                Uitverkocht
              </span>
            </div>
          )}
        </div>
        <h3 className="font-heading text-xl mb-1 group-hover:text-brand-gold transition-colors line-clamp-2">
          {product.title}
        </h3>
        {product.brand && (
          <p className="text-[11px] text-brand-taupe/60 uppercase tracking-wide mb-2">{product.brand}</p>
        )}
        <div className="flex items-center gap-3 mb-4">
          <p className="text-lg text-brand-dark font-medium">{formatPrice(product.price)}</p>
          {product.compareAtPrice && (
            <p className="text-sm text-brand-taupe line-through">{formatPrice(product.compareAtPrice)}</p>
          )}
        </div>
      </Link>
      {product.available && (
        <div className="flex gap-2">
          <ActionButtons productTitle={product.title} variant="inline" />
        </div>
      )}
    </div>
  );
}

// ── Filter pills ──────────────────────────────────────────────────────────────
interface ShopFilterProps {
  products: Product[];
}

const pill = "px-4 py-1.5 text-xs rounded-full transition-all whitespace-nowrap select-none cursor-pointer";
const pillOn = "bg-brand-dark text-white";
const pillOff = "bg-brand-cream text-brand-taupe hover:bg-brand-gold/10 hover:text-brand-dark";
const pillSm = "px-3 py-1 text-[11px] rounded-full transition-all whitespace-nowrap select-none cursor-pointer";
const pillSmOn = "bg-brand-gold text-white";
const pillSmOff = "bg-brand-cream/70 text-brand-taupe hover:text-brand-dark hover:bg-brand-cream";

export function ShopFilter({ products }: ShopFilterProps) {
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [activeBrand, setActiveBrand] = useState<string | null>(null);
  const [activeMaterial, setActiveMaterial] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"grid" | "single">("grid");

  const categories = useMemo(() => {
    const s = new Set<string>();
    products.forEach((p) => { if (p.category) s.add(p.category); });
    return Array.from(s).sort((a, b) => a.localeCompare(b, "nl"));
  }, [products]);

  const filteredByCat = useMemo(
    () => (activeCategory ? products.filter((p) => p.category === activeCategory) : products),
    [products, activeCategory]
  );

  const brands = useMemo(() => {
    const s = new Set<string>();
    filteredByCat.forEach((p) => { if (p.brand) s.add(p.brand); });
    return Array.from(s).sort((a, b) => a.localeCompare(b, "nl"));
  }, [filteredByCat]);

  const materials = useMemo(() => {
    const s = new Set<string>();
    filteredByCat.forEach((p) => {
      p.tags.forEach((t) => {
        const tl = t.toLowerCase().trim();
        if (tl.includes("goud") || tl === "gold" || tl === "goud verguld") s.add("Goud");
        if (tl.includes("zilver") || tl === "silver" || tl === "sterling zilver") s.add("Zilver");
        if (tl.includes("rosé") || tl.includes("rose") || tl.includes("kleur") || tl.includes("color") || tl.includes("blauw") || tl.includes("rood") || tl.includes("groen"))
          s.add("Kleur");
      });
    });
    return ["Goud", "Zilver", "Kleur"].filter((m) => s.has(m));
  }, [filteredByCat]);

  const filteredByBrand = useMemo(
    () =>
      activeBrand
        ? filteredByCat.filter(
            (p) => p.brand === activeBrand || p.tags.some((t) => t.toLowerCase() === activeBrand.toLowerCase())
          )
        : filteredByCat,
    [filteredByCat, activeBrand]
  );

  const filtered = useMemo(() => {
    if (!activeMaterial) return filteredByBrand;
    const lc = activeMaterial.toLowerCase();
    return filteredByBrand.filter((p) =>
      p.tags.some((t) => {
        const tl = t.toLowerCase();
        if (lc === "goud") return tl.includes("goud") || tl === "gold";
        if (lc === "zilver") return tl.includes("zilver") || tl === "silver";
        if (lc === "kleur") return tl.includes("kleur") || tl.includes("rosé") || tl.includes("rose") || tl.includes("color") || tl.includes("blauw") || tl.includes("rood") || tl.includes("groen");
        return false;
      })
    );
  }, [filteredByBrand, activeMaterial]);

  const resetFilters = () => {
    setActiveCategory(null);
    setActiveBrand(null);
    setActiveMaterial(null);
  };

  const hasActiveFilter = activeCategory || activeBrand || activeMaterial;
  const showSecondRow = brands.length > 0 || materials.length > 0;

  return (
    <>
      {/* ── Filter navigatiebalk ── */}
      <div className="sticky top-[60px] z-30 bg-white/95 backdrop-blur-sm border-b border-brand-cream shadow-sm">
        {/* Rij 1: Categorieën */}
        <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide py-3 px-4 md:px-6">
          <button onClick={resetFilters} className={`${pill} ${!activeCategory ? pillOn : pillOff}`}>
            Alles
          </button>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => {
                setActiveCategory(cat === activeCategory ? null : cat);
                setActiveBrand(null);
                setActiveMaterial(null);
              }}
              className={`${pill} capitalize ${activeCategory === cat ? pillOn : pillOff}`}
            >
              {cat}
            </button>
          ))}
          <div className="w-px h-5 bg-brand-cream flex-shrink-0 mx-1" />
          <Link
            href="/wenkbrauwen"
            className="px-4 py-1.5 text-xs rounded-full border border-brand-gold/60 text-brand-gold hover:bg-brand-gold hover:text-white transition-colors whitespace-nowrap flex-shrink-0"
          >
            Brows
          </Link>
        </div>

        {/* Rij 2: Merk + Materiaal */}
        {showSecondRow && (
          <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide py-2 px-4 md:px-6 border-t border-brand-cream/60">
            {brands.length > 0 && (
              <>
                <span className="text-[10px] uppercase tracking-widest text-brand-taupe/50 whitespace-nowrap flex-shrink-0">Merk</span>
                {brands.map((brand) => (
                  <button key={brand} onClick={() => setActiveBrand(activeBrand === brand ? null : brand)} className={`${pillSm} ${activeBrand === brand ? pillSmOn : pillSmOff}`}>
                    {brand}
                  </button>
                ))}
              </>
            )}
            {brands.length > 0 && materials.length > 0 && <div className="w-px h-4 bg-brand-cream flex-shrink-0 mx-1" />}
            {materials.length > 0 && (
              <>
                <span className="text-[10px] uppercase tracking-widest text-brand-taupe/50 whitespace-nowrap flex-shrink-0">Materiaal</span>
                {materials.map((mat) => (
                  <button key={mat} onClick={() => setActiveMaterial(activeMaterial === mat ? null : mat)} className={`${pillSm} ${activeMaterial === mat ? pillSmOn : pillSmOff}`}>
                    {mat}
                  </button>
                ))}
              </>
            )}
          </div>
        )}
      </div>

      {/* ── Teller + view-toggle ── */}
      <div className="flex items-center justify-between py-4">
        <p className="text-xs text-brand-taupe">
          {filtered.length} product{filtered.length !== 1 ? "en" : ""}
        </p>
        <div className="flex items-center gap-3">
          {hasActiveFilter && (
            <button onClick={resetFilters} className="text-xs text-brand-gold hover:underline">
              Filters wissen
            </button>
          )}
          {/* View-toggle: dubbele of enkele tegel */}
          <div className="flex items-center gap-0.5 border border-brand-cream rounded-full p-0.5">
            <button
              onClick={() => setViewMode("grid")}
              aria-label="Dubbele tegel"
              className={`p-1.5 rounded-full transition-colors ${viewMode === "grid" ? "bg-brand-dark text-white" : "text-brand-taupe hover:text-brand-dark"}`}
            >
              {/* 2x2 rooster */}
              <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor">
                <rect x="0" y="0" width="6" height="6" rx="1" />
                <rect x="8" y="0" width="6" height="6" rx="1" />
                <rect x="0" y="8" width="6" height="6" rx="1" />
                <rect x="8" y="8" width="6" height="6" rx="1" />
              </svg>
            </button>
            <button
              onClick={() => setViewMode("single")}
              aria-label="Enkele tegel"
              className={`p-1.5 rounded-full transition-colors ${viewMode === "single" ? "bg-brand-dark text-white" : "text-brand-taupe hover:text-brand-dark"}`}
            >
              {/* 1 kolom */}
              <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor">
                <rect x="0" y="0" width="14" height="6" rx="1" />
                <rect x="0" y="8" width="14" height="6" rx="1" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* ── Product grid ── */}
      {filtered.length > 0 ? (
        viewMode === "grid" ? (
          <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-8">
            {filtered.map((product) => (
              <ProductCardGrid key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
            {filtered.map((product) => (
              <ProductCardLarge key={product.id} product={product} />
            ))}
          </div>
        )
      ) : (
        <div className="text-center py-16">
          <p className="text-brand-taupe mb-4">Geen producten gevonden.</p>
          <button onClick={resetFilters} className="text-xs text-brand-gold hover:underline">
            Toon alle producten
          </button>
        </div>
      )}
    </>
  );
}
