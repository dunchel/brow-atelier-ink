/**
 * Product data source: reads from a public Google Sheet (CSV export).
 *
 * How it works:
 * 1. Someone fills in products in a Google Sheet
 * 2. The sheet is published as CSV (File > Share > Publish to web > CSV)
 * 3. This code fetches that CSV and turns it into product data
 * 4. The website shows the products automatically
 *
 * If no Google Sheet is configured, falls back to Shopify Storefront API.
 * If neither is configured, shows placeholder content.
 */

import { getProducts as getShopifyProducts, type ShopifyProduct } from "./shopify";

export interface Product {
  id: string;
  handle: string;
  title: string;
  description: string;
  price: string;
  compareAtPrice?: string;
  category: string;
  tags: string[];
  imageUrl: string;
  imageAlt: string;
  available: boolean;
}

const GOOGLE_SHEET_CSV_URL = process.env.NEXT_PUBLIC_GOOGLE_SHEET_CSV_URL || "";

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function parseCSV(csv: string): Record<string, string>[] {
  const lines = csv.split("\n").filter((line) => line.trim());
  if (lines.length < 2) return [];

  const headers = lines[0].split(",").map((h) => h.trim().toLowerCase());
  const rows: Record<string, string>[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values: string[] = [];
    let current = "";
    let inQuotes = false;

    for (const char of lines[i]) {
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === "," && !inQuotes) {
        values.push(current.trim());
        current = "";
      } else {
        current += char;
      }
    }
    values.push(current.trim());

    const row: Record<string, string> = {};
    headers.forEach((header, idx) => {
      row[header] = values[idx] || "";
    });
    rows.push(row);
  }

  return rows;
}

async function getProductsFromSheet(): Promise<Product[]> {
  if (!GOOGLE_SHEET_CSV_URL) return [];

  try {
    const res = await fetch(GOOGLE_SHEET_CSV_URL, { next: { revalidate: 300 } });
    if (!res.ok) return [];

    const csv = await res.text();
    const rows = parseCSV(csv);

    return rows
      .filter((row) => row["naam"] || row["title"] || row["product"])
      .map((row, i) => {
        const title = row["naam"] || row["title"] || row["product"] || "";
        return {
          id: `sheet-${i}`,
          handle: slugify(title),
          title,
          description: row["beschrijving"] || row["description"] || row["omschrijving"] || "",
          price: row["prijs"] || row["price"] || "0",
          compareAtPrice: row["oude prijs"] || row["was prijs"] || row["compare at price"] || undefined,
          category: row["categorie"] || row["category"] || row["type"] || "",
          tags: (row["tags"] || "").split(",").map((t) => t.trim()).filter(Boolean),
          imageUrl: row["foto"] || row["afbeelding"] || row["image"] || row["foto url"] || "",
          imageAlt: row["foto alt"] || row["image alt"] || title,
          available: (row["beschikbaar"] || row["available"] || "ja").toLowerCase() !== "nee",
        };
      })
      .filter((p) => p.title);
  } catch {
    return [];
  }
}

function shopifyToProduct(sp: ShopifyProduct): Product {
  const img = sp.images.edges[0]?.node;
  return {
    id: sp.id,
    handle: sp.handle,
    title: sp.title,
    description: sp.description,
    price: sp.priceRange.minVariantPrice.amount,
    category: "",
    tags: [],
    imageUrl: img?.url || "",
    imageAlt: img?.altText || sp.title,
    available: true,
  };
}

export async function getAllProducts(): Promise<Product[]> {
  // Priority 1: Google Sheet
  const sheetProducts = await getProductsFromSheet();
  if (sheetProducts.length > 0) return sheetProducts;

  // Priority 2: Shopify
  try {
    const shopifyProducts = await getShopifyProducts();
    if (shopifyProducts.length > 0) return shopifyProducts.map(shopifyToProduct);
  } catch {
    // Shopify not configured
  }

  return [];
}

export async function getProductBySlug(slug: string): Promise<Product | null> {
  const products = await getAllProducts();
  return products.find((p) => p.handle === slug) || null;
}

export function formatProductPrice(price: string): string {
  const num = parseFloat(price.replace(",", "."));
  if (isNaN(num)) return price;
  return new Intl.NumberFormat("nl-NL", {
    style: "currency",
    currency: "EUR",
  }).format(num);
}
