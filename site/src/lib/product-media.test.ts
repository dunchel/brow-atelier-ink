import assert from "node:assert/strict";
import test from "node:test";
import { orderImageSources, pickGallery, mediaKey } from "./product-media.ts";

const BLOB = "https://abc.public.blob.vercel-storage.com/products/1-img.jpg";
const CDN = "https://cdn.shopify.com/s/files/1/0/1/oora.jpg";
const EIGEN = "https://www.browatelier-ink.com/foto.jpg";

test("met een werkende blob-store blijft de Sheet-foto vooraan", () => {
  assert.deepEqual(orderImageSources([BLOB], [CDN], true), [BLOB, CDN]);
});

test("is de blob-store onbereikbaar, dan gaat de Shopify-kopie voor", () => {
  // Anders wacht de bezoeker eerst op een download die tóch mislukt.
  assert.deepEqual(orderImageSources([BLOB], [CDN], false), [CDN, BLOB]);
});

test("een Sheet-foto buiten de blob-store blijft altijd eerste keus", () => {
  assert.deepEqual(orderImageSources([EIGEN, BLOB], [CDN], false), [EIGEN, CDN, BLOB]);
});

test("zonder Shopify-kopie blijft de blob-URL over als enige kans", () => {
  assert.deepEqual(orderImageSources([BLOB], [], false), [BLOB]);
});

test("dubbele URL's komen maar één keer terug", () => {
  assert.deepEqual(orderImageSources([CDN], [CDN], true), [CDN]);
});

test("zonder enige bron is de lijst leeg, zodat de placeholder verschijnt", () => {
  assert.deepEqual(orderImageSources([], [], true), []);
});

test("mediaKey koppelt titels ongeacht hoofdletters en accenten", () => {
  assert.equal(mediaKey("Élia oorbellen"), mediaKey("elia  OORBELLEN"));
});

test("de galerij toont één set, niet beide bronnen achter elkaar", () => {
  // Sheet-foto en Shopify-kopie zijn hetzelfde beeld; samenvoegen zou elke
  // slide verdubbelen.
  assert.deepEqual(pickGallery([BLOB], [CDN], true), [BLOB]);
  assert.deepEqual(pickGallery([BLOB], [CDN], false), [CDN]);
});

test("meerdere productfoto's blijven allemaal in de galerij", () => {
  const b2 = BLOB.replace("1-img", "2-img");
  assert.deepEqual(pickGallery([BLOB, b2], [CDN], true), [BLOB, b2]);
});

test("zonder Shopify-kopie blijft de blob-set staan, ook als hij hapert", () => {
  // Beter een foto die het misschien doet dan gegarandeerd niets.
  assert.deepEqual(pickGallery([BLOB], [], false), [BLOB]);
});
