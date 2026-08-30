"use client";

import { useEffect, useMemo, useState } from "react";
import { useCart } from "./CartProvider";
import { TreatmentTileGrid, type TreatmentTileData } from "./TreatmentTileGrid";
import { isTreatmentBarcode, TREATMENT_NOT_IN_SHOPIFY } from "@/lib/treatment-catalog";

function quantitiesFromCart(
  cart: ReturnType<typeof useCart>["cart"],
  treatments: TreatmentTileData[]
): Record<string, number> {
  const qty: Record<string, number> = {};
  const byName = new Map(treatments.map((t) => [t.naam.trim().toLowerCase(), t.barcode.toUpperCase()]));

  for (const edge of cart?.lines.edges ?? []) {
    const line = edge.node;
    const sku = (line.merchandise.sku || "").trim().toUpperCase();
    if (sku && isTreatmentBarcode(sku)) {
      qty[sku] = (qty[sku] || 0) + line.quantity;
      continue;
    }
    const barcode = byName.get(line.merchandise.product.title.trim().toLowerCase());
    if (barcode) qty[barcode] = (qty[barcode] || 0) + line.quantity;
  }
  return qty;
}

export function CartTreatmentTiles() {
  const { cart, addItemByBarcode } = useCart();
  const [treatments, setTreatments] = useState<TreatmentTileData[]>([]);
  const [pendingBarcode, setPendingBarcode] = useState<string | null>(null);
  const [tileError, setTileError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/treatments?checkout=1", { cache: "no-store" })
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data.treatments)) {
          setTreatments(
            data.treatments.filter((t: TreatmentTileData) => parseFloat((t.prijs || "").replace(",", ".")) > 0)
          );
        }
      })
      .catch(() => undefined);
  }, []);

  const quantities = useMemo(() => quantitiesFromCart(cart, treatments), [cart, treatments]);

  const handleSelect = async (t: TreatmentTileData) => {
    setPendingBarcode(t.barcode);
    setTileError(null);
    try {
      await addItemByBarcode(t.barcode);
    } catch (err) {
      setTileError(err instanceof Error ? err.message : TREATMENT_NOT_IN_SHOPIFY);
    } finally {
      setPendingBarcode(null);
    }
  };

  if (treatments.length === 0) return null;

  return (
    <div className="pt-2 pb-2">
      <p className="text-xs uppercase tracking-widest text-brand-taupe mb-1">Behandelingen</p>
      <p className="text-xs text-brand-taupe mb-3">
        Tik een behandeling aan om het totaal te verhogen. Nog eens tikken telt het aantal op.
      </p>
      {tileError && (
        <p role="alert" className="mb-3 p-3 text-sm text-red-700 bg-red-50 border border-red-100 rounded">
          {tileError}
        </p>
      )}
      <TreatmentTileGrid
        treatments={treatments}
        onSelect={handleSelect}
        quantities={quantities}
        pendingBarcode={pendingBarcode}
        showShopifyState
      />
    </div>
  );
}
