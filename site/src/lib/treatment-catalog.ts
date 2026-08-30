const TREATMENT_TAB_ALIASES = new Set([
  "behandelingen",
  "behandeling",
  "diensten",
  "treatments",
]);

export function isTreatmentTabName(name: string): boolean {
  return TREATMENT_TAB_ALIASES.has(name.trim().toLowerCase());
}

export function isTreatmentBarcode(barcode: string): boolean {
  return /^BA-BHL-/i.test(barcode.trim());
}

/** Zichtbaar op de tegel; geen stille checkout-fout. */
export const TREATMENT_NOT_IN_SHOPIFY =
  "Deze behandeling staat nog niet in kassa/Shopify.";

export function isPricedTreatment(prijs: string): boolean {
  return parseFloat((prijs || "").replace(",", ".")) > 0;
}

/**
 * Filter voor de shop-catalogus. Alleen type/tag/barcode/tab — niet de
 * titel-regex van omzet, anders verdwijnt iets als Zoes Browjam.
 */
export function isTreatmentCatalogItem(input: {
  productType?: string;
  tags?: string[];
  sku?: string;
  barcode?: string;
  category?: string;
}): boolean {
  if (input.category && isTreatmentTabName(input.category)) return true;
  if (input.barcode && isTreatmentBarcode(input.barcode)) return true;
  if (input.sku && isTreatmentBarcode(input.sku)) return true;
  const type = (input.productType || "").toLowerCase();
  if (type.includes("behandeling") || type.includes("treatment") || type.includes("dienst")) {
    return true;
  }
  const tags = (input.tags || []).map((t) => t.toLowerCase());
  return tags.some((t) => t === "behandeling" || t === "behandelingen" || t === "treatment");
}

export function groupTreatmentsByCategory<T extends { categorie: string }>(
  treatments: T[]
): { categorie: string; items: T[] }[] {
  const map = new Map<string, T[]>();
  for (const t of treatments) {
    const categorie = (t.categorie || "").trim() || "Behandelingen";
    const list = map.get(categorie) || [];
    list.push(t);
    map.set(categorie, list);
  }
  return Array.from(map.entries()).map(([categorie, items]) => ({ categorie, items }));
}
