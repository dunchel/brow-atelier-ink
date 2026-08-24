/**
 * Zoekt (en maakt zo nodig) het Shopify-product dat bij een Sheet-titel hoort.
 *
 * De Sheet is de bron van waarheid voor de catalogus, Shopify alleen voor
 * checkout. Staat een Sheet-product nog niet in Shopify — omdat de batch-sync
 * op /admin/sync-shopify nog niet langs die rij is geweest — dan kan de klant
 * het niet bestellen. Daarom maakt deze module het product bij de eerste
 * bestelling alsnog aan, met exact dezelfde velden als de admin-sync.
 */

import { getAllProducts, type Product } from "./products";
import { getAllInventoryProducts } from "./sheet-inventory";
import { shopifyErrorMessage, shopifyRest } from "./shopify-admin";
import { handleize, normalizeTitle, titlesMatch } from "./product-match";
import { publishProduct } from "./shopify-publish";

export interface ShopifyProductRow {
  id: number;
  title: string;
  handle?: string;
  variants?: { id: number }[];
}

export interface VariantRef {
  variantId: string;
  productTitle: string;
}

/** Resolved varianten kort onthouden; Shopify staat maar 2 calls/sec toe. */
const variantCache = new Map<string, { ref: VariantRef; timestamp: number }>();
const VARIANT_CACHE_TTL = 5 * 60_000;

function toVariantRef(product: ShopifyProductRow): VariantRef | null {
  const variant = product.variants?.[0];
  if (!variant) return null;
  return {
    variantId: `gid://shopify/ProductVariant/${variant.id}`,
    productTitle: product.title,
  };
}

function pickMatch(data: unknown, title: string): ShopifyProductRow | null {
  const products = ((data as { products?: ShopifyProductRow[] })?.products ?? []) as ShopifyProductRow[];
  return products.find((p) => titlesMatch(p.title, title)) ?? null;
}

/**
 * Zoekt een product op titel. Eerst de exacte REST-filter, daarna op handle —
 * die vangt verschillen in hoofdletters en accenten op.
 */
export async function findShopifyProductByTitle(title: string): Promise<ShopifyProductRow | null> {
  const wanted = title.trim();
  if (!wanted) return null;

  const byTitle = await shopifyRest(
    `products.json?title=${encodeURIComponent(wanted)}&limit=25`
  );
  const titleMatch = pickMatch(byTitle, wanted);
  if (titleMatch) return titleMatch;

  const handle = handleize(wanted);
  if (!handle) return null;

  const byHandle = await shopifyRest(
    `products.json?handle=${encodeURIComponent(handle)}&limit=25`
  );
  return pickMatch(byHandle, wanted);
}

export async function createShopifyProduct(product: {
  title: string;
  description: string;
  price: string;
  compareAtPrice?: string;
  imageUrl: string;
  images: string[];
  tags: string[];
  category: string;
  barcode?: string;
}): Promise<ShopifyProductRow> {
  const price = product.price.replace(",", ".");
  const compareAtPrice = product.compareAtPrice?.replace(",", ".") || undefined;

  const imgSrcs = product.images.filter(Boolean).map((src) => ({ src }));
  if (imgSrcs.length === 0 && product.imageUrl) {
    imgSrcs.push({ src: product.imageUrl });
  }

  const data = await shopifyRest("products.json", "POST", {
    product: {
      title: product.title,
      body_html: product.description,
      product_type: product.category,
      tags: product.tags.join(", "),
      status: "active",
      variants: [
        {
          price,
          ...(compareAtPrice ? { compare_at_price: compareAtPrice } : {}),
          ...(product.barcode ? { barcode: product.barcode, sku: product.barcode } : {}),
          inventory_management: null,
          inventory_policy: "continue",
        },
      ],
      images: imgSrcs,
    },
  });

  const err = shopifyErrorMessage(data);
  if (err) throw new Error(err);

  const created = (data as { product?: ShopifyProductRow }).product;
  if (!created) throw new Error("Shopify gaf geen product terug");

  // Zonder publiceren staat het product wel in de admin, maar ziet de
  // Storefront-API het niet en kan de klant het niet in de winkelwagen leggen.
  const publish = await publishProduct(created.id);
  if (publish.status !== "published") {
    lastPublishWarning = publish.reason;
    console.warn(`[Shopify] "${created.title}" niet gepubliceerd: ${publish.reason}`);
  }

  return created;
}

