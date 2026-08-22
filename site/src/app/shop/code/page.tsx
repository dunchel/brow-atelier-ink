"use client";

import { useCallback, useEffect, useState, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { SaleLookupPanel, type SaleProduct } from "@/components/SaleLookupPanel";
import { PosSaleBoard, type TreatmentItem } from "@/components/PosSaleBoard";

function CodeLookupContent() {
  const searchParams = useSearchParams();
  const [code, setCode] = useState("");
  const [product, setProduct] = useState<SaleProduct | null>(null);
  const [treatments, setTreatments] = useState<TreatmentItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/treatments", { cache: "no-store" })
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data.treatments)) setTreatments(data.treatments);
      })
      .catch(() => undefined);
  }, []);

  const lookup = useCallback(async (barcode: string) => {
    const trimmed = barcode.trim();
    if (!trimmed) return;
    setLoading(true);
    setError("");
    setProduct(null);
    try {
      const res = await fetch(
        `/api/product/lookup?code=${encodeURIComponent(trimmed)}`
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Product niet gevonden");
      setProduct(data.product);
      setCode(trimmed);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Zoeken mislukt");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const fromUrl = searchParams.get("code");
    if (fromUrl) lookup(fromUrl);
  }, [searchParams, lookup]);

  return (
    <>
      <section className="pt-24 pb-8 bg-brand-cream">
        <div className="max-w-lg mx-auto text-center px-4">
          <Link
            href="/shop"
            className="text-xs uppercase tracking-widest text-brand-taupe hover:text-brand-gold transition-colors"
          >
            &larr; Shop
          </Link>
          <h1 className="font-heading text-2xl md:text-3xl mt-3 mb-2">
            Verkoop via telefoon
          </h1>
          <p className="text-brand-taupe text-sm">
            Product scannen of behandeling aantikken. Alles op één bon — één keer
            pinnen.
          </p>
        </div>
      </section>

      <section className="pb-16 px-4">
        <div className="max-w-lg mx-auto">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              lookup(code);
            }}
            className="flex gap-2 mb-4"
          >
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="BA-KET-001 of BA-BHL-001"
              className="flex-1 px-4 py-3 bg-white border border-brand-cream rounded-lg focus:outline-none focus:border-brand-gold text-base font-mono uppercase"
              autoFocus
              autoComplete="off"
              spellCheck={false}
            />
            <button
              type="submit"
              disabled={loading || !code.trim()}
              className="btn-primary text-sm px-5 disabled:opacity-50"
            >
              {loading ? "..." : "Zoek"}
            </button>
          </form>

          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
              {error}
            </div>
          )}

          {product && <SaleLookupPanel product={product} />}

          <div className="mt-6">
            <PosSaleBoard treatments={treatments} lastProduct={product} />
          </div>
        </div>
      </section>
    </>
  );
}

export default function CodeLookupPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-brand-light pt-24 flex items-center justify-center">
          <p className="text-brand-taupe">Laden...</p>
        </div>
      }
    >
      <CodeLookupContent />
    </Suspense>
  );
}
