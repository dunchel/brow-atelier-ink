/**
 * Beeldbronnen per product, met een tweede kanaal als de eerste wegvalt.
 *
 * De foto-URL's in de Sheet wijzen naar de Vercel Blob-store. Raakt die store
 * geblokkeerd of leeg, dan verdwijnen de productfoto's van de site — niet in
 * één keer, maar druppelsgewijs, omdat gecachte afbeeldingen nog even blijven
 * werken. Dat levert het beeld op van "sommige producten hebben wel een foto,
 * andere niet".
 *
 * Shopify heeft bij het aanmaken van elk product een eigen kopie van dezelfde
 * afbeelding opgeslagen op `cdn.shopify.com`. Die kopie is een volwaardige
 * tweede bron. Deze module zet beide bronnen achter elkaar, zodat de site een
 * foto blijft tonen zolang minstens één kanaal het doet.
 */

import { normalizeTitle } from "./product-match.ts";

/** Host van de Sheet-foto's; de bron die kan wegvallen. */
export const BLOB_HOST_FRAGMENT = "blob.vercel-storage.com";

/**
 * Zet de beeldbronnen van één product op volgorde van voorkeur.
 *
 * De Sheet is de bron van waarheid, dus die foto's staan normaal vooraan.
 * Zodra vaststaat dat de blob-store niet bereikbaar is, zakken ze naar
 * achteren: dan hoeft de bezoeker niet eerst op een mislukte download te
 * wachten. Herstelt de store, dan keert de oude volgorde vanzelf terug —
 * er staat nergens een handmatige schakelaar.
 *
 * @param sheetImages Foto-URL's uit de Sheet (foto, foto_2, foto_3).
 * @param shopifyImages Afbeeldingen van hetzelfde product in Shopify.
 * @param blobReachable Of de blob-store op dit moment bereikbaar is.
 * @returns Unieke URL's, meest kansrijke eerst.
 */
export function orderImageSources(
  sheetImages: string[],
  shopifyImages: string[],
  blobReachable: boolean
): string[] {
  const sheet = sheetImages.filter(Boolean);
  const shopify = shopifyImages.filter(Boolean);

  const blob = sheet.filter((url) => url.includes(BLOB_HOST_FRAGMENT));
  const overig = sheet.filter((url) => !url.includes(BLOB_HOST_FRAGMENT));

  // Sheet-URL's buiten de blob-store blijven altijd vooraan: die zijn niet
  // afhankelijk van de store die stuk kan gaan.
  const volgorde = blobReachable
    ? [...overig, ...blob, ...shopify]
    : [...overig, ...shopify, ...blob];

  return Array.from(new Set(volgorde));
}

/**
 * Kiest wélke set foto's de galerij toont.
 *
 * Belangrijk: de Sheet-foto's en de Shopify-kopieën zijn dezelfde beelden, dus
 * ze achter elkaar plakken zou elke foto dubbel in de galerij zetten. Daarom
 * kiest deze functie één set — die van de bron die het op dit moment doet — en
 * blijft het aantal slides gelijk aan het aantal echte productfoto's.
 *
 * @param sheetImages Foto-URL's uit de Sheet.
 * @param shopifyImages Afbeeldingen van hetzelfde product in Shopify.
 * @param blobReachable Of de blob-store op dit moment bereikbaar is.
 * @returns De set die getoond wordt; leeg als geen van beide bronnen iets heeft.
 */
export function pickGallery(
  sheetImages: string[],
  shopifyImages: string[],
  blobReachable: boolean
): string[] {
  const sheet = sheetImages.filter(Boolean);
  const shopify = shopifyImages.filter(Boolean);

  const bruikbaar = blobReachable
    ? sheet
    : sheet.filter((url) => !url.includes(BLOB_HOST_FRAGMENT));

  if (bruikbaar.length > 0) return Array.from(new Set(bruikbaar));
  if (shopify.length > 0) return Array.from(new Set(shopify));
  return Array.from(new Set(sheet));
}

/**
 * Sleutel om een Sheet-titel aan een Shopify-product te koppelen. Gebruikt
 * dezelfde normalisatie als de bestelflow, zodat "Sora ring" en "Sora Ring"
 * hier net zo goed matchen als daar.
 */
export function mediaKey(title: string): string {
  return normalizeTitle(title);
}
