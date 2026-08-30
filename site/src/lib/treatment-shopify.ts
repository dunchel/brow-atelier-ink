import { shopifyGraphql, shopifyRest } from "./shopify-admin";
import { getTreatments } from "./treatments";
import {
  isPricedTreatment,
  isTreatmentBarcode,
  TREATMENT_NOT_IN_SHOPIFY,
} from "./treatment-catalog";

export { TREATMENT_NOT_IN_SHOPIFY };

export const TREATMENT_NO_PRICE = "Deze behandeling heeft nog geen prijs.";

export interface TreatmentShopifyVariant {
  variantGid: string;
  variantNumericId: number;
  productNumericId: number | null;
  barcode: string;
  requiresShipping: boolean;
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" ? (value as Record<string, unknown>) : null;
}

function numericId(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const match = value.match(/(\d+)$/);
    if (match) return Number(match[1]);
  }
  return null;
}

function variantFromNode(node: Record<string, unknown>, fallbackBarcode: string): TreatmentShopifyVariant | null {
  const variantNumericId = numericId(node.legacyResourceId) ?? numericId(node.id);
  if (!variantNumericId) return null;
  const product = asRecord(node.product);
  const inventory = asRecord(node.inventoryItem);
  const barcode = String(node.barcode || node.sku || fallbackBarcode).trim();
  return {
    variantGid: typeof node.id === "string" && node.id.startsWith("gid://")
      ? node.id
      : `gid://shopify/ProductVariant/${variantNumericId}`,
    variantNumericId,
    productNumericId: numericId(product?.legacyResourceId) ?? numericId(product?.id),
    barcode,
    requiresShipping: inventory?.requiresShipping === true || node.requiresShipping === true,
  };
}

export async function findTreatmentVariantByBarcode(
  barcode: string
): Promise<TreatmentShopifyVariant | null> {
  const code = barcode.trim();
  if (!code) return null;

  const res = await shopifyGraphql(
    `query ($q: String!) {
      productVariants(first: 5, query: $q) {
        edges {
          node {
            id
            legacyResourceId
            barcode
            sku
            inventoryItem { requiresShipping }
            product { id legacyResourceId }
          }
        }
      }
    }`,
    { q: `barcode:${code}` }
  );

  const edges =
    (asRecord(res.data?.productVariants)?.edges as { node?: Record<string, unknown> }[] | undefined) ?? [];
  for (const edge of edges) {
    if (!edge.node) continue;
    const variant = variantFromNode(edge.node, code);
    if (variant) return variant;
  }
  return null;
}

function rememberVariant(
  map: Map<string, TreatmentShopifyVariant>,
  variant: TreatmentShopifyVariant,
  extraKeys: string[]
) {
  for (const key of [variant.barcode, ...extraKeys].map((k) => k.trim().toUpperCase()).filter(Boolean)) {
    map.set(key, variant);
  }
}

async function listTreatmentVariantsViaRest(): Promise<Map<string, TreatmentShopifyVariant>> {
  const map = new Map<string, TreatmentShopifyVariant>();
  const rest = await shopifyRest("products.json?product_type=Behandeling&limit=250");
  const products = (asRecord(rest)?.products as Record<string, unknown>[] | undefined) ?? [];
  for (const product of products) {
    const productId = numericId(product.id);
    const variants = (product.variants as Record<string, unknown>[] | undefined) ?? [];
    for (const node of variants) {
      const variant = variantFromNode(
        { ...node, product: { legacyResourceId: productId } },
        String(node.barcode || node.sku || "")
      );
      if (!variant) continue;
      variant.requiresShipping = node.requires_shipping === true;
      rememberVariant(map, variant, [String(node.sku || ""), String(node.barcode || "")]);
    }
  }
  return map;
}

export async function listTreatmentShopifyVariants(): Promise<Map<string, TreatmentShopifyVariant>> {
  const map = new Map<string, TreatmentShopifyVariant>();
  const res = await shopifyGraphql(
    `{
      products(first: 100, query: "product_type:Behandeling OR tag:behandeling") {
        edges {
          node {
            legacyResourceId
            variants(first: 10) {
              nodes {
                id
                legacyResourceId
                barcode
                sku
                inventoryItem { requiresShipping }
              }
            }
          }
        }
      }
    }`
  );

  if (res.errors?.length) {
    console.warn("[Treatments] GraphQL-lijst:", res.errors[0].message);
  } else {
    const products =
      (asRecord(res.data?.products)?.edges as {
        node?: { legacyResourceId?: unknown; variants?: { nodes?: Record<string, unknown>[] } };
      }[] | undefined) ?? [];

    for (const edge of products) {
      const productId = numericId(edge.node?.legacyResourceId);
      for (const node of edge.node?.variants?.nodes ?? []) {
        const variant = variantFromNode(
          { ...node, product: { legacyResourceId: productId } },
          String(node.barcode || node.sku || "")
        );
        if (!variant) continue;
        rememberVariant(map, variant, [String(node.sku || ""), String(node.barcode || "")]);
      }
    }
  }

  if (map.size > 0) return map;
  return listTreatmentVariantsViaRest();
}

export async function disableTreatmentShipping(variantNumericId: number): Promise<void> {
  await shopifyRest(`variants/${variantNumericId}.json`, "PUT", {
    variant: {
      id: variantNumericId,
      requires_shipping: false,
    },
  });
}

export async function resolveTreatmentForCart(barcode: string): Promise<string> {
  const code = barcode.trim();
  if (!isTreatmentBarcode(code)) {
    throw new Error(TREATMENT_NOT_IN_SHOPIFY);
  }

  const treatment = (await getTreatments()).find(
    (t) => t.barcode.toUpperCase() === code.toUpperCase()
  );
  if (!treatment || !isPricedTreatment(treatment.prijs)) {
    throw new Error(treatment ? TREATMENT_NO_PRICE : TREATMENT_NOT_IN_SHOPIFY);
  }

  const variant = await findTreatmentVariantByBarcode(treatment.barcode);
  if (!variant) {
    throw new Error(TREATMENT_NOT_IN_SHOPIFY);
  }

  if (variant.requiresShipping) {
    await disableTreatmentShipping(variant.variantNumericId);
  }

  return variant.variantGid;
}
