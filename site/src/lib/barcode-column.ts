/**
 * Barcodes in de Google Sheet.
 *
 * Sieraden: BA-OOR / BA-KET / BA-RIN, dezelfde reeks als in Shopify.
 * Tabs zonder bestaande reeks volgen hetzelfde patroon (BA- + 3 letters).
 * Behandelingen horen hier niet: die houden BA-BHL-{aimyId} en hun eigen tab.
 *
 * Een extra barcode-kolom (leeg vóór de gevulde) mag de echte code niet
 * verbergen. We lezen de eerste niet-lege cel.
 */

export function normalizeHeader(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, "");
}

const BARCODE_HEADER_KEYS = ["barcode", "sku", "productcode", "ean", "artikelcode"];

const PREFIX_BY_TAB: Record<string, string> = {
  oorbellen: "BA-OOR",
  kettingen: "BA-KET",
  ringen: "BA-RIN",
  piercings: "BA-PIE",
  "mini parfums": "BA-MIN",
  miniparfums: "BA-MIN",
  parfums: "BA-PAR",
  accessoires: "BA-ACC",
  accessories: "BA-ACC",
};

export function prefixForTab(tab: string): string | null {
  const key = tab.trim().toLowerCase().replace(/\s+/g, " ");
  return PREFIX_BY_TAB[key] ?? null;
}

export function barcodeColumnIndexes(headers: string[]): number[] {
  const indexes: number[] = [];
  headers.forEach((header, index) => {
    const key = normalizeHeader(header);
    if (BARCODE_HEADER_KEYS.includes(key) || key.includes("barcode")) indexes.push(index);
  });
  return indexes;
}

/** Eerste gevulde barcode, ook als er een lege extra kolom vóór staat. */
export function readBarcodeCell(headers: string[], row: string[]): string {
  for (const index of barcodeColumnIndexes(headers)) {
    const value = (row[index] || "").trim();
    if (value) return value;
  }
  return "";
}

export function formatBarcode(prefix: string, n: number): string {
  const width = n < 1000 ? 3 : String(n).length;
  return `${prefix}-${String(n).padStart(width, "0")}`;
}

function readName(headers: string[], row: string[]): string {
  for (const key of ["naam", "title", "product"]) {
    const index = headers.findIndex((header) => normalizeHeader(header) === key);
    if (index < 0) continue;
    const value = (row[index] || "").trim();
    if (value) return value;
  }
  return "";
}

function nextFree(prefix: string, used: Set<string>): string {
  const pattern = new RegExp(`^${prefix.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}-(\\d+)$`, "i");
  let max = 0;
  for (const code of Array.from(used)) {
    const match = code.match(pattern);
    if (match) max = Math.max(max, Number(match[1]));
  }
  let n = max + 1;
  let code = formatBarcode(prefix, n);
  while (used.has(code)) {
    n += 1;
    code = formatBarcode(prefix, n);
  }
  return code;
}

export interface BarcodeColumnPlan {
  changed: boolean;
  colIndex: number;
  /** Kolom van header tot laatste rij, klaar om terug te schrijven. */
  column: string[];
  assigned: number;
}

/**
 * Vult lege barcode-cellen. Bestaande codes blijven staan.
 * `reserved` wordt aangevuld met nieuwe codes, zodat de volgende tab niet
 * hetzelfde nummer pakt.
 * `null` = deze tab krijgt geen sieraden-barcode (behandelingen).
 */
export function planBarcodeColumn(args: {
  tab: string;
  rows: string[][];
  reserved: Set<string>;
}): BarcodeColumnPlan | null {
  const prefix = prefixForTab(args.tab);
  if (!prefix || args.rows.length === 0) return null;

  const headers = [...args.rows[0]];
  let indexes = barcodeColumnIndexes(headers);
  let headerAdded = false;
  if (!indexes.some((index) => normalizeHeader(headers[index]) === "barcode")) {
    headers.push("Barcode");
    indexes = barcodeColumnIndexes(headers);
    headerAdded = true;
  }
  const colIndex = indexes.find((index) => normalizeHeader(headers[index]) === "barcode") ?? indexes[0];

  const column: string[] = [headers[colIndex] || "Barcode"];
  let assigned = 0;

  for (let i = 1; i < args.rows.length; i++) {
    const row = args.rows[i] || [];
    const existing = readBarcodeCell(headers, row).toUpperCase();
    if (existing) args.reserved.add(existing);

    if (!readName(headers, row)) {
      column.push((row[colIndex] || "").trim());
      continue;
    }

    if (existing) {
      column.push(existing);
      continue;
    }

    const code = nextFree(prefix, args.reserved);
    args.reserved.add(code);
    column.push(code);
    assigned += 1;
  }

  return {
    changed: headerAdded || assigned > 0,
    colIndex,
    column,
    assigned,
  };
}
