/**
 * Productie-lezer voor de Google Sheet.
 * Shop, labels, sync, voorraad en behandelingen delen deze cache.
 * googleapis retry staat uit: een 429 mag niet nog drie keer worden herhaald.
 */

import { revalidateTag, unstable_cache } from "next/cache";
import { google } from "googleapis";
import {
  createSheetSnapshotStore,
  fetchAllTabs,
  SHEET_CACHE_TTL_MS,
  type SheetBatchClient,
  type SheetSnapshot,
} from "./sheet-snapshot";

const SHEET_ID = process.env.GOOGLE_SHEET_ID || "";
const GOOGLE_CREDENTIALS_B64 = process.env.GOOGLE_CREDENTIALS_B64 || "";
const SHEET_CACHE_TAG = "sheet-snapshot";
const NO_RETRY = { retry: false as const };

let sheetsClient: ReturnType<typeof google.sheets> | null = null;
/** Vers resultaat dat de volgende gedeelde cache-miss mag overnemen, zonder tweede Sheet-read. */
let primed: SheetSnapshot | null = null;

function getSheetsClient() {
  if (sheetsClient) return sheetsClient;
  if (!GOOGLE_CREDENTIALS_B64) throw new Error("GOOGLE_CREDENTIALS_B64 not set");

  const creds = JSON.parse(Buffer.from(GOOGLE_CREDENTIALS_B64, "base64").toString("utf-8"));
  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: creds.client_email,
      private_key: creds.private_key,
    },
    scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
  });
  google.options({ retryConfig: { retry: 0 } });
  sheetsClient = google.sheets({ version: "v4", auth });
  return sheetsClient;
}

function googleBatchClient(): SheetBatchClient {
  const sheets = getSheetsClient();
  return {
    async listTabNames() {
      const meta = await sheets.spreadsheets.get(
        {
          spreadsheetId: SHEET_ID,
          fields: "sheets.properties.title",
        },
        NO_RETRY
      );
      return (meta.data.sheets?.map((sheet) => sheet.properties?.title).filter(Boolean) ??
        []) as string[];
    },
    async batchGetValues(ranges) {
      const batch = await sheets.spreadsheets.values.batchGet(
        {
          spreadsheetId: SHEET_ID,
          ranges,
        },
        NO_RETRY
      );
      console.log(`[Sheet] batchGet ${ranges.length} tabs (2 reads: meta + batch)`);
      return (batch.data.valueRanges ?? []).map((valueRange) => ({
        range: valueRange.range,
        values: (valueRange.values as string[][] | undefined) ?? [],
      }));
    },
  };
}

const readCachedSheetSnapshot = unstable_cache(
  async (): Promise<SheetSnapshot> => {
    if (primed) {
      const snap = primed;
      primed = null;
      return snap;
    }
    const tabs = await fetchAllTabs(googleBatchClient());
    return { tabs, fetchedAt: Date.now() };
  },
  ["brow-sheet-snapshot-v1"],
  { revalidate: Math.round(SHEET_CACHE_TTL_MS / 1000), tags: [SHEET_CACHE_TAG] }
);

function dropSharedCache() {
  try {
    revalidateTag(SHEET_CACHE_TAG);
  } catch (err) {
    const message = err instanceof Error ? err.message : "revalidate failed";
    console.error("[Sheet] revalidateTag failed:", message);
  }
}

async function publishSnapshot(snapshot: SheetSnapshot) {
  primed = snapshot;
  dropSharedCache();
  try {
    await readCachedSheetSnapshot();
  } catch (err) {
    primed = null;
    const message = err instanceof Error ? err.message : "cache publish failed";
    console.error("[Sheet] shared cache publish failed:", message);
  }
}

async function readSheet(ctx: { fresh: boolean }): Promise<SheetSnapshot> {
  if (!ctx.fresh) return readCachedSheetSnapshot();
  const tabs = await fetchAllTabs(googleBatchClient());
  const snapshot = { tabs, fetchedAt: Date.now() };
  await publishSnapshot(snapshot);
  return snapshot;
}

const store = createSheetSnapshotStore({ read: readSheet });

export function getSheetSnapshot(opts?: { fresh?: boolean }): Promise<SheetSnapshot> {
  return store.get(opts);
}

export function invalidateSheetSnapshot() {
  store.invalidate();
}

export function patchSheetSnapshotTab(name: string, rows: string[][]) {
  store.patchTab(name, rows);
}

/**
 * Na een schrijfactie: memory is al gepatcht. De gedeelde cache gaat weg,
 * zodat een andere instance de Sheet één keer opnieuw leest en de write ziet.
 */
export async function commitSheetSnapshot(): Promise<void> {
  primed = null;
  dropSharedCache();
}
