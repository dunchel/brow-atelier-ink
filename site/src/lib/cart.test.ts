import assert from "node:assert/strict";
import test from "node:test";

// Moet vóór cart.ts staan: die leest het domein bij het laden uit.
import "./test-env.ts";
import {
  buildDirectCheckoutUrl,
  CART_ADD_UNAVAILABLE_MESSAGE,
  isMerchandiseMissingError,
  variantNumericId,
} from "./cart.ts";

test("variantNumericId pakt het nummer uit een variant-gid", () => {
  assert.equal(variantNumericId("gid://shopify/ProductVariant/53605126111573"), "53605126111573");
  assert.equal(variantNumericId("53605126111573"), "53605126111573");
  assert.equal(variantNumericId(""), "");
  assert.equal(variantNumericId("gid://shopify/Product/abc"), "");
});

test("buildDirectCheckoutUrl maakt een Shopify cart-permalink", () => {
  assert.equal(
    buildDirectCheckoutUrl("gid://shopify/ProductVariant/53605126111573", 2),
    "https://brow-atelier-ink.myshopify.com/cart/53605126111573:2"
  );
  // Aantal blijft binnen 1..20, net als de checkout-route.
  assert.match(buildDirectCheckoutUrl("gid://shopify/ProductVariant/1", 99) ?? "", /\/cart\/1:20$/);
  assert.match(buildDirectCheckoutUrl("gid://shopify/ProductVariant/1", 0) ?? "", /\/cart\/1:1$/);
  assert.equal(buildDirectCheckoutUrl("onzin"), null);
});

test("returnTo laat de klant terugkeren naar de winkelwagen", () => {
  assert.equal(
    buildDirectCheckoutUrl("gid://shopify/ProductVariant/7", 1, { returnTo: "/cart" }),
    "https://brow-atelier-ink.myshopify.com/cart/7:1?return_to=%2Fcart"
  );
});

test("isMerchandiseMissingError herkent een geweigerde Storefront-cart", () => {
  assert.ok(
    isMerchandiseMissingError(
      new Error("The merchandise with id gid://shopify/ProductVariant/1 does not exist.")
    )
  );
  assert.ok(!isMerchandiseMissingError(new Error("Throttled")));
  assert.ok(!isMerchandiseMissingError(new Error("")));
});

test("CART_ADD_UNAVAILABLE_MESSAGE blijft op de site en wijst niet naar Pay now", () => {
  assert.match(CART_ADD_UNAVAILABLE_MESSAGE, /mandje/);
  assert.doesNotMatch(CART_ADD_UNAVAILABLE_MESSAGE, /pay now|checkoutUrl|online-store/i);
});
