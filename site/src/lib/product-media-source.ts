/**
 * Haalt de tweede beeldbron op: de afbeeldingen die Shopify zelf bewaart.
 *
 * Bij het aanmaken van een product downloadt Shopify de meegegeven foto en
 * bewaart een eigen kopie op `cdn.shopify.com`. Die kopie blijft staan, ook
 * als de oorspronkelijke Vercel Blob-store wegvalt. Deze module leest die
 * kopieën uit de Admin API en test of de blob-store nog bereikbaar is, zodat
 * `orderImageSources` de juiste volgorde kan kiezen.
 *
 * Beide resultaten worden gecacht: dit draait op elke productpagina en de
 * Admin API staat maar twee calls per seconde toe.
 */

import { unstable_cache } from "next/cache";
import { shopifyRest } from "./shopify-admin";
import { BLOB_HOST_FRAGMENT, mediaKey } from "./product-media";

interface AdminProductRow {
  id: number;
  title: string;
  images?: { src?: string }[];
}

/**
 * Alle Shopify-afbeeldingen, gesleuteld op genormaliseerde producttitel.
 *
 * Pagineert op `since_id` in plaats van de Link-header, omdat `shopifyRest`
 * alleen de JSON teruggeeft.
 */
async function loadShopifyMedia(): Promise<Record<string, string[]>> {
  const perTitle: Record<string, string[]> = {};
  let sinceId = 0;

  for (let page = 0; page < 12; page++) {
    const data = await shopifyRest(
      `products.json?limit=250&since_id=${sinceId}&fields=id,title,images`
    );
    const products = (data?.products ?? []) as AdminProductRow[];
    if (products.length === 0) break;

    for (const product of products) {
      const urls = (product.images ?? []).map((i) => i?.src).filter((s): s is string => !!s);
      if (urls.length === 0) continue;
      const key = mediaKey(product.title);
      if (!perTitle[key]) perTitle[key] = urls;
    }

    sinceId = products[products.length - 1].id;
    if (products.length < 250) break;
  }

  console.log(`[Media] ${Object.keys(perTitle).length} producten met een Shopify-afbeelding`);
  return perTitle;
}

const cachedShopifyMedia = unstable_cache(loadShopifyMedia, ["shopify-media"], {
  revalidate: 900,
  tags: ["products"],
});

export async function getShopifyMedia(): Promise<Record<string, string[]>> {
  try {
    return await cachedShopifyMedia();
  } catch (err) {
    // Geen tweede bron is vervelend, maar mag de catalogus niet breken.
    console.error("[Media] Shopify-afbeeldingen ophalen mislukt:", err);
    return {};
  }
}

/**
 * Test of de blob-store nog uitlevert.
 *
 * Eén verzoek per kwartier op een echte foto-URL. Blokkeert Vercel de store,
 * dan antwoordt hij met 403 "Your store is blocked" en zakken de blob-URL's
 * naar achteren. Komt de store terug, dan herstelt de volgorde zich vanzelf
 * bij de volgende controle.
 */
async function probeBlob(sampleUrl: string): Promise<boolean> {
  try {
    const res = await fetch(sampleUrl, {
      headers: { Range: "bytes=0-32" },
      cache: "no-store",
    });
    if (!res.ok && res.status !== 206) return false;
    return (res.headers.get("content-type") ?? "").startsWith("image/");
  } catch {
    return false;
  }
}

const cachedBlobProbe = unstable_cache(probeBlob, ["blob-probe"], {
  revalidate: 900,
  tags: ["products"],
});

/**
 * Of de blob-store bereikbaar is. Zonder blob-URL's in de catalogus is er
 * niets te testen en blijft de normale volgorde gelden.
 */
export async function isBlobReachable(imageUrls: string[]): Promise<boolean> {
  const sample = imageUrls.find((url) => url.includes(BLOB_HOST_FRAGMENT));
  if (!sample) return true;

  try {
    return await cachedBlobProbe(sample);
  } catch {
    return false;
  }
}
