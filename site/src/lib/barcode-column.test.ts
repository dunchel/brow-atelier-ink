import assert from "node:assert/strict";
import test from "node:test";
import {
  formatBarcode,
  planBarcodeColumn,
  prefixForTab,
  readBarcodeCell,
} from "./barcode-column.ts";

const JEWELRY = ["Naam", "Prijs", "Beschrijving", "Categorie", "Voorraad", "Foto"];

test("een lege extra barcode-kolom verbergt de gevulde niet", () => {
  const headers = ["Naam", "Prijs", "Barcode", "Barcode"];
  const row = ["Brow wax", "20", "", "BA-BHL-250937"];
  assert.equal(readBarcodeCell(headers, row), "BA-BHL-250937");
});

test("behandelingen krijgen geen sieraden-reeks", () => {
  assert.equal(prefixForTab("Behandelingen"), null);
  assert.equal(
    planBarcodeColumn({
      tab: "Behandelingen",
      rows: [
        ["Naam", "Prijs", "Barcode"],
        ["Brow wax", "20", "BA-BHL-250937"],
      ],
      reserved: new Set(),
    }),
    null
  );
});

test("ontbrekende barcode-kolom wordt gevuld vanaf het eerstvolgende vrije nummer", () => {
  const reserved = new Set(["BA-OOR-001", "BA-OOR-095"]);
  const plan = planBarcodeColumn({
    tab: "Oorbellen",
    rows: [JEWELRY, ["Oora oorbellen", "19,95", "", "Oorbellen", "1", ""], ["", "", "", "", "", ""]],
    reserved,
  });
  assert.ok(plan);
  assert.equal(plan.changed, true);
  assert.equal(plan.assigned, 1);
  assert.equal(plan.column[0], "Barcode");
  assert.equal(plan.column[1], "BA-OOR-096");
  assert.equal(plan.column[2], "");
  assert.equal(formatBarcode("BA-OOR", 96), "BA-OOR-096");
});

test("een bestaande barcode blijft staan en een tweede run wijzigt niets", () => {
  const reserved = new Set<string>();
  const once = planBarcodeColumn({
    tab: "Ringen",
    rows: [
      ["Naam", "Prijs", "Barcode"],
      ["Sora ring", "29", "BA-RIN-003"],
      ["Vela ring", "19", ""],
    ],
    reserved,
  });
  assert.equal(once?.column[1], "BA-RIN-003");
  assert.equal(once?.column[2], "BA-RIN-004");

  const headers = ["Naam", "Prijs", "Barcode"];
  const rows = [headers, ["Sora ring", "29", once!.column[1]], ["Vela ring", "19", once!.column[2]]];
  const twice = planBarcodeColumn({ tab: "Ringen", rows, reserved: new Set(reserved) });
  assert.equal(twice?.changed, false);
  assert.equal(twice?.assigned, 0);
});

test("piercings en parfums krijgen een eigen reeks", () => {
  assert.equal(prefixForTab("Piercings"), "BA-PIE");
  assert.equal(prefixForTab("Mini parfums"), "BA-MIN");
  assert.equal(prefixForTab("Parfums"), "BA-PAR");
  assert.equal(prefixForTab("Accessoires"), "BA-ACC");
});
