import { google } from "googleapis";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 60;

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

interface ProductPhotoCheck {
  naam: string;
  barcode: string;
  categorie: string;
  url: string;
  status: "ok" | "broken" | "missing" | "unknown";
  httpStatus?: number;
  error?: string;
}

async function checkUrl(url: string): Promise<{
  status: "ok" | "broken" | "unknown";
  httpStatus?: number;
  error?: string;
}> {
  if (!url || !/^https?:\/\//i.test(url)) {
    return { status: "broken", error: "Geen geldige URL" };
  }
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 7000);
    let res = await fetch(url, {
      method: "HEAD",
      signal: controller.signal,
      redirect: "follow",
    });
    if (!res.ok || res.status >= 400) {
      // some hosts (catbox) reject HEAD; fall back to ranged GET
      res = await fetch(url, {
        method: "GET",
        signal: controller.signal,
        redirect: "follow",
        headers: { Range: "bytes=0-128" },
      });
    }
    clearTimeout(timer);
    if (res.ok || (res.status >= 200 && res.status < 400)) {
      return { status: "ok", httpStatus: res.status };
    }
    return { status: "broken", httpStatus: res.status };
  } catch (err) {
    return {
      status: "broken",
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

async function checkAllConcurrent<T>(
  items: T[],
  worker: (item: T) => Promise<ProductPhotoCheck>,
  concurrency = 8
): Promise<ProductPhotoCheck[]> {
  const results: ProductPhotoCheck[] = [];
  let cursor = 0;
  const runners = Array.from({ length: concurrency }, async () => {
    while (cursor < items.length) {
      const idx = cursor++;
      results[idx] = await worker(items[idx]);
    }
  });
  await Promise.all(runners);
  return results;
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

    const productList: Array<{
      naam: string;
      barcode: string;
      categorie: string;
      url: string;
    }> = [];

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

      for (const row of rows.slice(1)) {
        const naam = get(row, "naam") || get(row, "title") || get(row, "product");
        const barcode = get(row, "barcode");
        if (!naam || !barcode) continue;
        const url =
          get(row, "foto") ||
          get(row, "afbeelding") ||
          get(row, "image") ||
          get(row, "image src");
        productList.push({ naam, barcode, categorie: tabName, url });
      }
    }

    const checks = await checkAllConcurrent(productList, async (p) => {
      if (!p.url) {
        return {
          naam: p.naam,
          barcode: p.barcode,
          categorie: p.categorie,
          url: "",
          status: "missing" as const,
        };
      }
      const result = await checkUrl(p.url);
      return {
        naam: p.naam,
        barcode: p.barcode,
        categorie: p.categorie,
        url: p.url,
        ...result,
      };
    });

    const summary = {
      total: checks.length,
      ok: checks.filter((c) => c.status === "ok").length,
      broken: checks.filter((c) => c.status === "broken").length,
      missing: checks.filter((c) => c.status === "missing").length,
    };

    return NextResponse.json({
      summary,
      broken: checks.filter((c) => c.status === "broken"),
      missing: checks.filter((c) => c.status === "missing"),
      ok: checks.filter((c) => c.status === "ok").map((c) => ({
        naam: c.naam,
        barcode: c.barcode,
        url: c.url,
      })),
    });
  } catch (err) {
    console.error("[CheckPhotos] error", err);
    const message = err instanceof Error ? err.message : "Kon foto's niet controleren";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
