import {
  addToCart,
  CART_ADD_UNAVAILABLE_MESSAGE,
  createCart,
  forgetStorefrontVariant,
  isMerchandiseMissingError,
  type Cart,
} from "./cart";
import { productIdFromVariant } from "./shopify-catalog";
import { publishProduct } from "./shopify-publish";

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function addLine(cartId: string | null | undefined, variantId: string, quantity: number): Promise<Cart> {
  if (cartId) return addToCart(cartId, variantId, quantity);
  return createCart(variantId, quantity);
}

/**
 * Zet een regel in de site-cart. Staat het product nog niet op het
 * Storefront-kanaal, dan publiceren we dat ene product en proberen we opnieuw.
 * Nooit een stille doorverwijzing naar Shopify-checkout.
 */
export async function addCartLine(
  cartId: string | null | undefined,
  variantId: string,
  quantity = 1
): Promise<Cart> {
  try {
    return await addLine(cartId, variantId, quantity);
  } catch (err) {
    if (!isMerchandiseMissingError(err)) throw err;

    const productId = await productIdFromVariant(variantId);
    if (!productId) throw new Error(CART_ADD_UNAVAILABLE_MESSAGE);

    const published = await publishProduct(productId);
    if (published.status !== "published") {
      console.warn("[Cart] Product niet op verkoopkanaal:", published);
      throw new Error(CART_ADD_UNAVAILABLE_MESSAGE);
    }

    forgetStorefrontVariant(variantId);

    let lastErr: unknown = err;
    for (const waitMs of [500, 1000, 2000]) {
      await sleep(waitMs);
      try {
        return await addLine(cartId, variantId, quantity);
      } catch (retryErr) {
        lastErr = retryErr;
        if (!isMerchandiseMissingError(retryErr)) throw retryErr;
      }
    }

    console.warn("[Cart] Storefront ziet het product nog niet na publiceren:", lastErr);
    throw new Error(CART_ADD_UNAVAILABLE_MESSAGE);
  }
}
