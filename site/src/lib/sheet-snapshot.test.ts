import assert from "node:assert/strict";
import test from "node:test";
import {
  createSheetSnapshotStore,
  fetchAllTabs,
  isDailySheetsQuota,
  isSheetsQuotaError,
  sheetTabRange,
  type SheetSnapshot,
} from "./sheet-snapshot.ts";

const sample = (fetchedAt: number): SheetSnapshot => ({
  fetchedAt,
  tabs: [{ name: "Oorbellen", rows: [["Naam"], ["Oora"]] }],
});

function quotaError(message: string) {
  const err = new Error(message) as Error & { code?: number };
  err.code = 429;
  return err;
}

test("één batchGet voor alle tabs, geen call per tab", async () => {
  let listCalls = 0;
  let batchCalls = 0;
  const tabs = await fetchAllTabs({
    async listTabNames() {
      listCalls += 1;
      return ["Oorbellen", "Mini parfums", "Kettingen", "Ringen"];
    },
    async batchGetValues(ranges) {
      batchCalls += 1;
      assert.deepEqual(ranges, [
        sheetTabRange("Oorbellen"),
        sheetTabRange("Mini parfums"),
        sheetTabRange("Kettingen"),
        sheetTabRange("Ringen"),
      ]);
      assert.equal(ranges[1], "'Mini parfums'!A1:Z2000");
      return ranges.map((range, index) => ({
        range,
        values: [["Naam"], [`Product ${index}`]],
      }));
    },
  });

  assert.equal(listCalls, 1);
  assert.equal(batchCalls, 1);
  assert.equal(tabs.length, 4);
  assert.equal(tabs[1].name, "Mini parfums");
  assert.equal(tabs[1].rows[1][0], "Product 1");
});

test("lege werkmap doet geen batchGet", async () => {
  let batchCalls = 0;
  const tabs = await fetchAllTabs({
    async listTabNames() {
      return [];
    },
    async batchGetValues() {
      batchCalls += 1;
      return [];
    },
  });
  assert.equal(batchCalls, 0);
  assert.deepEqual(tabs, []);
});

test("cache hit doet 0 extra calls", async () => {
  let reads = 0;
  let clock = 1_000_000;
  const store = createSheetSnapshotStore({
    now: () => clock,
    cacheTtlMs: 8 * 60_000,
    read: async () => {
      reads += 1;
      return sample(clock);
    },
  });

  const first = await store.get();
  const second = await store.get();
  clock += 60_000;
  const third = await store.get();

  assert.equal(reads, 1);
  assert.equal(second, first);
  assert.equal(third.tabs[0].rows[1][0], "Oora");
});

test("parallelle reads delen één call", async () => {
  let reads = 0;
  let release: () => void = () => {};
  const gate = new Promise<void>((resolve) => {
    release = resolve;
  });
  const store = createSheetSnapshotStore({
    read: async () => {
      reads += 1;
      await gate;
      return sample(Date.now());
    },
  });

  const pending = Promise.all([store.get(), store.get(), store.get()]);
  assert.equal(reads, 1);
  release();
  const [a, b, c] = await pending;
  assert.equal(reads, 1);
  assert.equal(a, b);
  assert.equal(b, c);
});

test("429 zonder cache doet daarna geen nieuwe call", async () => {
  let reads = 0;
  let clock = 1_000_000;
  const store = createSheetSnapshotStore({
    now: () => clock,
    quotaCooldownMs: 60_000,
    read: async () => {
      reads += 1;
      throw quotaError(
        "Quota exceeded for quota metric 'Read requests' and limit 'Read requests per minute per user'"
      );
    },
  });

  await assert.rejects(() => store.get(), /per minute per user/);
  await assert.rejects(() => store.get(), /per minute per user/);
  assert.equal(reads, 1);
  clock += 61_000;
  await assert.rejects(() => store.get(), /per minute per user/);
  assert.equal(reads, 2);
});

test("429 valt terug op de cache en doet daarna geen nieuwe call", async () => {
  let reads = 0;
  let clock = 1_000_000;
  const store = createSheetSnapshotStore({
    now: () => clock,
    cacheTtlMs: 1_000,
    quotaCooldownMs: 60_000,
    read: async () => {
      reads += 1;
      if (reads > 1) {
        throw quotaError(
          "Quota exceeded for quota metric 'Read requests' and limit 'Read requests per minute per user' of service 'sheets.googleapis.com'"
        );
      }
      return sample(clock);
    },
  });

  const cached = await store.get();
  clock += 2_000;
  const fallback = await store.get();
  const duringCooldown = await store.get();

  assert.equal(reads, 2);
  assert.equal(fallback.tabs[0].rows[1][0], "Oora");
  assert.equal(duringCooldown, cached);
  assert.equal(isSheetsQuotaError(quotaError("Quota exceeded")), true);
  assert.equal(
    isDailySheetsQuota(
      quotaError("Quota exceeded for quota metric 'Read requests' and limit 'Read requests per day'")
    ),
    true
  );
  assert.equal(
    isDailySheetsQuota(
      quotaError(
        "Quota exceeded for quota metric 'Read requests' and limit 'Read requests per minute per user'"
      )
    ),
    false
  );
});
