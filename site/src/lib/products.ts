/**
 * Product data source: reads from a private Google Sheet via Google Sheets API.
 * Falls back to Shopify Storefront API if not configured.
 */

import { google } from "googleapis";
import { getProducts as getShopifyProducts, type ShopifyProduct } from "./shopify";
import { isTreatmentTabName } from "./treatments";
import { parseSheetRows, slugify, type Product } from "./sheet-rows";

export { parseSheetRows, slugify };
export type { Product };

const SHEET_ID = process.env.GOOGLE_SHEET_ID || "";
const GOOGLE_CREDENTIALS_B64 = process.env.GOOGLE_CREDENTIALS_B64 || "";

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
      if (isTreatmentTabName(name)) continue;

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
