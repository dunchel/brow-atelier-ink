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
  /**
   * Alternatieve URL's voor de eerste afbeelding, meest kansrijke eerst.
   * Gevuld zodra de Shopify-kopie bekend is; leeg betekent: alleen `images`.
   */
  imageSources?: string[];
  imageAlt: string;
  available: boolean;
  /** Aantal uit de voorraadkolom. `null` = niets ingevuld, dus géén nul. */
  stock: number | null;
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
          price: get("prijs") || get("price") || "0",
          compareAtPrice: get("oude prijs") || get("was prijs") || get("compare at price") || undefined,
          category,
          brand,
          tags,
          imageUrl: foto,
          images: [foto, foto2, foto3].filter(Boolean),
          imageAlt: get("foto alt") || get("image alt") || title,
          available: isAvailable,
          stock,
      } as Product;
    })
    .filter((p): p is Product => p !== null);
}
