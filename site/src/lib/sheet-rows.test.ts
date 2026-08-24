import assert from "node:assert/strict";
import test from "node:test";
import { parseSheetRows } from "./sheet-rows.ts";

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
