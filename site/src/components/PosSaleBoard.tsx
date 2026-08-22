"use client";

import { useMemo, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { formatEuro, parsePrice } from "@/lib/discount";
import type { SaleProduct } from "./SaleLookupPanel";

export interface TreatmentItem {
  naam: string;
  prijs: string;
  barcode: string;
  categorie: string;
  duur: string;
}

export interface PosCartLine {
  naam: string;
  prijs: string;
  barcode: string;
  categorie: string;
  kind: "product" | "behandeling";
  qty: number;
}

interface PosSaleBoardProps {
  treatments: TreatmentItem[];
  lastProduct?: SaleProduct | null;
}

export function linesFromProduct(product: SaleProduct): PosCartLine {
  return {
    naam: product.naam,
    prijs: product.prijs,
    barcode: product.barcode,
    categorie: product.categorie,
    kind: product.kind === "behandeling" ? "behandeling" : "product",
    qty: 1,
  };
}

export function addLine(lines: PosCartLine[], incoming: PosCartLine): PosCartLine[] {
  const idx = lines.findIndex((l) => l.barcode === incoming.barcode);
  if (idx >= 0) {
    return lines.map((l, i) => (i === idx ? { ...l, qty: l.qty + incoming.qty } : l));
  }
  return [...lines, incoming];
}

export function PosSaleBoard({ treatments, lastProduct }: PosSaleBoardProps) {
  const [tab, setTab] = useState<"behandelingen" | "bon">("behandelingen");
  const [lines, setLines] = useState<PosCartLine[]>([]);
  const [qrIndex, setQrIndex] = useState<number | null>(null);

  const addTreatment = (t: TreatmentItem) => {
    if (!parsePrice(t.prijs)) return;
    setLines((prev) =>
      addLine(prev, {
        naam: t.naam,
        prijs: t.prijs,
        barcode: t.barcode,
        categorie: t.categorie,
        kind: "behandeling",
        qty: 1,
      })
    );
    setTab("bon");
  };

  const addProduct = (product: SaleProduct) => {
    setLines((prev) => addLine(prev, linesFromProduct(product)));
    setTab("bon");
  };

  const changeQty = (barcode: string, delta: number) => {
    setLines((prev) =>
      prev
        .map((l) => (l.barcode === barcode ? { ...l, qty: l.qty + delta } : l))
        .filter((l) => l.qty > 0)
    );
  };

  const total = useMemo(
    () => lines.reduce((sum, l) => sum + parsePrice(l.prijs) * l.qty, 0),
    [lines]
  );
  const productTotal = useMemo(
    () =>
      lines
        .filter((l) => l.kind === "product")
        .reduce((sum, l) => sum + parsePrice(l.prijs) * l.qty, 0),
    [lines]
  );
  const treatmentTotal = useMemo(
    () =>
      lines
        .filter((l) => l.kind === "behandeling")
        .reduce((sum, l) => sum + parsePrice(l.prijs) * l.qty, 0),
    [lines]
  );

  const groups = useMemo(() => {
    const map = new Map<string, TreatmentItem[]>();
    for (const t of treatments) {
      const list = map.get(t.categorie) || [];
      list.push(t);
      map.set(t.categorie, list);
    }
    return Array.from(map.entries());
  }, [treatments]);

  const expanded = useMemo(
    () => lines.flatMap((l) => Array.from({ length: l.qty }, () => l)),
    [lines]
  );

  return (
    <div className="space-y-4">
      {lastProduct && (
        <button
          type="button"
          onClick={() => addProduct(lastProduct)}
          className="w-full text-left p-4 bg-white border border-brand-gold/50 rounded-lg hover:border-brand-gold transition-colors"
        >
          <p className="text-xs uppercase tracking-widest text-brand-taupe mb-1">
            Gevonden product — tik om op de bon te zetten
          </p>
          <p className="font-heading text-lg">{lastProduct.naam}</p>
          <p className="text-brand-gold font-bold">
            &euro;{formatEuro(parsePrice(lastProduct.prijs))}
          </p>
        </button>
      )}

      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setTab("behandelingen")}
          className={`flex-1 px-3 py-2 text-xs rounded border transition-colors ${
            tab === "behandelingen"
              ? "bg-brand-dark text-white border-brand-dark"
              : "bg-white border-brand-cream text-brand-taupe"
          }`}
        >
          Behandelingen
        </button>
        <button
          type="button"
          onClick={() => setTab("bon")}
          className={`flex-1 px-3 py-2 text-xs rounded border transition-colors ${
            tab === "bon"
              ? "bg-brand-dark text-white border-brand-dark"
              : "bg-white border-brand-cream text-brand-taupe"
          }`}
        >
          Bon {lines.length > 0 ? `(${lines.reduce((n, l) => n + l.qty, 0)})` : ""}
        </button>
      </div>

      {tab === "behandelingen" && (
        <div className="space-y-5">
          <p className="text-xs text-brand-taupe">
            Tik een behandeling aan. Samen met sieraden op één bon — één keer pinnen
            in Shopify POS.
          </p>
          {groups.map(([cat, items]) => (
            <div key={cat}>
              <p className="text-xs uppercase tracking-widest text-brand-taupe mb-2">
                {cat}
              </p>
              <div className="space-y-2">
                {items.map((t) => {
                  const priced = parsePrice(t.prijs) > 0;
                  return (
                    <button
                      key={t.barcode}
                      type="button"
                      onClick={() => addTreatment(t)}
                      disabled={!priced}
                      className="w-full flex items-center justify-between gap-3 p-3 bg-white border border-brand-cream rounded-lg text-left hover:border-brand-gold transition-colors disabled:opacity-50"
                    >
                      <div className="min-w-0">
                        <p className="font-medium text-sm">{t.naam}</p>
                        {t.duur && (
                          <p className="text-[11px] text-brand-taupe">{t.duur}</p>
                        )}
                      </div>
                      <span className="text-sm font-bold text-brand-gold whitespace-nowrap">
                        {priced ? `€${formatEuro(parsePrice(t.prijs))}` : "Prijs ontbreekt"}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === "bon" && (
        <div className="bg-white rounded-lg border border-brand-cream overflow-hidden">
          {lines.length === 0 ? (
            <p className="p-5 text-sm text-brand-taupe">
              Bon is leeg. Zoek een productcode of tik een behandeling aan.
            </p>
          ) : (
            <>
              <ul className="divide-y divide-brand-cream">
                {lines.map((l) => (
                  <li key={l.barcode} className="p-4 flex items-start gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] uppercase tracking-wider text-brand-taupe">
                        {l.kind === "behandeling" ? "Behandeling" : "Product"} · {l.categorie}
                      </p>
                      <p className="font-medium text-sm">{l.naam}</p>
                      <p className="font-mono text-xs text-brand-taupe">{l.barcode}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-brand-gold">
                        &euro;{formatEuro(parsePrice(l.prijs) * l.qty)}
                      </p>
                      <div className="flex items-center justify-end gap-2 mt-2">
                        <button
                          type="button"
                          onClick={() => changeQty(l.barcode, -1)}
                          className="w-7 h-7 rounded border border-brand-cream"
                        >
                          −
                        </button>
                        <span className="text-sm w-5 text-center">{l.qty}</span>
                        <button
                          type="button"
                          onClick={() => changeQty(l.barcode, 1)}
                          className="w-7 h-7 rounded border border-brand-cream"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
              <div className="p-4 bg-brand-light/70 space-y-1 text-sm">
                <div className="flex justify-between text-brand-taupe">
                  <span>Producten</span>
                  <span>&euro;{formatEuro(productTotal)}</span>
                </div>
                <div className="flex justify-between text-brand-taupe">
                  <span>Behandelingen</span>
                  <span>&euro;{formatEuro(treatmentTotal)}</span>
                </div>
                <div className="flex justify-between font-bold text-lg pt-1">
                  <span>Totaal — 1× pinnen</span>
                  <span className="text-brand-gold">&euro;{formatEuro(total)}</span>
                </div>
              </div>
              <div className="p-4 space-y-2">
                <button
                  type="button"
                  onClick={() => setQrIndex(0)}
                  className="btn-primary w-full text-sm"
                >
                  Toon QR&apos;s voor POS ({expanded.length})
                </button>
                <p className="text-xs text-brand-taupe text-center">
                  Scan elke QR in Shopify POS, daarna één keer afrekenen.
                </p>
                <button
                  type="button"
                  onClick={() => setLines([])}
                  className="w-full text-xs text-brand-taupe underline"
                >
                  Bon leegmaken
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {qrIndex !== null && expanded[qrIndex] && (
        <div className="fixed inset-0 z-50 bg-white flex flex-col items-center justify-between p-6">
          <p className="text-xs uppercase tracking-widest text-brand-taupe mt-4">
            {qrIndex + 1} / {expanded.length} ·{" "}
            {expanded[qrIndex].kind === "behandeling" ? "Behandeling" : "Product"}
          </p>
          <div className="text-center">
            <p className="font-heading text-xl mb-4">{expanded[qrIndex].naam}</p>
            <QRCodeSVG
              value={expanded[qrIndex].barcode}
              size={Math.min(300, typeof window !== "undefined" ? window.innerWidth - 64 : 260)}
              level="M"
            />
            <p className="font-mono text-xl font-bold mt-6 tracking-widest">
              {expanded[qrIndex].barcode}
            </p>
            <p className="text-3xl font-bold text-brand-gold mt-3">
              &euro;{formatEuro(parsePrice(expanded[qrIndex].prijs))}
            </p>
          </div>
          <div className="w-full max-w-sm space-y-3 mb-4">
            <p className="text-center text-sm">
              Bon-totaal: <strong>&euro;{formatEuro(total)}</strong>
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                disabled={qrIndex === 0}
                onClick={() => setQrIndex((i) => Math.max(0, (i ?? 0) - 1))}
                className="flex-1 px-4 py-3 text-sm rounded border border-brand-cream disabled:opacity-30"
              >
                Vorige
              </button>
              {qrIndex < expanded.length - 1 ? (
                <button
                  type="button"
                  onClick={() => setQrIndex((i) => (i ?? 0) + 1)}
                  className="flex-1 btn-primary text-sm"
                >
                  Volgende
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setQrIndex(null)}
                  className="flex-1 btn-primary text-sm"
                >
                  Klaar — pin totaal
                </button>
              )}
            </div>
            <button
              type="button"
              onClick={() => setQrIndex(null)}
              className="w-full text-xs text-brand-taupe"
            >
              Sluiten
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
