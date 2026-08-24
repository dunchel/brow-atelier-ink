/**
 * Titelvergelijking tussen Google Sheet en Shopify.
 *
 * De Sheet is de bron van waarheid, maar Shopify slaat titels op zoals ze bij
 * het aanmaken zijn ingetypt. Daardoor lopen hoofdletters, accenten en soort
 * apostrof uiteen ("Sora ring" in de Sheet, "Sora Ring" in Shopify). De
 * REST-filter `products.json?title=` matcht exact, dus zonder normalisatie
 * vindt de bestelflow zulke producten niet.
 */

/** Lowercase, zonder accenten, met genormaliseerde apostrofs en spaties. */
export function normalizeTitle(text: string): string {
  return text
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[‘’ʼ´`]/g, "'")
    .replace(/[–—]/g, "-")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

/**
 * Zelfde regels als Shopify's handleize: accenten weg, alles wat geen letter
 * of cijfer is wordt een streepje. Wijkt bewust af van de slug die de site
 * voor haar eigen /shop-URL's gebruikt; die mag niet veranderen.
 */
export function handleize(text: string): string {
  return normalizeTitle(text)
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

/** True als twee titels hetzelfde product aanduiden. */
export function titlesMatch(a: string, b: string): boolean {
  if (!a || !b) return false;
  if (normalizeTitle(a) === normalizeTitle(b)) return true;
  const ha = handleize(a);
  return ha !== "" && ha === handleize(b);
}

/**
 * Voorraad uit een Sheet-cel. Leeg of niet-numeriek levert null, zodat de
 * aanroeper zelf kan bepalen wat dat betekent — een cel met "ja" is geen 0.
 */
export function parseStockValue(raw: string): number | null {
  const text = (raw || "").trim();
  if (!text) return null;
  const match = text.replace(",", ".").match(/-?\d+(\.\d+)?/);
  if (!match) return null;
  const value = Math.floor(Number(match[0]));
  if (!Number.isFinite(value)) return null;
  return Math.max(0, value);
}
