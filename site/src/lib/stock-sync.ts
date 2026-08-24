/**
 * Telt de voorraad uit de Sheet op per product.
 *
 * De Sheet heeft soms meerdere regels met dezelfde naam — per exemplaar één
 * regel, of een tweede regel omdat er is bijbesteld. Voor Shopify moet dat één
 * aantal worden, dus regels met dezelfde naam tellen op.
 *
 * Losstaand van Google en Shopify zodat `npm test` deze regels kan nalopen.
 */

import { normalizeTitle } from "./product-match.ts";

export interface StockRow {
  title: string;
  /** `null` = de cel is leeg of bevat tekst; dat is geen voorraad 0. */
  stock: number | null;
}

export interface AggregatedStock {
  title: string;
  quantity: number;
  /** Aantal Sheet-regels dat meetelde. */
  rows: number;
}

/**
 * Alleen producten waarvan minstens één regel een getal heeft, komen terug.
 * Staat er nergens een getal, dan weten we het aantal niet en laten we de
 * voorraad in Shopify met rust — anders zet één lege cel de winkel op
 * uitverkocht.
 */
export function aggregateStockByTitle(rows: StockRow[]): AggregatedStock[] {
  const byTitle = new Map<string, { title: string; quantity: number; rows: number; seen: boolean }>();

  for (const row of rows) {
    const title = (row.title || "").trim();
    if (!title) continue;

    const key = normalizeTitle(title);
    const entry = byTitle.get(key) ?? { title, quantity: 0, rows: 0, seen: false };

    if (row.stock !== null && Number.isFinite(row.stock)) {
      entry.quantity += Math.max(0, Math.floor(row.stock));
      entry.rows += 1;
      entry.seen = true;
    }

    byTitle.set(key, entry);
  }

  return Array.from(byTitle.values())
    .filter((e) => e.seen)
    .map(({ title, quantity, rows }) => ({ title, quantity, rows }));
}

/** Titels waarvoor geen enkel getal in de Sheet staat; die slaan we over. */
export function titlesWithoutStock(rows: StockRow[]): string[] {
  const withNumber = new Set(
    rows.filter((r) => r.stock !== null && Number.isFinite(r.stock)).map((r) => normalizeTitle(r.title))
  );
  const all = new Map<string, string>();
  for (const row of rows) {
    const title = (row.title || "").trim();
    if (title) all.set(normalizeTitle(title), title);
  }
  return Array.from(all.entries())
    .filter(([key]) => !withNumber.has(key))
    .map(([, title]) => title);
}
