import assert from "node:assert/strict";
import test from "node:test";
import { hasSellablePrice, parsePriceValue, parseSheetRows, tabNameFromRange } from "./sheet-rows.ts";

const HEADERS = ["Naam", "Prijs", "Beschrijving", "Categorie", "Voorraad", "Foto", "Tags", "Beschikbaar", "Oude prijs"];

function row(naam: string, voorraad: string, beschikbaar: string) {
  return [naam, "19,95", "", "", voorraad, "", "", beschikbaar, ""];
}

test("voorraad met een getal bepaalt de beschikbaarheid", () => {
  const products = parseSheetRows(
    [HEADERS, row("Oora oorbellen", "1", "ja"), row("Lege ring", "0", "ja")],
    "Oorbellen"
  );
  assert.equal(products[0].available, true);
  assert.equal(products[1].available, false);
});

test("een voorraad-cel met tekst valt terug op de kolom beschikbaar", () => {
  // Voorheen werd "op voorraad" via parseFloat NaN en dus uitverkocht.
  const products = parseSheetRows(
    [HEADERS, row("Sova ketting", "op voorraad", "ja"), row("Vela ring", "ja", "nee")],
    "Kettingen"
  );
  assert.equal(products[0].available, true);
  assert.equal(products[1].available, false);
});

test("lege voorraad en lege beschikbaar blijft beschikbaar", () => {
  const products = parseSheetRows([HEADERS, row("Zera ketting", "", "")], "Kettingen");
  assert.equal(products[0].available, true);
});

test("tabNameFromRange haalt de tab uit een batchGet-range", () => {
  assert.equal(tabNameFromRange("Oorbellen!A1:Z1000"), "Oorbellen");
  assert.equal(tabNameFromRange("'Mini parfums'!A1:Z1000"), "Mini parfums");
});

test("prijzen met euro, komma en duizendpunt worden gelezen", () => {
  assert.equal(parsePriceValue("12,50"), 12.5);
  assert.equal(parsePriceValue("€ 12,50"), 12.5);
  assert.equal(parsePriceValue(" 1.250,00 "), 1250);
  assert.equal(parsePriceValue("8"), 8);
});

test("leeg, tekst, nul of negatief is geen prijs", () => {
  for (const raw of ["", "   ", "n.v.t.", "-", "0", "0,00", "-5", "gratis"]) {
    assert.equal(parsePriceValue(raw), null, `verwacht null voor ${JSON.stringify(raw)}`);
  }
  assert.equal(parsePriceValue(undefined), null);
});

test("een rij zonder prijs wordt niet nul en niet beschikbaar", () => {
  const products = parseSheetRows(
    [
      ["naam", "prijs", "voorraad"],
      ["Sudan piercing", "", "3"],
      ["Belle piercing", "0", "2"],
      ["Sienna piercing", "24,95", "1"],
    ],
    "Piercings"
  );

  const sudan = products.find((p) => p.title === "Sudan piercing");
  const belle = products.find((p) => p.title === "Belle piercing");
  const sienna = products.find((p) => p.title === "Sienna piercing");

  assert.ok(sudan && belle && sienna);
  assert.equal(sudan.price, "");
  assert.equal(sudan.available, false);
  assert.equal(hasSellablePrice(sudan), false);
  assert.equal(belle.price, "");
  assert.equal(belle.available, false);
  assert.equal(sienna.price, "24.95");
  assert.equal(sienna.available, true);
  assert.equal(hasSellablePrice(sienna), true);
});
