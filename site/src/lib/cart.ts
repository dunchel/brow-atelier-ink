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

/**
 * Kan deze variant daadwerkelijk in een winkelwagen?
 *
 * De bestelflow zoekt het product op via de Admin API, maar `createCart` draait
 * op de Storefront API. Die twee zien niet dezelfde catalogus: een product dat
 * de Admin API teruggeeft, kan op het verkoopkanaal van de Storefront-app
 * ontbreken. `cartCreate` antwoordt dan met "The merchandise with id ... does
 * not exist", wat de klant als een onbegrijpelijke fout ziet. Door vóór het
 * aanmaken van de cart te controleren of de Storefront de variant kent, wordt
 * dat verschil zichtbaar en kan de aanroeper een bruikbare melding geven.
 *
 * @param variantId Globale variant-id (`gid://shopify/ProductVariant/...`).
 * @returns "orderable" als de variant bestelbaar is, "sold_out" als de
 *   Storefront hem kent maar niet verkoopt, "not_published" als de Storefront
 *   hem niet kent, en "unknown" als de check zelf mislukt.
 */
export async function checkVariantOrderable(
  variantId: string
): Promise<"orderable" | "sold_out" | "not_published" | "unknown"> {
  try {
    const { data } = await storeFetch(
      `query variantAvailability($id: ID!) {
        node(id: $id) {
          ... on ProductVariant {
            id
            availableForSale
          }
        }
      }`,
      { id: variantId }
    );

    const node = data?.node;
    if (!node) return "not_published";
    return node.availableForSale ? "orderable" : "sold_out";
  } catch (err) {
    // De check mag de bestelling niet blokkeren als Shopify zelf hapert.
    console.error("[Shopify] Variantcontrole mislukt:", err);
    return "unknown";
  }
}
