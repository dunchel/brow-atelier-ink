import assert from "node:assert/strict";
import test from "node:test";
import { isRateLimitError } from "./shopify-admin.ts";

test("isRateLimitError herkent een echte Shopify-rate limit", () => {
  assert.ok(
    isRateLimitError({
      errors: "Exceeded 2 calls per second for api client. Reduce request rates to resume uninterrupted service.",
    })
  );
  assert.ok(isRateLimitError([{ message: "Throttled" }]));
  assert.ok(isRateLimitError("Shopify rate limit — wacht even en probeer opnieuw"));
  assert.ok(isRateLimitError({ errors: ["Too Many Requests"] }));
});

test("een geslaagde productrespons is geen rate limit", () => {
  // De echte bug: "429" zit gewoon in Shopify-id's, waardoor een geslaagde
  // call als rate limit werd geteld en het product als mislukt uit de sync kwam.
  assert.ok(
    !isRateLimitError({
      products: [
        {
          id: 11515239039317,
          title: "Eori oorbellen",
          admin_graphql_api_id: "gid://shopify/MediaImage/57957264294229",
        },
      ],
    })
  );
  assert.ok(!isRateLimitError({ product: { id: 429429429 } }));
  assert.ok(!isRateLimitError({}));
  assert.ok(!isRateLimitError(null));
  assert.ok(!isRateLimitError(undefined));
});
