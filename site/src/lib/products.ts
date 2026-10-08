/**
 * Product data source: reads from a private Google Sheet via Google Sheets API.
 * Falls back to Shopify Storefront API only if the Sheet is not configured.
 */

import { getProducts as getShopifyProducts, type ShopifyProduct } from "./shopify";
import { getSheetSnapshot } from "./sheet-read";
import { isTreatmentCatalogItem, isTreatmentTabName } from "./treatment-catalog";
import { hasSellablePrice, parsePriceValue, parseSheetRows, slugify, type Product } from "./sheet-rows";

export { hasSellablePrice, parsePriceValue, parseSheetRows, slugify };
export type { Product };

const SHEET_ID = process.env.GOOGLE_SHEET_ID || "";
const GOOGLE_CREDENTIALS_B64 = process.env.GOOGLE_CREDENTIALS_B64 || "";

function isSheetConfigured(): boolean {
  return Boolean(SHEET_ID && GOOGLE_CREDENTIALS_B64);
}

/** Laatste goede catalogus als de gedeelde Sheet-cache ook leeg is. */
let staleCache: { data: Product[]; timestamp: number } | null = null;
const STALE_TTL = 24 * 60 * 60_000;

function sheetsErrorMessage(err: unknown): string {
  if (err && typeof err === "object" && "message" in err && typeof err.message === "string") {
    return err.message;
  }
  return "Google Sheets onbereikbaar";
}

/** Rijen die wel een naam hebben maar geen bedrag; voor de admin-melding. */
let priceless: { title: string; category: string }[] = [];

/** Welke Sheet-rijen zijn overgeslagen omdat er geen prijs in staat. */
export function getPricelessRows(): { title: string; category: string }[] {
  return priceless;
}

function productsFromSnapshot(tabs: { name: string; rows: string[][] }[]): Product[] {
  const allProducts: Product[] = [];
  const skipped: { title: string; category: string }[] = [];
  for (const tab of tabs) {
    if (isTreatmentTabName(tab.name)) continue;
    if (!tab.rows || tab.rows.length < 2) continue;
    for (const product of parseSheetRows(tab.rows, tab.name)) {
      // Een rij zonder bedrag hoort niet in de winkel: anders staat hij voor
      // € 0,00 online en kan iemand hem bestellen.
      if (!hasSellablePrice(product)) {
        skipped.push({ title: product.title, category: product.category });
        continue;
      }
      allProducts.push(product);
    }
  }
  priceless = skipped;
  return allProducts;
}

async function getProductsFromSheet(fresh = false): Promise<Product[]> {
  if (!isSheetConfigured()) return [];

  try {
    const snapshot = await getSheetSnapshot({ fresh });
    const data = productsFromSnapshot(snapshot.tabs);
    staleCache = { data, timestamp: Date.now() };
    return data;
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
    const catalog = shopifyProducts.filter(
      (sp) => !isTreatmentCatalogItem({ productType: sp.productType, tags: sp.tags })
    );
    if (catalog.length > 0) return catalog.map(shopifyToProduct);
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
