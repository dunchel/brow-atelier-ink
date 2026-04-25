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

export async function getVariantByProductTitle(title: string) {
  const adminDomain = process.env.NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN!;
  const adminToken = process.env.SHOPIFY_ADMIN_ACCESS_TOKEN;

  if (adminToken) {
    const res = await fetch(`https://${adminDomain}/admin/api/2024-01/products.json?title=${encodeURIComponent(title)}&limit=1`, {
      headers: { "X-Shopify-Access-Token": adminToken },
    });
    const data = await res.json();
    const product = data?.products?.[0];
    if (product) {
      const variant = product.variants?.[0];
      if (variant) {
        return { variantId: `gid://shopify/ProductVariant/${variant.id}`, productTitle: product.title };
      }
    }
  }

  const { data } = await storeFetch(
    `query searchProducts($query: String!) {
      products(first: 5, query: $query) {
        edges {
          node {
            id
            title
            variants(first: 1) {
              edges {
                node {
                  id
                  price { amount currencyCode }
                  availableForSale
                }
              }
            }
          }
        }
      }
    }`,
    { query: `title:"${title}"` }
  );

  const product = data?.products?.edges?.[0]?.node;
  if (!product) return null;

  const variant = product.variants.edges[0]?.node;
  if (!variant) return null;

  return { variantId: variant.id, productTitle: product.title };
}