let lastPublishWarning: string | null = null;

/** De laatste reden waarom publiceren niet lukte, voor de admin-sync. */
export function takePublishWarning(): string | null {
  const warning = lastPublishWarning;
  lastPublishWarning = null;
  return warning;
}

export type SheetLookup =
  | { status: "unknown" }
  | { status: "out_of_stock"; product: Product }
  | { status: "in_stock"; product: Product };

/**
 * Zoekt de titel op in de catalogus (Sheet, of Shopify als de Sheet niet is
 * ingesteld). Rijen met dezelfde naam tellen samen op: de Sheet heeft per
 * exemplaar een regel, dus drie regels "Ovi oorbellen" is voorraad 3.
 */
export async function lookupCatalogProduct(title: string): Promise<SheetLookup> {
  const wanted = normalizeTitle(title);
  if (!wanted) return { status: "unknown" };

  const products = await getAllProducts();
  const matches = products.filter((p) => titlesMatch(p.title, title));
  if (matches.length === 0) return { status: "unknown" };

  const product = matches.find((p) => p.available) ?? matches[0];
  const available = matches.some((p) => p.available);
  return available ? { status: "in_stock", product } : { status: "out_of_stock", product };
}

async function barcodeForTitle(title: string): Promise<string | undefined> {
  try {
    const inventory = await getAllInventoryProducts();
    return inventory.find((p) => titlesMatch(p.naam, title))?.barcode || undefined;
  } catch {
    return undefined;
  }
}

export type ResolveResult =
  | { status: "ok"; ref: VariantRef; created: boolean }
  | { status: "out_of_stock"; title: string }
  | { status: "unknown" };

/**
 * Levert de variant waarmee besteld kan worden. Bestaat het product nog niet
 * in Shopify, dan wordt het aangemaakt — maar alleen als het in de catalogus
 * staat én voorraad heeft, zodat een willekeurige titel van buiten niets
 * aanmaakt.
 */
export async function resolveOrderableVariant(title: string): Promise<ResolveResult> {
  const wanted = title.trim();
  if (!wanted) return { status: "unknown" };

  const cached = variantCache.get(normalizeTitle(wanted));
  if (cached && Date.now() - cached.timestamp < VARIANT_CACHE_TTL) {
    return { status: "ok", ref: cached.ref, created: false };
  }

  const catalog = await lookupCatalogProduct(wanted);
  if (catalog.status === "unknown") return { status: "unknown" };
  if (catalog.status === "out_of_stock") {
    return { status: "out_of_stock", title: catalog.product.title };
  }

  const canonicalTitle = catalog.product.title;

  const existing = await findShopifyProductByTitle(canonicalTitle);
  if (existing) {
    const ref = toVariantRef(existing);
    if (ref) {
      variantCache.set(normalizeTitle(wanted), { ref, timestamp: Date.now() });
      variantCache.set(normalizeTitle(canonicalTitle), { ref, timestamp: Date.now() });
      return { status: "ok", ref, created: false };
    }
  }

  const created = await createShopifyProduct({
    title: canonicalTitle,
    description: catalog.product.description,
    price: catalog.product.price,
    compareAtPrice: catalog.product.compareAtPrice,
    imageUrl: catalog.product.imageUrl,
    images: catalog.product.images,
    tags: catalog.product.tags,
    category: catalog.product.category,
    barcode: await barcodeForTitle(canonicalTitle),
  });

  const ref = toVariantRef(created);
  if (!ref) return { status: "unknown" };

  console.log(`[Shopify] Product aangemaakt bij bestelling: ${canonicalTitle}`);
  variantCache.set(normalizeTitle(wanted), { ref, timestamp: Date.now() });
  variantCache.set(normalizeTitle(canonicalTitle), { ref, timestamp: Date.now() });
  return { status: "ok", ref, created: true };
}
