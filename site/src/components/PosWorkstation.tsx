"use client";

import { useCallback, useEffect, useState } from "react";
import { SaleLookupPanel, type SaleProduct } from "@/components/SaleLookupPanel";
import { PosSaleBoard, type TreatmentItem } from "@/components/PosSaleBoard";

interface PosWorkstationProps {
  lookupUrl?: string;
  autofocus?: boolean;
  initialCode?: string;
}

export function PosWorkstation({
  lookupUrl = "/api/product/lookup",
  autofocus = false,
  initialCode,
}: PosWorkstationProps) {
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

  const lookup = useCallback(
    async (barcode: string) => {
      const trimmed = barcode.trim();
      if (!trimmed) return;
      setLoading(true);
      setError("");
      setProduct(null);
      try {
        const res = await fetch(`${lookupUrl}?code=${encodeURIComponent(trimmed)}`);
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Product niet gevonden");
        const found = data.product as SaleProduct;
        setProduct({
          ...found,
          available: found.available ?? found.stockCount > 0,
        });
        setCode(trimmed);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Zoeken mislukt");
      } finally {
        setLoading(false);
      }
    },
    [lookupUrl]
  );

  useEffect(() => {
    if (initialCode) lookup(initialCode);
  }, [initialCode, lookup]);

  return (
    <div>
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
          autoFocus={autofocus}
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

      <div className={product ? "mt-6" : ""}>
        <PosSaleBoard treatments={treatments} lastProduct={product} />
      </div>
    </div>
  );
}
