"use client";

import { useState } from "react";
import { useCart } from "./CartProvider";

interface BuyButtonProps {
  productTitle: string;
  variantId?: string;
}

export function BuyButton({ productTitle, variantId }: BuyButtonProps) {
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [added, setAdded] = useState(false);
  const { addItem } = useCart();

  const resolveVariantId = async (): Promise<string | null> => {
    if (variantId) return variantId;
    const res = await fetch("/api/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productTitle, resolveOnly: true }),
    });
    const data = await res.json();
    return data.variantId ?? null;
  };

  const handleAddToCart = async () => {
    setLoading(true);
    setError(null);
    try {
      let vid = variantId;
      if (!vid) {
        vid = (await resolveVariantId()) ?? undefined;
      }
      if (!vid) {
        setError("Product niet gevonden in Shopify.");
        return;
      }
      await addItem(vid, quantity);
      setAdded(true);
      setTimeout(() => setAdded(false), 2000);
    } catch {
      setError("Kon niet toevoegen aan winkelwagen.");
    } finally {
      setLoading(false);
    }
  };

  const handleBuyNow = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productTitle, quantity }),
      });
      const data = await res.json();
      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
      } else if (data.whatsapp) {
        setError("Dit product is nog niet online te bestellen.");
        setTimeout(() => window.open(data.whatsapp, "_blank"), 1500);
      } else {
        setError(data.error || "Er ging iets mis.");
      }
    } catch {
      setError("Kan geen verbinding maken met de server.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-1">
        <span className="text-xs text-brand-taupe mr-2">Aantal</span>
        <button
          type="button"
          onClick={() => setQuantity((q) => Math.max(1, q - 1))}
          className="w-8 h-8 flex items-center justify-center border border-brand-taupe/20 rounded-l-md text-sm hover:bg-brand-cream transition-colors"
          aria-label="Minder"
        >
          &minus;
        </button>
        <span className="w-10 h-8 flex items-center justify-center border-y border-brand-taupe/20 text-sm font-medium tabular-nums">
          {quantity}
        </span>
        <button
          type="button"
          onClick={() => setQuantity((q) => Math.min(20, q + 1))}
          className="w-8 h-8 flex items-center justify-center border border-brand-taupe/20 rounded-r-md text-sm hover:bg-brand-cream transition-colors"
          aria-label="Meer"
        >
          +
        </button>
      </div>
      <div className="flex flex-wrap gap-3">
        <button
          onClick={handleAddToCart}
          disabled={loading}
          className="btn-primary text-xs disabled:opacity-50"
        >
          {loading ? "Moment..." : added ? "Toegevoegd!" : "In winkelwagen"}
        </button>
        <button
          onClick={handleBuyNow}
          disabled={loading}
          className="btn-outline text-xs disabled:opacity-50"
        >
          Koop nu
        </button>
      </div>
      {error && <p className="text-sm text-red-500 mt-2">{error}</p>}
    </div>
  );
}
