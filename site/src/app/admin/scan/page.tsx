"use client";

import { useCallback, useEffect, useState, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { SaleLookupPanel, type SaleProduct } from "@/components/SaleLookupPanel";

function ScanContent() {
  const searchParams = useSearchParams();
  const [code, setCode] = useState("");
  const [product, setProduct] = useState<SaleProduct | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [stockMsg, setStockMsg] = useState("");
  const [stockLoading, setStockLoading] = useState(false);

  const lookup = useCallback(async (barcode: string) => {
    const trimmed = barcode.trim();
    if (!trimmed) return;
    setLoading(true);
    setError("");
    setStockMsg("");
    setProduct(null);
    try {
      const res = await fetch(`/api/admin/lookup?code=${encodeURIComponent(trimmed)}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Product niet gevonden");
      setProduct({
        ...data.product,
        available: data.product.stockCount > 0,
      });
      setCode(trimmed);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Lookup mislukt");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const fromUrl = searchParams.get("code");
    if (fromUrl) lookup(fromUrl);
  }, [searchParams, lookup]);

  const adjustStock = async (action: "sell" | "return") => {
    if (!product) return;
    setStockLoading(true);
    setStockMsg("");
    setError("");
    try {
      const res = await fetch("/api/admin/stock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ barcode: product.barcode, action }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Update mislukt");
      setProduct((p) =>
        p
          ? {
              ...p,
              stockCount: data.newStock,
              available: data.newStock > 0,
            }
          : null
      );
      setStockMsg(
        action === "sell"
          ? `Verkoop geregistreerd. Voorraad: ${data.oldStock} → ${data.newStock}`
          : `Retour geregistreerd. Voorraad: ${data.oldStock} → ${data.newStock}`
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Update mislukt");
    } finally {
      setStockLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-brand-light pt-24 pb-16 px-4">
      <div className="max-w-lg mx-auto">
        <Link
          href="/admin"
          className="text-xs text-brand-taupe hover:text-brand-gold transition-colors uppercase tracking-widest"
        >
          &larr; Admin
        </Link>
        <h1 className="font-heading text-2xl mt-2 mb-1">Scan &amp; Verkoop</h1>
        <p className="text-brand-taupe text-sm mb-5">
          Typ code of scan label. Toon QR aan POS, kies korting, registreer
          voorraad.
        </p>

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
            placeholder="BA-KET-001"
            className="flex-1 px-4 py-3 bg-white border border-brand-cream rounded-lg focus:outline-none focus:border-brand-gold text-base font-mono uppercase"
            autoFocus
            autoComplete="off"
          />
          <button type="submit" disabled={loading} className="btn-primary text-sm px-5">
            {loading ? "..." : "Zoek"}
          </button>
        </form>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
            {error}
          </div>
        )}

        {product && (
          <SaleLookupPanel
            product={product}
            showStockActions
            stockLoading={stockLoading}
            stockMsg={stockMsg}
            onSell={() => adjustStock("sell")}
            onReturn={() => adjustStock("return")}
          />
        )}

        <p className="mt-6 text-center">
          <Link
            href="/shop/code"
            className="text-xs text-brand-gold hover:text-brand-dark transition-colors"
          >
            Ook beschikbaar op /shop/code (zonder admin-login)
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function ScanPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-brand-light pt-24 flex items-center justify-center">
          <p className="text-brand-taupe">Laden...</p>
        </div>
      }
    >
      <ScanContent />
    </Suspense>
  );
}
