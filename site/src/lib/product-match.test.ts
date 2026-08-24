import assert from "node:assert/strict";
import test from "node:test";
import { handleize, normalizeTitle, parseStockValue, titlesMatch } from "./product-match.ts";

test("normalizeTitle haalt hoofdletters, accenten en dubbele spaties weg", () => {
  assert.equal(normalizeTitle("Sora Ring"), "sora ring");
  assert.equal(normalizeTitle("Élia oorbellen"), "elia oorbellen");
  assert.equal(normalizeTitle("  Zéra   ketting "), "zera ketting");
  assert.equal(normalizeTitle("Twilly d’Hermès"), "twilly d'hermes");
});

test("handleize levert dezelfde slug als Shopify", () => {
  assert.equal(handleize("Sora ring"), "sora-ring");
  assert.equal(handleize("Élia oorbellen"), "elia-oorbellen");
  assert.equal(handleize("J'adore Dior"), "j-adore-dior");
});

test("titlesMatch koppelt Sheet-titel aan Shopify-titel", () => {
  // De echte mismatch uit de winkel: Sheet "Sora ring", Shopify "Sora Ring".
  assert.ok(titlesMatch("Sora ring", "Sora Ring"));
  assert.ok(titlesMatch("Vela ring", "Vela Ring"));
  assert.ok(titlesMatch("Elia oorbellen", "Élia oorbellen"));
  assert.ok(titlesMatch("Twilly d'Hermès", "Twilly d’Hermes"));
  assert.ok(!titlesMatch("Sora ring", "Sora ketting"));
  assert.ok(!titlesMatch("", "Sora Ring"));
});

test("parseStockValue onderscheidt leeg, tekst en getal", () => {
  assert.equal(parseStockValue("3"), 3);
  assert.equal(parseStockValue(" 2 "), 2);
  assert.equal(parseStockValue("1,5"), 1);
  assert.equal(parseStockValue("5 stuks"), 5);
  assert.equal(parseStockValue("0"), 0);
  assert.equal(parseStockValue("-2"), 0);
  // Leeg of tekst is géén voorraad 0 — anders valt een product ten onrechte uit.
  assert.equal(parseStockValue(""), null);
  assert.equal(parseStockValue("ja"), null);
  assert.equal(parseStockValue("op voorraad"), null);
});
