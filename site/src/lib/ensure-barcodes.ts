/**
 * Zet op elke sieraad-tab een Barcode-kolom en vult lege cellen.
 * Behandelingen blijven onaangeroerd: die tab heeft een eigen barcode.
 */

import { google } from "googleapis";
import { planBarcodeColumn } from "./barcode-column";
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

export async function ensureCatalogBarcodes(): Promise<{ assigned: number; tabs: number }> {
  if (!SHEET_ID || !GOOGLE_CREDENTIALS_B64) {
    return { assigned: 0, tabs: 0 };
  }

  const sheets = getWriteClient();
  const meta = await sheets.spreadsheets.get({
    spreadsheetId: SHEET_ID,
    fields: "sheets.properties.title",
  });
  const tabNames = (meta.data.sheets?.map((sheet) => sheet.properties?.title).filter(Boolean) ??
    []) as string[];

  const reserved = await reservedFromShopify();
  const data: { range: string; values: string[][] }[] = [];
  let assigned = 0;

  for (const tab of tabNames) {
    if (isTreatmentTabName(tab)) continue;

    const res = await sheets.spreadsheets.values.get({
      spreadsheetId: SHEET_ID,
      range: `${quoteTab(tab)}!A1:Z2000`,
    });
    const rows = (res.data.values as string[][]) || [];
    if (rows.length === 0) continue;

    const plan = planBarcodeColumn({ tab, rows, reserved });
    if (!plan?.changed) continue;

    assigned += plan.assigned;
    const letter = colLetter(plan.colIndex);
    data.push({
      range: `${quoteTab(tab)}!${letter}1:${letter}${plan.column.length}`,
      values: plan.column.map((value) => [value]),
    });
  }

  if (data.length > 0) {
    await sheets.spreadsheets.values.batchUpdate({
      spreadsheetId: SHEET_ID,
      requestBody: { valueInputOption: "RAW", data },
    });
  }

  return { assigned, tabs: data.length };
}
