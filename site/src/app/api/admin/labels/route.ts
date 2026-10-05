import { NextRequest, NextResponse } from "next/server";
import { readBarcodeCell } from "@/lib/barcode-column";
import { ensureCatalogBarcodes } from "@/lib/ensure-barcodes";
import { getSheetSnapshot } from "@/lib/sheet-read";
import { isDailySheetsQuota, isSheetsQuotaError } from "@/lib/sheet-snapshot";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

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

export async function GET(req: NextRequest) {
  try {
    const fresh = req.nextUrl.searchParams.get("fresh") === "1";
    try {
      await ensureCatalogBarcodes({ fresh });
    } catch (err) {
      console.error("[Labels] barcode-kolom aanvullen mislukt:", err);
    }

    const snapshot = await getSheetSnapshot();
    const allProducts: LabelProduct[] = [];
    const skipped: LabelsSkippedRow[] = [];

    for (const tab of snapshot.tabs) {
      const tabName = tab.name;
      const rows = tab.rows;
      if (!rows || rows.length < 2) continue;

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

      for (let i = 1; i < rows.length; i++) {
        const row = rows[i];
        const naam = get(row, "naam", "title", "product");
        const barcode = readBarcodeCell(headers, row);

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
          prijs: get(row, "prijs", "price") || "",
          barcode,
          categorie: tabName,
          voorraad: get(row, "voorraad", "beschikbaar", "stock") || "",
        });
      }
    }

    const skippedByTab: Record<string, { geen_barcode: number; geen_naam: number }> = {};
    for (const s of skipped) {
      if (!skippedByTab[s.tab]) skippedByTab[s.tab] = { geen_barcode: 0, geen_naam: 0 };
      skippedByTab[s.tab][s.reason]++;
    }

    return NextResponse.json(
      {
        products: allProducts,
        meta: {
          total: allProducts.length,
          skippedCount: skipped.length,
          skippedByTab,
          skipped: skipped.slice(0, 30),
        },
      },
      {
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate",
        },
      }
    );
  } catch (err) {
    console.error("[Labels API]", err);
    if (isSheetsQuotaError(err)) {
      const error = isDailySheetsQuota(err)
        ? "Daglimiet van Google Sheets is bereikt. De catalogus komt terug na de reset, meestal middernacht Pacific Time."
        : "Google Sheet-limiet even bereikt. Wacht een minuut en ververs opnieuw.";
      return NextResponse.json({ error }, { status: 503 });
    }
    return NextResponse.json({ error: "Kan producten niet laden" }, { status: 500 });
  }
}
