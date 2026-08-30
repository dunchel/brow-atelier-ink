import assert from "node:assert/strict";
import test from "node:test";
import {
  publicationKind,
  treatmentPublishChannels,
  treatmentUnpublishChannels,
} from "./publication-channels.ts";

test("publicationKind herkent POS, Headless en webshop-kanalen", () => {
  assert.equal(publicationKind("Point of Sale"), "pos");
  assert.equal(publicationKind("Brow Atelier Ink Headless"), "headless");
  assert.equal(publicationKind("Online Store"), "storefront");
  assert.equal(publicationKind("Shop"), "storefront");
  assert.equal(publicationKind("Facebook & Instagram"), "storefront");
  assert.equal(publicationKind("TikTok"), "storefront");
  assert.equal(publicationKind("Inbox"), "other");
});

test("behandeling gaat naar POS en Headless, niet naar de webshop", () => {
  const publications = [
    { id: "1", name: "Online Store" },
    { id: "2", name: "Shop" },
    { id: "3", name: "Point of Sale" },
    { id: "4", name: "Brow Atelier Ink Headless" },
    { id: "5", name: "Facebook & Instagram" },
    { id: "6", name: "TikTok" },
  ];
  assert.deepEqual(
    treatmentPublishChannels(publications).map((p) => p.name),
    ["Point of Sale", "Brow Atelier Ink Headless"]
  );
  assert.deepEqual(
    treatmentUnpublishChannels(publications).map((p) => p.name),
    ["Online Store", "Shop", "Facebook & Instagram", "TikTok"]
  );
});
