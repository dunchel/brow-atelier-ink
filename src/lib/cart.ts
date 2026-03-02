const domain = process.env.NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN!;
const storefrontAccessToken =
  process.env.NEXT_PUBLIC_SHOPIFY_STOREFRONT_ACCESS_TOKEN!;

const STOREFRONT_URL = `https://${domain}/api/2024-01/graphql.json`;

async function storeFetch(query: string, variables?: Record<string, unknown>) {
  const res = await fetch(STOREFRONT_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Shopify-Storefront-Access-Token": storefrontAccessToken,
    },
    body: JSON.stringify({ query, variables }),
  });
  return res.json();
}

export async function createCart(variantId: string, quantity = 1) {
  const { data } = await storeFetch(
    `mutation cartCreate($input: CartInput!) {
      cartCreate(input: $input) {
        cart {
          id
          checkoutUrl
        }
        userErrors { field message }
      }
    }`,
    {
      input: {
        lines: [{ merchandiseId: variantId, quantity }],
      },
    }
  );
  return data?.cartCreate?.cart;
}

export async function getVariantByProductTitle(title: string) {
  const { data } = await storeFetch(
    `query searchProducts($query: String!) {
      products(first: 1, query: $query) {
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
    { query: `title:${title}` }
  );

  const product = data?.products?.edges?.[0]?.node;
  if (!product) return null;

  const variant = product.variants.edges[0]?.node;
  return variant ? { variantId: variant.id, productTitle: product.title } : null;
}
