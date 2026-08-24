import assert from "node:assert/strict";
import test from "node:test";
import { aggregateStockByTitle, titlesWithoutStock } from "./stock-sync.ts";

test("regels met dezelfde naam tellen op tot één aantal", () => {
  const result = aggregateStockByTitle([
    { title: "Ovi oorbellen", stock: 1 },
    { title: "Ovi oorbellen", stock: 2 },
    { title: "Sova ketting", stock: 4 },
  ]);

  assert.deepEqual(
    result.map((r) => [r.title, r.quantity, r.rows]),
    [
      ["Ovi oorbellen", 3, 2],
      ["Sova ketting", 4, 1],
    ]
  );
});

test("hoofdletters en accenten tellen als hetzelfde product", () => {
  const result = aggregateStockByTitle([
    { title: "Élia oorbellen", stock: 2 },
    { title: "Elia Oorbellen", stock: 1 },
  ]);

  assert.equal(result.length, 1);
  assert.equal(result[0].quantity, 3);
});

test("een lege voorraadcel zet de voorraad nooit op nul", () => {
  // Dit is de gevaarlijke: één lege cel mag de winkel niet uitverkopen.
  const result = aggregateStockByTitle([
    { title: "Zonder voorraad", stock: null },
    { title: "Met voorraad", stock: 5 },
  ]);

  assert.deepEqual(result.map((r) => r.title), ["Met voorraad"]);
  assert.deepEqual(titlesWithoutStock([
    { title: "Zonder voorraad", stock: null },
    { title: "Met voorraad", stock: 5 },
  ]), ["Zonder voorraad"]);
});

test("staat er op één regel wel een getal, dan telt die gewoon mee", () => {
  const result = aggregateStockByTitle([
    { title: "Deels ingevuld", stock: null },
    { title: "Deels ingevuld", stock: 2 },
  ]);

  assert.equal(result.length, 1);
  assert.equal(result[0].quantity, 2);
  assert.deepEqual(titlesWithoutStock([
    { title: "Deels ingevuld", stock: null },
    { title: "Deels ingevuld", stock: 2 },
  ]), []);
});

test("een expliciete nul mag wél op nul gezet worden", () => {
  const result = aggregateStockByTitle([{ title: "Uitverkocht", stock: 0 }]);
  assert.deepEqual(result, [{ title: "Uitverkocht", quantity: 0, rows: 1 }]);
});

test("negatieve voorraad telt als nul en lege titels vallen af", () => {
  const result = aggregateStockByTitle([
    { title: "Rare rij", stock: -3 },
    { title: "   ", stock: 9 },
  ]);
  assert.deepEqual(result, [{ title: "Rare rij", quantity: 0, rows: 1 }]);
});
