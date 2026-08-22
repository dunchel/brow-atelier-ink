import { google } from "googleapis";

export const TREATMENT_TAB = "Behandelingen";

export interface Treatment {
  naam: string;
  prijs: string;
  barcode: string;
  categorie: string;
  duur: string;
}

export const DEFAULT_TREATMENTS: Treatment[] = [
  {
    naam: "Powder Brows",
    prijs: "",
    barcode: "BA-BHL-001",
    categorie: "Brows",
    duur: "2–3 uur",
  },
  {
    naam: "Hybrid Brows + Shape",
    prijs: "",
    barcode: "BA-BHL-002",
    categorie: "Brows",
    duur: "1,5–2 uur",
  },
  {
    naam: "Full Brow Lamination + Hybrid Tint",
    prijs: "",
    barcode: "BA-BHL-003",
    categorie: "Brows",
    duur: "60–90 min",
  },
  {
    naam: "Henna Brows",
    prijs: "",
    barcode: "BA-BHL-004",
    categorie: "Brows",
    duur: "45–60 min",
  },
  {
    naam: "Full Brow Lamination",
    prijs: "",
    barcode: "BA-BHL-005",
    categorie: "Brows",
    duur: "45–60 min",
  },
  {
    naam: "Brow Wax & Tint",
    prijs: "",
    barcode: "BA-BHL-006",
    categorie: "Brows",
    duur: "45–60 min",
  },
  {
    naam: "Brow Wax",
    prijs: "",
    barcode: "BA-BHL-007",
    categorie: "Brows",
    duur: "30–45 min",
  },
  {
    naam: "Lash Lift + Tint",
    prijs: "",
    barcode: "BA-BHL-008",
    categorie: "Lashes",
    duur: "45–60 min",
  },
  {
    naam: "Faux Freckles",
    prijs: "",
    barcode: "BA-BHL-009",
    categorie: "Faux Freckles",
    duur: "60–90 min",
  },
  {
    naam: "Lip Blush",
    prijs: "",
    barcode: "BA-BHL-010",
    categorie: "Lip Blush",
    duur: "1,5–2 uur",
  },
];

const TREATMENT_TAB_ALIASES = new Set([
  "behandelingen",
  "behandeling",
  "diensten",
  "treatments",
]);

const TREATMENT_TYPE_RE =
  /behandeling|treatment|brows?|wenkbrauw|lash|wimper|henna|lamination|powder|lip\s*blush|freckle|sproet/i;

export function isTreatmentTabName(name: string): boolean {
  return TREATMENT_TAB_ALIASES.has(name.trim().toLowerCase());
}

export function isTreatmentBarcode(barcode: string): boolean {
  return /^BA-BHL-/i.test(barcode.trim());
}

export function isTreatmentRevenueItem(input: {
  title?: string;
  productType?: string;
  tags?: string[];
  sku?: string;
  barcode?: string;
}): boolean {
  if (input.barcode && isTreatmentBarcode(input.barcode)) return true;
  if (input.sku && isTreatmentBarcode(input.sku)) return true;
  const type = (input.productType || "").toLowerCase();
  if (type.includes("behandeling") || type.includes("treatment") || type.includes("dienst")) {
    return true;
  }
  const tags = (input.tags || []).map((t) => t.toLowerCase());
  if (tags.some((t) => t === "behandeling" || t === "behandelingen" || t === "treatment")) {
    return true;
  }
  const title = input.title || "";
  if (DEFAULT_TREATMENTS.some((t) => t.naam.toLowerCase() === title.trim().toLowerCase())) {
    return true;
  }
  return TREATMENT_TYPE_RE.test(title) && !/ketting|armband|oorbel|ring|sieraad/i.test(title);
}

const SHEET_ID = process.env.GOOGLE_SHEET_ID || "";
const GOOGLE_CREDENTIALS_B64 = process.env.GOOGLE_CREDENTIALS_B64 || "";

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

function parseTreatmentRows(rows: string[][]): Treatment[] {
  if (!rows || rows.length < 2) return [];
  const headers = rows[0].map((h) => h.trim().toLowerCase().replace(/\s+/g, ""));
  const get = (row: string[], ...keys: string[]) => {
    for (const key of keys) {
      const idx = headers.indexOf(key.replace(/\s+/g, ""));
      if (idx >= 0) {
        const val = (row[idx] || "").trim();
        if (val) return val;
      }
    }
    return "";
  };

  const items: Treatment[] = [];
  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    const naam = get(row, "naam", "title", "behandeling", "product");
    const barcode = get(row, "barcode", "sku", "productcode");
    if (!naam || !barcode) continue;
    items.push({
      naam,
      prijs: get(row, "prijs", "price") || "",
      barcode,
      categorie: get(row, "categorie", "category") || "Behandelingen",
      duur: get(row, "duur", "duration") || "",
    });
  }
  return items;
}

async function findTreatmentsTabName(): Promise<string | null> {
  const sheets = getReadClient();
  const meta = await sheets.spreadsheets.get({
    spreadsheetId: SHEET_ID,
    fields: "sheets.properties.title",
  });
  const names =
    meta.data.sheets?.map((s) => s.properties?.title).filter(Boolean) as string[];
  return names.find((n) => isTreatmentTabName(n)) ?? null;
}

export async function getTreatmentsFromSheet(): Promise<Treatment[]> {
  if (!SHEET_ID || !GOOGLE_CREDENTIALS_B64) return [];
  try {
    const tab = await findTreatmentsTabName();
    if (!tab) return [];
    const sheets = getReadClient();
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId: SHEET_ID,
      range: `'${tab}'!A1:Z200`,
    });
    return parseTreatmentRows((res.data.values as string[][]) || []);
  } catch (err) {
    console.error("[Treatments] Sheet read error:", err);
    return [];
  }
}

