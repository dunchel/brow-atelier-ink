const domain = process.env.NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN!;
const storefrontAccessToken =
  process.env.NEXT_PUBLIC_SHOPIFY_STOREFRONT_ACCESS_TOKEN!;

const STOREFRONT_URL = `https://${domain}/api/2025-01/graphql.json`;

export interface CartLine {
  id: string;
  quantity: number;
  merchandise: {
    id: string;
    title: string;
    product: {
      title: string;
      handle: string;
      images: { edges: { node: { url: string; altText: string | null } }[] };
    };
    price: { amount: string; currencyCode: string };
  };
}

export interface Cart {
  id: string;
  checkoutUrl: string;
  totalQuantity: number;
  cost: {
    totalAmount: { amount: string; currencyCode: string };
    subtotalAmount: { amount: string; currencyCode: string };
  };
  lines: { edges: { node: CartLine }[] };
}

const CART_FRAGMENT = `
  fragment CartFields on Cart {
    id
    checkoutUrl
    totalQuantity
    cost {
      totalAmount { amount currencyCode }
      subtotalAmount { amount currencyCode }
    }
    lines(first: 100) {
      edges {
        node {
          id
          quantity
          merchandise {
            ... on ProductVariant {
              id
              title
              product {
                title
                handle
                images(first: 1) { edges { node { url altText } } }
              }
              price { amount currencyCode }
            }
          }
        }
      }
    }
  }
`;

async function storeFetch(query: string, variables?: Record<string, unknown>) {
  const res = await fetch(STOREFRONT_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Shopify-Storefront-Access-Token": storefrontAccessToken,
    },
    body: JSON.stringify({ query, variables }),
  });

  if (!res.ok) {
    const text = await res.text();
    console.error("[Shopify API] HTTP error:", res.status, text);
    throw new Error(`Shopify API fout (${res.status}): ${text}`);
  }

  const json = await res.json();

  if (json.errors) {
    console.error("[Shopify API] GraphQL errors:", JSON.stringify(json.errors));
    throw new Error(`Shopify GraphQL fout: ${json.errors[0]?.message ?? "onbekend"}`);
  }

  return json;
}

function checkUserErrors(errors: { field: string; message: string }[] | undefined) {
  if (errors?.length) {
    console.error("[Shopify] userErrors:", JSON.stringify(errors));
    throw new Error(errors[0].message);
  }
}

export async function createCart(variantId: string, quantity = 1): Promise<Cart> {
  const { data } = await storeFetch(
    `${CART_FRAGMENT}
    mutation cartCreate($input: CartInput!) {
      cartCreate(input: $input) {
        cart { ...CartFields }
        userErrors { field message }
      }
    }`,
    { input: { lines: [{ merchandiseId: variantId, quantity }] } }
  );
  checkUserErrors(data?.cartCreate?.userErrors);
  return data.cartCreate.cart;
}

export async function getCart(cartId: string): Promise<Cart | null> {
  const { data } = await storeFetch(
    `${CART_FRAGMENT}
    query getCart($cartId: ID!) {
      cart(id: $cartId) { ...CartFields }
    }`,
    { cartId }
  );
  return data?.cart ?? null;
}

export async function addToCart(cartId: string, variantId: string, quantity = 1): Promise<Cart> {
  const { data } = await storeFetch(
    `${CART_FRAGMENT}
    mutation cartLinesAdd($cartId: ID!, $lines: [CartLineInput!]!) {
      cartLinesAdd(cartId: $cartId, lines: $lines) {
        cart { ...CartFields }
        userErrors { field message }
      }
    }`,
    { cartId, lines: [{ merchandiseId: variantId, quantity }] }
  );
  checkUserErrors(data?.cartLinesAdd?.userErrors);
  return data.cartLinesAdd.cart;
}

