/**
 * Product data source: reads from a private Google Sheet via Google Sheets API.
 * Falls back to Shopify Storefront API only if the Sheet is not configured.
 */

import { unstable_cache } from "next/cache";
import { google } from "googleapis";
import { getProducts as getShopifyProducts, type ShopifyProduct } from "./shopify";
import { isTreatmentTabName } from "./treatments";
import { parseSheetRows, slugify, tabNameFromRange, type Product } from "./sheet-rows";

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

function isSheetConfigured(): boolean {
  return Boolean(SHEET_ID && GOOGLE_CREDENTIALS_B64);
}

/** Process-geheugen: vangt een 429 op dezelfde warme instance op. */
let staleCache: { data: Product[]; timestamp: number } | null = null;
let inflight: Promise<Product[]> | null = null;
const STALE_TTL = 30 * 60_000;

function sheetsErrorMessage(err: unknown): string {
  if (err && typeof err === "object" && "message" in err && typeof err.message === "string") {
    return err.message;
  }
  return "Google Sheets onbereikbaar";
}

async function loadProductsFromSheet(): Promise<Product[]> {
  const sheets = getSheetsClient();

  const noRetry = { retry: false as const };
  const meta = await sheets.spreadsheets.get(
    {
      spreadsheetId: SHEET_ID,
      fields: "sheets.properties.title",
    },
    noRetry
  );

  const sheetNames = meta.data.sheets?.map((s) => s.properties?.title).filter(Boolean) as string[];
  const catalogTabs = sheetNames.filter((name) => !isTreatmentTabName(name));

  if (catalogTabs.length === 0) return [];

  const batch = await sheets.spreadsheets.values.batchGet(
    {
      spreadsheetId: SHEET_ID,
      ranges: catalogTabs.map((name) => `'${name}'!A1:Z1000`),
    },
    noRetry
  );

  const allProducts: Product[] = [];
  for (const valueRange of batch.data.valueRanges ?? []) {
    const rows = valueRange.values as string[][] | undefined;
    if (!rows || rows.length < 2) continue;
    const tab = tabNameFromRange(valueRange.range || "") || "Onbekend";
    allProducts.push(...parseSheetRows(rows, tab));
  }

  console.log(
    `[Products] Loaded ${allProducts.length} products from ${catalogTabs.length} tabs: ${catalogTabs.join(", ")}`
  );
  return allProducts;
}

const getCachedSheetProducts = unstable_cache(loadProductsFromSheet, ["sheet-products"], {
  revalidate: 60,
  tags: ["products"],
});

async function getProductsFromSheet(fresh = false): Promise<Product[]> {
  if (!isSheetConfigured()) return [];

  if (!fresh && staleCache && Date.now() - staleCache.timestamp < 60_000) {
    return staleCache.data;
  }

  const run = async () => {
    const data = fresh ? await loadProductsFromSheet() : await getCachedSheetProducts();
    staleCache = { data, timestamp: Date.now() };
    return data;
  };

  try {
    if (inflight) return await inflight;
    inflight = run().finally(() => {
      inflight = null;
    });
    return await inflight;
  } catch (err) {
    console.error("[Products] Google Sheets API error:", sheetsErrorMessage(err));
    if (staleCache && Date.now() - staleCache.timestamp < STALE_TTL) {
      return staleCache.data;
    }
    throw err;
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
    // Terugvalpad zonder Sheet: geen aantal bekend, dus niets te syncen.
    stock: null,
  };
}

export async function getAllProducts(options?: { fresh?: boolean }): Promise<Product[]> {
  if (isSheetConfigured()) {
    try {
      return await getProductsFromSheet(options?.fresh);
    } catch {
      // Sheet staat aan; geen incomplete Shopify-catalogus van 20 stuks tonen.
      return staleCache?.data ?? [];
    }
  }

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