let treatmentsCache: { data: Treatment[]; timestamp: number } | null = null;
const TREATMENTS_CACHE_TTL = 60_000;

export async function getTreatments(): Promise<Treatment[]> {
  if (treatmentsCache && Date.now() - treatmentsCache.timestamp < TREATMENTS_CACHE_TTL) {
    return treatmentsCache.data;
  }

  const fromSheet = await getTreatmentsFromSheet();
  if (fromSheet.length === 0) {
    const fallback = DEFAULT_TREATMENTS.map((t) => ({ ...t }));
    treatmentsCache = { data: fallback, timestamp: Date.now() };
    return fallback;
  }

  const byBarcode = new Map(fromSheet.map((t) => [t.barcode.toUpperCase(), t]));
  const merged: Treatment[] = DEFAULT_TREATMENTS.map((def) => {
    const existing = byBarcode.get(def.barcode.toUpperCase());
    if (!existing) return { ...def };
    byBarcode.delete(def.barcode.toUpperCase());
    return {
      ...def,
      ...existing,
      duur: existing.duur || def.duur,
      categorie: existing.categorie || def.categorie,
    };
  });
  Array.from(byBarcode.values()).forEach((extra) => {
    merged.push(extra);
  });
  treatmentsCache = { data: merged, timestamp: Date.now() };
  return merged;
}

function bustTreatmentsCache() {
  treatmentsCache = null;
}

export async function findTreatmentByBarcode(
  barcode: string
): Promise<Treatment | null> {
  const code = barcode.trim().toUpperCase();
  if (!code) return null;
  const all = await getTreatments();
  return all.find((t) => t.barcode.toUpperCase() === code) ?? null;
}

export async function ensureTreatmentsSheet(): Promise<{
  created: boolean;
  tab: string;
  treatments: Treatment[];
}> {
  if (!SHEET_ID || !GOOGLE_CREDENTIALS_B64) {
    throw new Error("Google Sheet is niet geconfigureerd");
  }

  const existingTab = await findTreatmentsTabName();
  const sheets = getWriteClient();

  if (!existingTab) {
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId: SHEET_ID,
      requestBody: {
        requests: [{ addSheet: { properties: { title: TREATMENT_TAB } } }],
      },
    });
  }

  const tab = existingTab || TREATMENT_TAB;
  const current = existingTab ? await getTreatmentsFromSheet() : [];

  if (current.length === 0) {
    const values = [
      ["Naam", "Prijs", "Barcode", "Categorie", "Duur"],
      ...DEFAULT_TREATMENTS.map((t) => [
        t.naam,
        t.prijs,
        t.barcode,
        t.categorie,
        t.duur,
      ]),
    ];
    await sheets.spreadsheets.values.update({
      spreadsheetId: SHEET_ID,
      range: `'${tab}'!A1:E${values.length}`,
      valueInputOption: "USER_ENTERED",
      requestBody: { values },
    });
    bustTreatmentsCache();
    return { created: true, tab, treatments: DEFAULT_TREATMENTS.map((t) => ({ ...t })) };
  }

  const have = new Set(current.map((t) => t.barcode.toUpperCase()));
  const missing = DEFAULT_TREATMENTS.filter((t) => !have.has(t.barcode.toUpperCase()));
  if (missing.length > 0) {
    await sheets.spreadsheets.values.append({
      spreadsheetId: SHEET_ID,
      range: `'${tab}'!A:E`,
      valueInputOption: "USER_ENTERED",
      requestBody: {
        values: missing.map((t) => [t.naam, t.prijs, t.barcode, t.categorie, t.duur]),
      },
    });
  }

  bustTreatmentsCache();
  return { created: !existingTab, tab, treatments: await getTreatments() };
}

export async function updateTreatmentPrices(
  updates: { barcode: string; prijs: string }[]
): Promise<Treatment[]> {
  if (!SHEET_ID || !GOOGLE_CREDENTIALS_B64) {
    throw new Error("Google Sheet is niet geconfigureerd");
  }

  await ensureTreatmentsSheet();
  const tab = (await findTreatmentsTabName()) || TREATMENT_TAB;
  const sheets = getWriteClient();
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SHEET_ID,
    range: `'${tab}'!A1:Z200`,
  });
  const rows = (res.data.values as string[][]) || [];
  if (rows.length < 2) throw new Error("Behandelingen-tab is leeg");

  const headers = rows[0].map((h) => h.trim().toLowerCase().replace(/\s+/g, ""));
  const barcodeIdx = ["barcode", "sku", "productcode"]
    .map((k) => headers.indexOf(k))
    .find((i) => i >= 0);
  let prijsIdx = ["prijs", "price"].map((k) => headers.indexOf(k)).find((i) => i >= 0);
  if (barcodeIdx === undefined) throw new Error("Geen barcode-kolom in Behandelingen-tab");
  if (prijsIdx === undefined) {
    prijsIdx = headers.length;
    rows[0][prijsIdx] = "Prijs";
  }

  const byCode = new Map(updates.map((u) => [u.barcode.trim().toUpperCase(), u.prijs]));
  const next = rows.map((row, i) => {
    if (i === 0) return row;
    const code = (row[barcodeIdx] || "").trim().toUpperCase();
    if (!code || !byCode.has(code)) return row;
    const copy = [...row];
    while (copy.length <= prijsIdx) copy.push("");
    copy[prijsIdx] = byCode.get(code) || "";
    return copy;
  });

  await sheets.spreadsheets.values.update({
    spreadsheetId: SHEET_ID,
    range: `'${tab}'!A1:Z${next.length}`,
    valueInputOption: "USER_ENTERED",
    requestBody: { values: next },
  });

  bustTreatmentsCache();
  return getTreatments();
}
