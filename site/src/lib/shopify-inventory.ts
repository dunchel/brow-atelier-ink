/**
 * Voorraad uit de Sheet naar Shopify.
 *
 * De Sheet is de bron van waarheid, dus we zetten een absoluut aantal en geen
 * verschil. Producten die deze site aanmaakt staan op `inventory_management:
 * null` (Shopify houdt niets bij), dus het artikel moet eerst op `tracked`
 * voordat er een aantal op kan.
 *
 * Vereist de scopes `read_locations`, `read_inventory` en `write_inventory`.
 * Zolang die niet zijn goedgekeurd op de winkel geeft Shopify "access denied";
 * dat melden we terug in plaats van de sync te laten klappen.
 */

import { shopifyGraphql } from "./shopify-admin";

export const MISSING_INVENTORY_SCOPE =
  "Het Admin-token heeft read_inventory, write_inventory en read_locations nog niet. " +
  "Die rechten staan al in versie 3.0 van de app Website Admin, maar moeten één keer " +
  "worden goedgekeurd: open admin.shopify.com/store/brow-atelier-ink/apps, klik Website " +
  "Admin en bevestig de nieuwe rechten. Klik daarna hier Controleer rechten.";

export interface ShopifyLocation {
  id: string;
  name: string;
}

export interface VariantInventoryRef {
  variantId: string;
  inventoryItemId: string;
  tracked: boolean;
  currentQuantity: number | null;
}

function isMissingScope(errors?: { message: string }[]): boolean {
  return (errors ?? []).some((e) =>
    /access denied|read_inventory|write_inventory|read_locations/i.test(e.message)
  );
}

export class MissingInventoryScope extends Error {
  constructor() {
    super(MISSING_INVENTORY_SCOPE);
    this.name = "MissingInventoryScope";
  }
}

function throwIfMissingScope(errors?: { message: string }[]) {
  if (isMissingScope(errors)) throw new MissingInventoryScope();
}

let locationCache: { location: ShopifyLocation; timestamp: number } | null = null;
const LOCATION_CACHE_TTL = 10 * 60_000;

/**
 * De locatie waar de voorraad op geboekt wordt. Bij meerdere locaties pakken
 * we de eerste actieve die voorraad mag voeren, en loggen welke dat is.
 */
export async function getPrimaryLocation(): Promise<ShopifyLocation> {
  if (locationCache && Date.now() - locationCache.timestamp < LOCATION_CACHE_TTL) {
    return locationCache.location;
  }

  const res = await shopifyGraphql(`{
    locations(first: 20, includeInactive: false) {
      edges { node { id name isActive fulfillsOnlineOrders } }
    }
  }`);

  throwIfMissingScope(res.errors);
  if (res.errors?.length) throw new Error(res.errors[0].message);

  const edges =
    ((res.data?.locations as { edges?: { node: ShopifyLocation & { isActive: boolean } }[] } | undefined)
      ?.edges ?? []);
  const active = edges.map((e) => e.node).filter((n) => n.isActive !== false);

  if (active.length === 0) throw new Error("Geen actieve locatie gevonden in Shopify");

  const location = { id: active[0].id, name: active[0].name };
  if (active.length > 1) {
    console.log(
      `[Voorraad] ${active.length} locaties gevonden, gekozen: ${location.name}. ` +
        `Overige: ${active.slice(1).map((l) => l.name).join(", ")}`
    );
  }

  locationCache = { location, timestamp: Date.now() };
  return location;
}

/** Zoekt de variant en het inventory item van een product op titel. */
export async function findVariantInventory(
  title: string,
  locationId: string
): Promise<VariantInventoryRef | null> {
  const res = await shopifyGraphql(
    `query find($query: String!, $locationId: ID!) {
      products(first: 5, query: $query) {
        edges {
          node {
            title
            variants(first: 1) {
              edges {
                node {
                  id
                  inventoryItem {
                    id
                    tracked
                    inventoryLevel(locationId: $locationId) {
                      quantities(names: ["available"]) { name quantity }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }`,
    { query: `title:'${title.replace(/'/g, "\\'")}'`, locationId }
  );

  throwIfMissingScope(res.errors);
  if (res.errors?.length) throw new Error(res.errors[0].message);

  const edges =
    ((res.data?.products as { edges?: { node: Record<string, unknown> }[] } | undefined)?.edges ?? []);
  const match = edges.find(
    (e) => String(e.node.title).trim().toLowerCase() === title.trim().toLowerCase()
  );
  if (!match) return null;

  const variant = (
    (match.node.variants as { edges?: { node: Record<string, unknown> }[] } | undefined)?.edges ?? []
  )[0]?.node;
  if (!variant) return null;

  const item = variant.inventoryItem as
    | { id: string; tracked: boolean; inventoryLevel?: { quantities?: { name: string; quantity: number }[] } }
    | undefined;
  if (!item) return null;

  const available = item.inventoryLevel?.quantities?.find((q) => q.name === "available");

  return {
    variantId: String(variant.id),
    inventoryItemId: item.id,
    tracked: Boolean(item.tracked),
    currentQuantity: available ? available.quantity : null,
  };
}

/** Zonder tracking accepteert Shopify geen aantal op het artikel. */
export async function enableTracking(inventoryItemId: string): Promise<void> {
  const res = await shopifyGraphql(
    `mutation track($id: ID!) {
      inventoryItemUpdate(id: $id, input: { tracked: true }) {
        userErrors { field message }
      }
    }`,
    { id: inventoryItemId }
  );

  throwIfMissingScope(res.errors);
  if (res.errors?.length) throw new Error(res.errors[0].message);

  const userErrors =
    ((res.data?.inventoryItemUpdate as { userErrors?: { message: string }[] } | undefined)?.userErrors ?? []);
  if (userErrors.length) throw new Error(userErrors[0].message);
}

/**
 * Zet het absolute aantal. `ignoreCompareQuantity` staat aan omdat de Sheet
 * leidend is; we willen niet dat de sync afketst op een tussentijdse verkoop.
 */
export async function setAvailableQuantity(
  inventoryItemId: string,
  locationId: string,
  quantity: number
): Promise<void> {
  const res = await shopifyGraphql(
    `mutation setStock($input: InventorySetQuantitiesInput!) {
      inventorySetQuantities(input: $input) {
        userErrors { field message }
      }
    }`,
    {
      input: {
        name: "available",
        reason: "correction",
        ignoreCompareQuantity: true,
        quantities: [
          {
            inventoryItemId,
            locationId,
            quantity: Math.max(0, Math.floor(quantity)),
          },
        ],
      },
    }
  );

  throwIfMissingScope(res.errors);
  if (res.errors?.length) throw new Error(res.errors[0].message);

  const userErrors =
    ((res.data?.inventorySetQuantities as { userErrors?: { message: string }[] } | undefined)?.userErrors ??
      []);
  if (userErrors.length) throw new Error(userErrors[0].message);
}
