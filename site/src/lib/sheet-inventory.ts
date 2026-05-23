import { google } from "googleapis";

const SHEET_ID = process.env.GOOGLE_SHEET_ID || "";
const GOOGLE_CREDENTIALS_B64 = process.env.GOOGLE_CREDENTIALS_B64 || "";

export interface InventoryProduct {
  naam: string;
  prijs: string;
  barcode: string;
  categorie: string;
  voorraad: string;
  foto?: string;
  tabName: string;
  rowIndex: number;
  voorraadColIndex: number;
}

function getCredentials() {
  if (!GOOGLE_CREDENTIALS_B64) throw new Error("GOOGLE_CREDENTIALS_B64 not set");
  const creds = JSON.parse(Buffer.from(GOOGLE_CREDENTIALS_B64, "base64").toString("utf-8"));
  return {
    client_email: creds.client_email as string,
    private_key: creds.private_key as string,
  };
}

function getReadClient() {
  const auth = new google.auth.GoogleAuth({
    credentials: getCredentials(),
    scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
  });
  return google.sheets({ version: "v4", auth });
}

function getWriteClient() {
  const auth = new google.auth.GoogleAuth({
    credentials: getCredentials(),
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

export function parseStockCount(voorraadRaw: string): number {
  const match = (voorraadRaw || "").replace(",", ".").match(/-?\d+(\.\d+)?/);
  if (!match) return 0;
  const value = Math.floor(Number(match[0]));
  return Number.isFinite(value) && value >= 0 ? value : 0;
}

async function loadAllInventory(): Promise<InventoryProduct[]> {
  const sheets = getReadClient();
  const meta = await sheets.spreadsheets.get({
    spreadsheetId: SHEET_ID,
    fields: "sheets.properties.title",
  });
  const sheetNames =
    meta.data.sheets?.map((s) => s.properties?.title).filter(Boolean) as string[];

  const all: InventoryProduct[] = [];

  for (const tabName of sheetNames) {
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId: SHEET_ID,
      range: `'${tabName}'!A1:Z1000`,
    });
    const rows = res.data.values as string[][] | undefined;
    if (!rows || rows.length < 2) continue;

    const headers = rows[0].map((h) => h.trim().toLowerCase());
    const get = (row: string[], key: string) => {
      const idx = headers.indexOf(key);
      return idx >= 0 ? (row[idx] || "").trim() : "";
    };

    const voorraadColIndex = headers.findIndex(
      (h) => h === "voorraad" || h === "beschikbaar" || h === "stock"
    );

    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      const naam = get(row, "naam") || get(row, "title") || get(row, "product");
      const barcode = get(row, "barcode");
      if (!naam || !barcode) continue;

      all.push({
        naam,
        prijs: get(row, "prijs") || get(row, "price") || "",
        barcode,
        categorie: tabName,
        voorraad: get(row, "voorraad") || get(row, "beschikbaar") || "",
        foto: get(row, "foto") || get(row, "afbeelding") || get(row, "image") || undefined,
        tabName,
        rowIndex: i + 1,
        voorraadColIndex: voorraadColIndex >= 0 ? voorraadColIndex : -1,
      });
    }
  }

  return all;
}

export async function findProductByBarcode(
  barcode: string
): Promise<InventoryProduct | null> {
  const code = barcode.trim();
  if (!code) return null;
  const all = await loadAllInventory();
  return (
    all.find((p) => p.barcode.toLowerCase() === code.toLowerCase()) ?? null
  );
}

export async function findProductByTitle(title: string): Promise<InventoryProduct | null> {
  const t = title.trim().toLowerCase();
  if (!t) return null;
  const all = await loadAllInventory();
  return all.find((p) => p.naam.toLowerCase() === t) ?? null;
}

export async function updateStockByBarcode(
  barcode: string,
  delta: number
): Promise<{ product: InventoryProduct; oldStock: number; newStock: number }> {
  const product = await findProductByBarcode(barcode);
  if (!product) throw new Error("Product niet gevonden");
  if (product.voorraadColIndex < 0) {
    throw new Error("Geen voorraad-kolom gevonden in Google Sheet");
  }

  const oldStock = parseStockCount(product.voorraad);
  const newStock = Math.max(0, oldStock + delta);

  const sheets = getWriteClient();
  const cell = `'${product.tabName}'!${colLetter(product.voorraadColIndex)}${product.rowIndex}`;

  await sheets.spreadsheets.values.update({
    spreadsheetId: SHEET_ID,
    range: cell,
    valueInputOption: "USER_ENTERED",
    requestBody: { values: [[String(newStock)]] },
  });

  return {
    product: { ...product, voorraad: String(newStock) },
    oldStock,
    newStock,
  };
}

export async function getAllInventoryProducts(): Promise<
  Omit<InventoryProduct, "tabName" | "rowIndex" | "voorraadColIndex">[]
> {
  const all = await loadAllInventory();
  return all.map(({ tabName, rowIndex, voorraadColIndex, ...rest }) => rest);
}
