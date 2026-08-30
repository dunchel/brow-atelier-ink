import assert from "node:assert/strict";
import test from "node:test";
import {
  groupTreatmentsByCategory,
  isPricedTreatment,
  isTreatmentCatalogItem,
  TREATMENT_NOT_IN_SHOPIFY,
} from "./treatment-catalog.ts";

test("groupTreatmentsByCategory houdt de volgorde van eerste voorkomen", () => {
  const groups = groupTreatmentsByCategory([
    { categorie: "Brows", naam: "Wax" },
    { categorie: "Lashes", naam: "Lift" },
    { categorie: "Brows", naam: "Tint" },
    { categorie: "  ", naam: "Los" },
  ]);
  assert.deepEqual(
    groups.map((g) => g.categorie),
    ["Brows", "Lashes", "Behandelingen"]
  );
  assert.equal(groups[0].items.length, 2);
});

test("isPricedTreatment herkent komma-prijzen en nullen", () => {
  assert.equal(isPricedTreatment("27,5"), true);
  assert.equal(isPricedTreatment("0"), false);
  assert.equal(isPricedTreatment(""), false);
});

test("isTreatmentCatalogItem filtert alleen echte behandelingen, niet Browjam", () => {
  assert.equal(isTreatmentCatalogItem({ productType: "Behandeling" }), true);
  assert.equal(isTreatmentCatalogItem({ tags: ["behandeling", "Brows"] }), true);
  assert.equal(isTreatmentCatalogItem({ barcode: "BA-BHL-250937" }), true);
  assert.equal(isTreatmentCatalogItem({ category: "Behandelingen" }), true);
  assert.equal(isTreatmentCatalogItem({ productType: "Oorbellen" }), false);
  assert.equal(
    isTreatmentCatalogItem({ productType: "Accessoires", tags: ["brows"] }),
    false
  );
});

test("TREATMENT_NOT_IN_SHOPIFY is een zichtbare fout, geen stille checkout", () => {
  assert.match(TREATMENT_NOT_IN_SHOPIFY, /kassa\/Shopify/);
  assert.doesNotMatch(TREATMENT_NOT_IN_SHOPIFY, /pay now|checkoutUrl/i);
});
