"use client";

import { useCallback, useEffect, useState, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { QRCodeSVG } from "qrcode.react";

interface ProductInfo {
  naam: string;
  prijs: string;
  barcode: string;
  categorie: string;
  voorraad: string;
  stockCount: number;
  foto: string | null;
}

function ScanContent() {
  const searchParams = useSearchParams();
  const [code, setCode] = useState("");
  const [product, setProduct] = useState<ProductInfo | null>(null);
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
      setProduct(data.product);
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
              voorraad: String(data.newStock),
              stockCount: data.newStock,
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
    <div className="min-h-screen bg-brand-light pt-32 pb-20 px-6">
      <div className="max-w-lg mx-auto">
        <Link
          href="/admin"
          className="text-xs text-brand-taupe hover:text-brand-gold transition-colors uppercase tracking-widest"
        >
          &larr; Admin
        </Link>
        <h1 className="font-heading text-3xl mt-2 mb-2">Scan &amp; Voorraad</h1>
        <p className="text-brand-taupe text-sm mb-6">
          Scan een label-QR of typ de productcode. Zie direct voorraad en prijs,
          en registreer verkoop of retour — de Google Sheet wordt automatisch
          bijgewerkt.
        </p>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            lookup(code);
          }}
          className="flex gap-2 mb-6"
        >
          <input
            type="text"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="Barcode of scan QR..."
            className="flex-1 px-4 py-3 bg-white border border-brand-cream rounded focus:outline-none focus:border-brand-gold text-sm font-mono"
            autoFocus
          />
          <button type="submit" disabled={loading} className="btn-primary text-xs whitespace-nowrap">
            {loading ? "..." : "Zoek"}
          </button>
        </form>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-sm text-red-700">
            {error}
          </div>
        )}

        {stockMsg && (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded text-sm text-green-800">
            {stockMsg}
          </div>
        )}

        {product && (
          <div className="bg-white rounded-lg border border-brand-cream overflow-hidden">
            <div className="p-6 flex flex-col sm:flex-row gap-6">
              {product.foto ? (
                <img
                  src={product.foto}
                  alt={product.naam}
                  className="w-32 h-32 object-cover rounded-lg flex-shrink-0 mx-auto sm:mx-0"
                />
              ) : (
                <div className="w-32 h-32 bg-brand-light rounded-lg flex items-center justify-center flex-shrink-0 mx-auto sm:mx-0">
                  <QRCodeSVG value={product.barcode} size={80} level="M" />
                </div>
              )}
              <div className="flex-1 text-center sm:text-left">
                <p className="text-xs uppercase tracking-widest text-brand-taupe mb-1">
                  {product.categorie}
                </p>
                <h2 className="font-heading text-xl mb-2">{product.naam}</h2>
                <p className="text-2xl font-bold text-brand-gold mb-1">
                  &euro;{product.prijs}
                </p>
                <p className="font-mono text-sm text-brand-taupe mb-3">{product.barcode}</p>
                <div
                  className={`inline-block px-4 py-2 rounded-lg text-lg font-bold ${
                    product.stockCount > 0
                      ? "bg-green-100 text-green-800"
                      : "bg-red-100 text-red-800"
                  }`}
                >
                  Voorraad: {product.stockCount}
                </div>
              </div>
            </div>

            <div className="border-t border-brand-cream p-4 flex flex-wrap gap-3 justify-center sm:justify-start">
              <button
                onClick={() => adjustStock("sell")}
                disabled={stockLoading || product.stockCount <= 0}
                className="btn-primary text-xs disabled:opacity-40"
              >
                Verkoop (−1 voorraad)
              </button>
              <button
                onClick={() => adjustStock("return")}
                disabled={stockLoading}
                className="px-4 py-2 text-xs rounded border border-brand-cream bg-white hover:border-brand-gold transition-colors"
              >
                Retour (+1 voorraad)
              </button>
            </div>
          </div>
        )}

        <div className="mt-8 p-4 bg-brand-cream/50 rounded-lg text-xs text-brand-taupe space-y-2">
          <p className="font-medium text-brand-dark">Automatische updates</p>
          <ul className="list-disc list-inside space-y-1">
            <li>
              <strong>In de winkel:</strong> druk op Verkoop of Retour — Google Sheet
              wordt direct bijgewerkt.
            </li>
            <li>
              <strong>Webshop:</strong> na online betaling kan Shopify automatisch
              voorraad verlagen (webhook orders/paid instellen in Shopify Admin).
            </li>
            <li>
              Nieuwe labels hebben een QR die direct naar deze pagina linkt.
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}

export default function ScanPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-brand-light pt-32 flex items-center justify-center">
          <p className="text-brand-taupe">Laden...</p>
        </div>
      }
    >
      <ScanContent />
    </Suspense>
  );
}
