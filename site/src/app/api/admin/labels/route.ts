import { google } from "googleapis";
import { NextResponse } from "next/server";

const SHEET_ID = process.env.GOOGLE_SHEET_ID || "";
const GOOGLE_CREDENTIALS_B64 = process.env.GOOGLE_CREDENTIALS_B64 || "";

function getSheetsClient() {
  if (!GOOGLE_CREDENTIALS_B64) throw new Error("GOOGLE_CREDENTIALS_B64 not set");
  const creds = JSON.parse(Buffer.from(GOOGLE_CREDENTIALS_B64, "base64").toString("utf-8"));
  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: creds.client_email,
      private_key: creds.private_key,
    },
    scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
  });
  return google.sheets({ version: "v4", auth });
}

export interface LabelProduct {
  naam: string;
  prijs: string;
  barcode: string;
  categorie: string;
  voorraad: string;
}

export interface LabelsSkippedRow {
  tab: string;
  row: number;
  naam: string;
  reason: "geen_naam" | "geen_barcode";
}

export async function GET() {
  try {
    const sheets = getSheetsClient();

    const meta = await sheets.spreadsheets.get({
      spreadsheetId: SHEET_ID,
      fields: "sheets.properties.title",
    });

    const sheetNames =
      meta.data.sheets?.map((s) => s.properties?.title).filter(Boolean) as string[];

    const allProducts: LabelProduct[] = [];
    const skipped: LabelsSkippedRow[] = [];

    for (const tabName of sheetNames) {
      const res = await sheets.spreadsheets.values.get({
        spreadsheetId: SHEET_ID,
        range: `'${tabName}'!A1:Z2000`,
      });

      const rows = res.data.values as string[][] | undefined;
      if (!rows || rows.length < 2) continue;

      const headers = rows[0].map((h) => h.trim().toLowerCase());
      const get = (row: string[], key: string) => {
        const idx = headers.indexOf(key);
        return idx >= 0 ? (row[idx] || "").trim() : "";
      };

      for (let i = 1; i < rows.length; i++) {
        const row = rows[i];
        const naam = get(row, "naam") || get(row, "title") || get(row, "product");
        const barcode = get(row, "barcode");

        if (!naam && !barcode) continue;

        if (!naam) {
          skipped.push({ tab: tabName, row: i + 1, naam: barcode || `(rij ${i + 1})`, reason: "geen_naam" });
          continue;
        }
        if (!barcode) {
          skipped.push({ tab: tabName, row: i + 1, naam, reason: "geen_barcode" });
          continue;
        }

        allProducts.push({
          naam,
          prijs: get(row, "prijs") || get(row, "price") || "",
          barcode,
          categorie: tabName,
          voorraad: get(row, "voorraad") || get(row, "beschikbaar") || "",
        });
      }
    }

    const skippedByTab: Record<string, { geen_barcode: number; geen_naam: number }> = {};
    for (const s of skipped) {
      if (!skippedByTab[s.tab]) skippedByTab[s.tab] = { geen_barcode: 0, geen_naam: 0 };
      skippedByTab[s.tab][s.reason]++;
    }

    return NextResponse.json({
      products: allProducts,
      meta: {
        total: allProducts.length,
        skippedCount: skipped.length,
        skippedByTab,
        skipped: skipped.slice(0, 30),
      },
    });
  } catch (err) {
    console.error("[Labels API]", err);
    return NextResponse.json({ error: "Kan producten niet laden" }, { status: 500 });
  }
}
