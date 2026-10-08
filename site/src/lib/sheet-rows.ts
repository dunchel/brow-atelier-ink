/**
 * Zet ruwe Google Sheet-rijen om naar producten.
 *
 * Bewust zonder Google-client of Shopify-import, zodat deze regels los te
 * testen zijn met `npm test`.
 */

import { parseStockValue } from "./product-match.ts";

export interface Product {
  id: string;
  handle: string;
  title: string;
  description: string;
  price: string;
  compareAtPrice?: string;
  category: string;
  brand: string;
  tags: string[];
  imageUrl: string;
  images: string[];
  imageAlt: string;
  available: boolean;
  /** Aantal uit de voorraadkolom. `null` = niets ingevuld, dus géén nul. */
  stock: number | null;
}

/**
 * Prijs uit een Sheet-cel als getal. `null` zodra er geen bedrag staat:
 * leeg, tekst, nul of negatief. Zo'n rij mag nooit als € 0,00 in de winkel
 * belanden, dus de aanroeper laat hem weg in plaats van hem op nul te zetten.
 */
export function parsePriceValue(raw: string | undefined | null): number | null {
  const text = (raw ?? "").trim();
  if (!text) return null;
  const cleaned = text
    .replace(/[€\s]/g, "")
    .replace(/\.(?=\d{3}(?:\D|$))/g, "")
    .replace(",", ".");
  if (!/^-?\d+(\.\d+)?$/.test(cleaned)) return null;
  const num = Number(cleaned);
  if (!Number.isFinite(num) || num <= 0) return null;
  return num;
}

/** Een product is alleen te koop met een echt bedrag erop. */
export function hasSellablePrice(product: Pick<Product, "price">): boolean {
  return parsePriceValue(product.price) !== null;
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

/** Tabnaam uit een Sheets batchGet-range, bijv. `'Mini parfums'!A1:Z1000`. */
export function tabNameFromRange(range: string): string {
  const raw = (range.split("!")[0] || "").trim();
  return raw.replace(/^'+|'+$/g, "");
}

export function parseSheetRows(rows: string[][], categoryOverride?: string): Product[] {
  if (!rows || rows.length < 2) return [];

  const headers: string[] = rows[0].map((h: string) => h.trim().toLowerCase());

  return rows
    .slice(1)
    .map((row: string[], i: number) => {
      const get = (key: string): string => {
        const idx = headers.indexOf(key);
        return idx >= 0 ? (row[idx] || "").trim() : "";
      };

      const title = get("naam") || get("title") || get("product");
      if (!title) return null;

      const priceNumber = parsePriceValue(get("prijs") || get("price"));

      const foto = get("foto") || get("afbeelding") || get("image");
      const foto2 = get("foto_2") || get("foto 2");
      const foto3 = get("foto_3") || get("foto 3");

      const tags = (get("tags") || "")
        .split(/[,;]/)
        .map((t: string) => t.trim())
        .filter(Boolean);

        const brand = get("merk") || get("brand") || get("merk/brand") || "";
        const voorraad =
          get("voorraad") || get("aantal") || get("stuks") || get("qty") || get("stock");
        const beschikbaar = get("beschikbaar") || get("available") || "";
        const category = categoryOverride || get("categorie") || get("category") || get("type");

        // Voorraad > 0 = beschikbaar, ongeacht de "beschikbaar" kolom.
        // Staat er geen getal in de voorraad-cel (leeg, of tekst als "ja"),
        // dan beslist de kolom "beschikbaar" — een niet-numerieke cel mag
        // nooit als voorraad 0 gelden.
        const stock = parseStockValue(voorraad);
        const isAvailable =
          stock !== null ? stock > 0 : beschikbaar.toLowerCase() !== "nee";

        return {
          id: `sheet-${category}-${i}`,
          handle: slugify(title),
          title,
          description: get("beschrijving") || get("description") || get("omschrijving"),
          price: priceNumber === null ? "" : String(priceNumber),
          compareAtPrice: get("oude prijs") || get("was prijs") || get("compare at price") || undefined,
          category,
          brand,
          tags,
          imageUrl: foto,
          images: [foto, foto2, foto3].filter(Boolean),
          imageAlt: get("foto alt") || get("image alt") || title,
          // Zonder bedrag nooit te koop, ook niet als er voorraad staat.
          available: isAvailable && priceNumber !== null,
          stock,
      } as Product;
    })
    .filter((p): p is Product => p !== null);
}
