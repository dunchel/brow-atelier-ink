/**
 * Zet op elke sieraad-tab een Barcode-kolom en vult lege cellen.
 * Behandelingen blijven onaangeroerd: die tab heeft een eigen barcode.
 */

import { google } from "googleapis";
import { planBarcodeColumn } from "./barcode-column";
import {
  commitSheetSnapshot,
  getSheetSnapshot,
  patchSheetSnapshotTab,
} from "./sheet-read";
import { shopifyGraphql } from "./shopify-admin";
import { isTreatmentTabName } from "./treatment-catalog";

const SHEET_ID = process.env.GOOGLE_SHEET_ID || "";
const GOOGLE_CREDENTIALS_B64 = process.env.GOOGLE_CREDENTIALS_B64 || "";

function getWriteClient() {
  if (!GOOGLE_CREDENTIALS_B64) throw new Error("GOOGLE_CREDENTIALS_B64 not set");
  const creds = JSON.parse(Buffer.from(GOOGLE_CREDENTIALS_B64, "base64").toString("utf-8"));
  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: creds.client_email as string,
      private_key: creds.private_key as string,
    },
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });
  return google.sheets({ version: "v4", auth });
}

function colLetter(index: number): string {
  let n = index + 1;
  let s = "";
  while (n > 0) {
    s = String.fromCharCode(65 + ((n - 1) % 26)) + s;
    n = Math.floor((n - 1) / 26);
  }
  return s;
}

function quoteTab(tab: string): string {
  return `'${tab.replace(/'/g, "''")}'`;
}

async function reservedFromShopify(): Promise<Set<string>> {
  const reserved = new Set<string>();
  let cursor: string | null = null;

  for (let page = 0; page < 30; page++) {
    const res = await shopifyGraphql(
      `query barcodes($cursor: String) {
        products(first: 100, after: $cursor) {
          pageInfo { hasNextPage endCursor }
          nodes { variants(first: 5) { nodes { barcode } } }
        }
      }`,
      { cursor }
    );
    if (res.errors?.length) throw new Error(res.errors[0].message);

    const connection = res.data?.products as
      | {
          pageInfo?: { hasNextPage?: boolean; endCursor?: string | null };
          nodes?: { variants?: { nodes?: { barcode?: string | null }[] } }[];
        }
      | undefined;

    for (const product of connection?.nodes ?? []) {
      for (const variant of product.variants?.nodes ?? []) {
        const code = (variant.barcode || "").trim().toUpperCase();
        if (code) reserved.add(code);
      }
    }

    if (!connection?.pageInfo?.hasNextPage) break;
    cursor = connection.pageInfo.endCursor ?? null;
  }

  return reserved;
}

function applyColumn(rows: string[][], colIndex: number, column: string[]): string[][] {
  const next = rows.map((row) => [...row]);
  for (let i = 0; i < column.length; i++) {
    const row = [...(next[i] || [])];
    while (row.length <= colIndex) row.push("");
    row[colIndex] = column[i];
    next[i] = row;
  }
  return next;
}

function plansFromSnapshot(
  tabs: { name: string; rows: string[][] }[],
  reserved: Set<string>
) {
  const plans: {
    tab: string;
    rows: string[][];
    colIndex: number;
    column: string[];
    assigned: number;
  }[] = [];

  for (const tab of tabs) {
    if (isTreatmentTabName(tab.name) || tab.rows.length === 0) continue;
    const plan = planBarcodeColumn({ tab: tab.name, rows: tab.rows, reserved });
    if (!plan?.changed) continue;
    plans.push({
      tab: tab.name,
      rows: tab.rows,
      colIndex: plan.colIndex,
      column: plan.column,
      assigned: plan.assigned,
    });
  }
  return plans;
}

export async function ensureCatalogBarcodes(opts?: {
  fresh?: boolean;
}): Promise<{ assigned: number; tabs: number }> {
  if (!SHEET_ID || !GOOGLE_CREDENTIALS_B64) {
    return { assigned: 0, tabs: 0 };
  }

  if (opts?.fresh) {
    await getSheetSnapshot({ fresh: true });
  }

  let snapshot = await getSheetSnapshot();
  const reserved = await reservedFromShopify();
  let plans = plansFromSnapshot(snapshot.tabs, new Set(reserved));

  if (plans.length > 0 && Date.now() - snapshot.fetchedAt > 2_000) {
    const previousFetchedAt = snapshot.fetchedAt;
    snapshot = await getSheetSnapshot({ fresh: true });
    if (snapshot.fetchedAt === previousFetchedAt) {
      return { assigned: 0, tabs: 0 };
    }
    plans = plansFromSnapshot(snapshot.tabs, new Set(reserved));
  }

  if (plans.length === 0) return { assigned: 0, tabs: 0 };

  const data = plans.map((plan) => ({
    range: `${quoteTab(plan.tab)}!${colLetter(plan.colIndex)}1:${colLetter(plan.colIndex)}${plan.column.length}`,
    values: plan.column.map((value) => [value]),
  }));

  const sheets = getWriteClient();
  await sheets.spreadsheets.values.batchUpdate({
    spreadsheetId: SHEET_ID,
    requestBody: { valueInputOption: "RAW", data },
  });

  for (const plan of plans) {
    patchSheetSnapshotTab(plan.tab, applyColumn(plan.rows, plan.colIndex, plan.column));
  }
  await commitSheetSnapshot();

  return {
    assigned: plans.reduce((sum, plan) => sum + plan.assigned, 0),
    tabs: plans.length,
  };
}
