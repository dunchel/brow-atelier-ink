/**
 * Product data source: reads from a private Google Sheet via Google Sheets API.
 * Falls back to Shopify Storefront API if not configured.
 */

import { google } from "googleapis";
import { getProducts as getShopifyProducts, type ShopifyProduct } from "./shopify";

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
}

const SHEET_ID = process.env.GOOGLE_SHEET_ID || "";
const GOOGLE_CREDENTIALS_B64 = process.env.GOOGLE_CREDENTIALS_B64 || "";

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

let sheetsClient: ReturnType<typeof google.sheets> | null = null;

function getSheetsClient() {
  if (sheetsClient) return sheetsClient;
  if (!GOOGLE_CREDENTIALS_B64) throw new Error("GOOGLE_CREDENTIALS_B64 not set");

  const creds = JSON.parse(Buffer.from(GOOGLE_CREDENTIALS_B64, "base64").toString("utf-8"));
  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: creds.client_email,
      private_key: creds.private_key,
    },
    scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
  });
  sheetsClient = google.sheets({ version: "v4", auth });
  return sheetsClient;
}

let productCache: { data: Product[]; timestamp: number } | null = null;
const CACHE_TTL = 60_000; // 1 minuut

function parseSheetRows(rows: string[][], categoryOverride?: string): Product[] {
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
        const voorraad = get("voorraad");
        const beschikbaar = get("beschikbaar") || get("available") || "";
        const category = categoryOverride || get("categorie") || get("category") || get("type");

        // Voorraad > 0 = beschikbaar, ongeacht de "beschikbaar" kolom
        // Als voorraad leeg is, kijk naar beschikbaar kolom (fallback)
        let isAvailable = true;
        if (voorraad !== "") {
          isAvailable = parseFloat(voorraad) > 0;
        } else if (beschikbaar !== "") {
          isAvailable = beschikbaar.toLowerCase() !== "nee";
        }

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
      } as Product;
    })
    .filter((p): p is Product => p !== null);
}

async function getProductsFromSheet(): Promise<Product[]> {
  if (!SHEET_ID || !GOOGLE_CREDENTIALS_B64) return [];

  if (productCache && Date.now() - productCache.timestamp < CACHE_TTL) {
    return productCache.data;
  }

  try {
    const sheets = getSheetsClient();

    const meta = await sheets.spreadsheets.get({
      spreadsheetId: SHEET_ID,
      fields: "sheets.properties.title",
    });

    const sheetNames = meta.data.sheets?.map((s) => s.properties?.title).filter(Boolean) as string[];

    const allProducts: Product[] = [];

    for (const name of sheetNames) {
      const res = await sheets.spreadsheets.values.get({
        spreadsheetId: SHEET_ID,
        range: `'${name}'!A1:Z1000`,
      });

      const rows = res.data.values as string[][] | undefined;
      if (rows && rows.length >= 2) {
        const products = parseSheetRows(rows, name);
        allProducts.push(...products);
      }
    }

    console.log(`[Products] Loaded ${allProducts.length} products from ${sheetNames.length} tabs: ${sheetNames.join(", ")}`);
    productCache = { data: allProducts, timestamp: Date.now() };
    return allProducts;
  } catch (err) {
    console.error("[Products] Google Sheets API error:", err);
    if (productCache) return productCache.data;
    return [];
  }
}

function shopifyToProduct(sp: ShopifyProduct): Product {
  const imgs = sp.images.edges.map((e) => e.node);
  return {
    id: sp.id,
    handle: sp.handle,
    title: sp.title,
    description: sp.description,
    price: sp.priceRange.minVariantPrice.amount,
    category: "",
    brand: "",
    tags: [],
    imageUrl: imgs[0]?.url || "",
    images: imgs.map((i) => i.url),
    imageAlt: imgs[0]?.altText || sp.title,
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
