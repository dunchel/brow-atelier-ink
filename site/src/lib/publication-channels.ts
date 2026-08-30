export interface Publication {
  id: string;
  name: string;
}

export type PublicationKind = "pos" | "headless" | "storefront" | "other";

/**
 * Shopify-kanaalnamen zijn Engels. "Shop" is de Shop-app, niet de POS.
 * Headless heet hier "Brow Atelier Ink Headless".
 */
export function publicationKind(name: string): PublicationKind {
  const n = name.trim().toLowerCase();
  if (n === "point of sale" || n === "pos" || n.includes("point of sale")) return "pos";
  if (n.includes("headless") || n === "hydrogen") return "headless";
  if (
    n.includes("online store") ||
    n === "shop" ||
    n.includes("facebook") ||
    n.includes("instagram") ||
    n.includes("tiktok")
  ) {
    return "storefront";
  }
  return "other";
}

/** Behandelingen: POS (pin in de winkel) + Headless (site-kassa). Niet de webshop. */
export function treatmentPublishChannels(publications: Publication[]): Publication[] {
  return publications.filter((p) => {
    const kind = publicationKind(p.name);
    return kind === "pos" || kind === "headless";
  });
}

/** Webshop / social — behandelingen horen hier niet. */
export function treatmentUnpublishChannels(publications: Publication[]): Publication[] {
  return publications.filter((p) => publicationKind(p.name) === "storefront");
}
