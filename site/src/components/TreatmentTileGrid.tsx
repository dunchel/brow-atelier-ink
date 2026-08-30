"use client";

import { formatEuro, parsePrice } from "@/lib/discount";
import { groupTreatmentsByCategory, TREATMENT_NOT_IN_SHOPIFY } from "@/lib/treatment-catalog";

export interface TreatmentTileData {
  naam: string;
  prijs: string;
  barcode: string;
  categorie: string;
  duur?: string;
  inShopify?: boolean;
}

interface TreatmentTileGridProps {
  treatments: TreatmentTileData[];
  onSelect: (treatment: TreatmentTileData) => void;
  quantities?: Record<string, number>;
  pendingBarcode?: string | null;
  intro?: React.ReactNode;
  showShopifyState?: boolean;
}

export function TreatmentTileGrid({
  treatments,
  onSelect,
  quantities,
  pendingBarcode,
  intro,
  showShopifyState = false,
}: TreatmentTileGridProps) {
  const groups = groupTreatmentsByCategory(treatments);

  return (
    <div className="space-y-5">
      {intro}
      {groups.map(({ categorie, items }) => (
        <div key={categorie}>
          <p className="text-xs uppercase tracking-widest text-brand-taupe mb-2">
            {categorie}
          </p>
          <div className="space-y-2">
            {items.map((t) => {
              const priced = parsePrice(t.prijs) > 0;
              const missingShopify = showShopifyState && t.inShopify === false;
              const qty = quantities?.[t.barcode.toUpperCase()] ?? 0;
              const pending = pendingBarcode === t.barcode;
              const disabled = !priced || pending;

              return (
                <button
                  key={t.barcode}
                  type="button"
                  onClick={() => onSelect(t)}
                  disabled={disabled}
                  className="w-full min-h-[3.25rem] flex items-center justify-between gap-3 p-4 bg-white border border-brand-cream rounded-lg text-left hover:border-brand-gold transition-colors disabled:opacity-50"
                >
                  <div className="min-w-0">
                    <p className="font-medium text-sm">
                      {t.naam}
                      {qty > 0 ? (
                        <span className="ml-2 text-brand-gold font-bold">×{qty}</span>
                      ) : null}
                    </p>
                    {t.duur && (
                      <p className="text-[11px] text-brand-taupe">{t.duur}</p>
                    )}
                    {missingShopify && priced && (
                      <p className="text-[11px] text-red-600 mt-1">{TREATMENT_NOT_IN_SHOPIFY}</p>
                    )}
                  </div>
                  <span className="text-sm font-bold text-brand-gold whitespace-nowrap">
                    {pending ? "…" : priced ? `€${formatEuro(parsePrice(t.prijs))}` : "Prijs ontbreekt"}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
