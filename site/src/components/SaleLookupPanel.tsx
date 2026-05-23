"use client";

import { useState } from "react";
import Link from "next/link";
import { QRCodeSVG } from "qrcode.react";
import { BuyButton } from "@/components/BuyButton";
import {
  applyDiscount,
  DISCOUNT_PRESETS,
  formatEuro,
  parsePrice,
} from "@/lib/discount";

export interface SaleProduct {
  naam: string;
  prijs: string;
  barcode: string;
  categorie: string;
  foto: string | null;
  handle?: string;
  stockCount: number;
  available: boolean;
}

interface SaleLookupPanelProps {
  product: SaleProduct;
  showStockActions?: boolean;
  stockLoading?: boolean;
  stockMsg?: string;
  onSell?: () => void;
  onReturn?: () => void;
}

export function SaleLookupPanel({
  product,
  showStockActions = false,
  stockLoading = false,
  stockMsg,
  onSell,
  onReturn,
}: SaleLookupPanelProps) {
  const [discountPct, setDiscountPct] = useState(0);
  const [fullscreenQr, setFullscreenQr] = useState(false);

  const basePrice = parsePrice(product.prijs);
  const salePrice = applyDiscount(basePrice, discountPct);
  const hasDiscount = discountPct > 0;

  return (
    <>
      <div className="bg-white rounded-lg border border-brand-cream overflow-hidden shadow-sm">
        {/* Grote QR voor POS-scan vanaf telefoonscherm */}
        <div className="bg-white p-6 text-center border-b border-brand-cream">
          <p className="text-xs uppercase tracking-widest text-brand-taupe mb-3">
            Scan met Shopify POS
          </p>
          <button
            type="button"
            onClick={() => setFullscreenQr(true)}
            className="inline-block p-4 bg-white rounded-xl border-2 border-brand-cream hover:border-brand-gold transition-colors active:scale-[0.98]"
            aria-label="QR vergroten"
          >
            <QRCodeSVG value={product.barcode} size={200} level="M" />
          </button>
          <p className="font-mono text-lg font-bold text-brand-dark mt-4 tracking-wide">
            {product.barcode}
          </p>
          <p className="text-xs text-brand-taupe mt-2">
            Tik op de QR voor fullscreen — houd scherm naar POS-scanner
          </p>
        </div>

        <div className="p-5">
          <div className="flex gap-4 mb-5">
            {product.foto ? (
              <img
                src={product.foto}
                alt={product.naam}
                className="w-20 h-20 object-cover rounded-lg flex-shrink-0"
              />
            ) : null}
            <div className="flex-1 min-w-0">
              <p className="text-xs uppercase tracking-widest text-brand-taupe mb-1">
                {product.categorie}
              </p>
              <h2 className="font-heading text-lg leading-snug mb-2">{product.naam}</h2>
              <span
                className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${
                  product.available
                    ? "bg-green-100 text-green-800"
                    : "bg-red-100 text-red-800"
                }`}
              >
                {product.available
                  ? showStockActions
                    ? `Voorraad: ${product.stockCount}`
                    : "Op voorraad"
                  : "Uitverkocht"}
              </span>
            </div>
          </div>

          {/* Prijs + korting */}
          <div className="mb-4 p-4 bg-brand-light rounded-lg">
            <div className="flex items-baseline gap-3 flex-wrap">
              {hasDiscount && (
                <span className="text-lg text-brand-taupe line-through">
                  &euro;{formatEuro(basePrice)}
                </span>
              )}
              <span className="text-3xl font-bold text-brand-gold">
                &euro;{formatEuro(hasDiscount ? salePrice : basePrice)}
              </span>
              {hasDiscount && (
                <span className="text-sm font-semibold text-green-700 bg-green-100 px-2 py-0.5 rounded">
                  −{discountPct}%
                </span>
              )}
            </div>
            {hasDiscount && (
              <p className="text-xs text-brand-taupe mt-2">
                Korting: &euro;{formatEuro(basePrice - salePrice)} — pas ook in POS toe
              </p>
            )}
          </div>

          <p className="text-xs text-brand-taupe mb-2">Korting</p>
          <div className="flex flex-wrap gap-2 mb-2">
            {DISCOUNT_PRESETS.map((pct) => (
              <button
                key={pct}
                type="button"
                onClick={() => setDiscountPct(pct)}
                className={`px-3 py-2 text-sm rounded-lg border transition-colors ${
                  discountPct === pct
                    ? "bg-brand-dark text-white border-brand-dark"
                    : "bg-white border-brand-cream text-brand-dark hover:border-brand-gold"
                }`}
              >
                −{pct}%
              </button>
            ))}
            <button
              type="button"
              onClick={() => setDiscountPct(0)}
              className={`px-3 py-2 text-sm rounded-lg border transition-colors ${
                discountPct === 0
                  ? "bg-brand-taupe text-white border-brand-taupe"
                  : "bg-white border-brand-cream text-brand-taupe hover:border-brand-gold"
              }`}
            >
              Geen
            </button>
          </div>
        </div>

        {stockMsg && (
          <div className="mx-5 mb-4 p-3 bg-green-50 border border-green-200 rounded text-sm text-green-800">
            {stockMsg}
          </div>
        )}

        <div className="border-t border-brand-cream p-4 bg-brand-light/50">
          <p className="text-xs uppercase tracking-widest text-brand-taupe mb-3">
            Online afrekenen
          </p>
          <BuyButton productTitle={product.naam} />
          {hasDiscount && (
            <p className="text-xs text-brand-taupe mt-3">
              Korting geldt in de winkel (POS). Online is de normale prijs — of
              neem contact op voor een kortingscode.
            </p>
          )}
        </div>

        <div className="border-t border-brand-cream p-4 flex flex-wrap gap-2">
          {showStockActions && onSell && onReturn && (
            <>
              <button
                onClick={onSell}
                disabled={stockLoading || product.stockCount <= 0}
                className="btn-primary text-xs flex-1 min-w-[120px] disabled:opacity-40"
              >
                Verkoop (−1)
              </button>
              <button
                onClick={onReturn}
                disabled={stockLoading}
                className="px-4 py-2 text-xs rounded border border-brand-cream bg-white hover:border-brand-gold transition-colors flex-1 min-w-[100px]"
              >
                Retour (+1)
              </button>
            </>
          )}
          {product.handle && (
            <Link
              href={`/shop/${product.handle}`}
              className="px-4 py-2 text-xs rounded border border-brand-cream bg-white hover:border-brand-gold transition-colors"
            >
              Shop-pagina
            </Link>
          )}
        </div>
      </div>

      {fullscreenQr && (
        <div
          className="fixed inset-0 z-50 bg-white flex flex-col items-center justify-center p-6"
          onClick={() => setFullscreenQr(false)}
        >
          <p className="text-sm uppercase tracking-widest text-brand-taupe mb-6">
            Scan met POS
          </p>
          <QRCodeSVG value={product.barcode} size={Math.min(320, typeof window !== "undefined" ? window.innerWidth - 48 : 280)} level="M" />
          <p className="font-mono text-2xl font-bold mt-8 tracking-widest">{product.barcode}</p>
          {hasDiscount && (
            <p className="text-3xl font-bold text-brand-gold mt-4">
              &euro;{formatEuro(salePrice)}
              <span className="text-base text-brand-taupe font-normal ml-2">
                (−{discountPct}%)
              </span>
            </p>
          )}
          {!hasDiscount && (
            <p className="text-3xl font-bold text-brand-gold mt-4">
              &euro;{formatEuro(basePrice)}
            </p>
          )}
          <p className="text-xs text-brand-taupe mt-8">Tik om te sluiten</p>
        </div>
      )}
    </>
  );
}
