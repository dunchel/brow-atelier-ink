import { createSign } from "crypto";

const GOOGLE_CLIENT_EMAIL = process.env.GOOGLE_CLIENT_EMAIL || "";
const GOOGLE_PRIVATE_KEY = (process.env.GOOGLE_PRIVATE_KEY || "").replace(/\\n/g, "\n");
const GOOGLE_SHEET_ID = process.env.GOOGLE_SHEET_ID || "";

async function getAccessToken(): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const header = Buffer.from(JSON.stringify({ alg: "RS256", typ: "JWT" })).toString("base64url");
  const payload = Buffer.from(
    JSON.stringify({
      iss: GOOGLE_CLIENT_EMAIL,
      scope: "https://www.googleapis.com/auth/spreadsheets.readonly",
      aud: "https://oauth2.googleapis.com/token",
      iat: now,
      exp: now + 3600,
    })
  ).toString("base64url");

  const signatureInput = `${header}.${payload}`;
  const sign = createSign("RSA-SHA256");
  sign.update(signatureInput);
  const signature = sign.sign(GOOGLE_PRIVATE_KEY, "base64url");

  const jwt = `${signatureInput}.${signature}`;

  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: `grant_type=urn%3Aietf%3Aparams%3Aoauth%3Agrant-type%3Ajwt-bearer&assertion=${jwt}`,
  });

  const data = await res.json();
  if (!data.access_token) {
    throw new Error(`Google auth fout: ${JSON.stringify(data)}`);
  }

  return data.access_token;
}

export interface SheetRow {
  [key: string]: string;
}

export async function getSheetData(sheetName?: string): Promise<SheetRow[]> {
  if (!GOOGLE_CLIENT_EMAIL || !GOOGLE_PRIVATE_KEY || !GOOGLE_SHEET_ID) {
    return [];
  }

  try {
    const token = await getAccessToken();
    const range = sheetName ? encodeURIComponent(sheetName) : "Sheet1";

    const res = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${GOOGLE_SHEET_ID}/values/${range}?majorDimension=ROWS`,
      {
        headers: { Authorization: `Bearer ${token}` },
        next: { revalidate: 300 },
      }
    );

    if (!res.ok) {
      const text = await res.text();
      console.error("[Google Sheets] API error:", res.status, text);
      return [];
    }

    const data = await res.json();
    const rows: string[][] = data.values || [];

    if (rows.length < 2) return [];

    const headers = rows[0].map((h: string) => h.trim().toLowerCase());
    return rows.slice(1).map((row: string[]) => {
      const obj: SheetRow = {};
      headers.forEach((header: string, idx: number) => {
        obj[header] = (row[idx] || "").trim();
      });
      return obj;
    });
  } catch (err) {
    console.error("[Google Sheets] Error:", err);
    return [];
  }
}

export async function getSheetNames(): Promise<string[]> {
  if (!GOOGLE_CLIENT_EMAIL || !GOOGLE_PRIVATE_KEY || !GOOGLE_SHEET_ID) {
    return [];
  }

  try {
    const token = await getAccessToken();
    const res = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${GOOGLE_SHEET_ID}?fields=sheets.properties.title`,
      { headers: { Authorization: `Bearer ${token}` } }
    );

    if (!res.ok) return [];

    const data = await res.json();
    return data.sheets?.map((s: { properties: { title: string } }) => s.properties.title) || [];
  } catch {
    return [];
  }
}