export async function updateCartLine(cartId: string, lineId: string, quantity: number): Promise<Cart> {
  const { data } = await storeFetch(
    `${CART_FRAGMENT}
    mutation cartLinesUpdate($cartId: ID!, $lines: [CartLineUpdateInput!]!) {
      cartLinesUpdate(cartId: $cartId, lines: $lines) {
        cart { ...CartFields }
        userErrors { field message }
      }
    }`,
    { cartId, lines: [{ id: lineId, quantity }] }
  );
  checkUserErrors(data?.cartLinesUpdate?.userErrors);
  return data.cartLinesUpdate.cart;
}

export async function removeCartLine(cartId: string, lineId: string): Promise<Cart> {
  const { data } = await storeFetch(
    `${CART_FRAGMENT}
    mutation cartLinesRemove($cartId: ID!, $lineIds: [ID!]!) {
      cartLinesRemove(cartId: $cartId, lineIds: $lineIds) {
        cart { ...CartFields }
        userErrors { field message }
      }
    }`,
    { cartId, lineIds: [lineId] }
  );
  checkUserErrors(data?.cartLinesRemove?.userErrors);
  return data.cartLinesRemove.cart;
}

/** Het numerieke deel van een variant-gid; leeg als het geen variant-id is. */
export function variantNumericId(variantId: string): string {
  const match = (variantId || "").match(/(?:gid:\/\/shopify\/ProductVariant\/)?(\d+)$/);
  return match ? match[1] : "";
}

/** Shopify weigert de Storefront-cart als het product niet op dat kanaal staat. */
export function isMerchandiseMissingError(err: unknown): boolean {
  const message = err instanceof Error ? err.message : String(err ?? "");
  return /merchandise .* does not exist/i.test(message);
}

/** Klanttekst: In winkelwagen blijft op de site, nooit stil naar checkout. */
export const CART_ADD_UNAVAILABLE_MESSAGE =
  "Dit product kon niet in je mandje. Het staat nog niet op het verkoopkanaal van de webshop. Gebruik Koop nu, of zet het product op verkoopkanalen via Admin → Sync Shopify.";

export function forgetStorefrontVariant(variantId: string) {
  storefrontVariantCache.delete(variantId);
}

/**
 * Checkout-link buiten de Storefront-API om — alleen voor Koop nu / Afrekenen.
 *
 * Producten die de sync aanmaakt staan wel op de Online Store, maar niet in
 * het verkoopkanaal van het Storefront-token. `cartCreate` weigert ze dan met
 * "The merchandise with id ... does not exist". In winkelwagen mag deze URL
 * niet gebruiken; die blijft op de site. Koop nu mag wél naar checkout.
 */
export function buildDirectCheckoutUrl(
  variantId: string,
  quantity = 1,
  options: { returnTo?: string } = {}
): string | null {
  const numeric = variantNumericId(variantId);
  if (!numeric || !domain) return null;
  const qty = Math.max(1, Math.min(20, Math.floor(quantity) || 1));
  const base = `https://${domain}/cart/${numeric}:${qty}`;
  // Zonder return_to stuurt Shopify meteen door naar de checkout.
  return options.returnTo ? `${base}?return_to=${encodeURIComponent(options.returnTo)}` : base;
}

const storefrontVariantCache = new Map<string, { ok: boolean; timestamp: number }>();
const STOREFRONT_CHECK_TTL = 5 * 60_000;

/**
 * Kan de Storefront-API deze variant in de site-cart leggen? Zo niet, dan
 * hangt het product niet aan het verkoopkanaal van dit token.
 */
export async function isVariantInStorefront(variantId: string): Promise<boolean> {
  const cached = storefrontVariantCache.get(variantId);
  if (cached && Date.now() - cached.timestamp < STOREFRONT_CHECK_TTL) return cached.ok;

  let ok = false;
  try {
    const { data } = await storeFetch(
      `query variantExists($id: ID!) {
        node(id: $id) {
          ... on ProductVariant { id }
        }
      }`,
      { id: variantId }
    );
    ok = Boolean(data?.node?.id);
  } catch (err) {
    console.error("[Cart] Storefront-check mislukt:", err);
    ok = false;
  }

  storefrontVariantCache.set(variantId, { ok, timestamp: Date.now() });
  return ok;
}
