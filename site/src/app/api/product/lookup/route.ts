import { NextRequest, NextResponse } from "next/server";
import { findProductByBarcode, parseStockCount } from "@/lib/sheet-inventory";
import { findTreatmentByBarcode } from "@/lib/treatments";

export const runtime = "nodejs";

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export async function GET(req: NextRequest) {
  try {
    const code = req.nextUrl.searchParams.get("code")?.trim();
    if (!code) {
      return NextResponse.json({ error: "Geen productcode opgegeven" }, { status: 400 });
    }

    const product = await findProductByBarcode(code);
    if (product) {
      const stockCount = parseStockCount(product.voorraad);
      return NextResponse.json({
        product: {
          naam: product.naam,
          prijs: product.prijs,
          barcode: product.barcode,
          categorie: product.categorie,
          foto: product.foto || null,
          handle: slugify(product.naam),
          stockCount,
          available: stockCount > 0,
          kind: "product",
        },
      });
    }

    const treatment = await findTreatmentByBarcode(code);
    if (treatment) {
      return NextResponse.json({
        product: {
          naam: treatment.naam,
          prijs: treatment.prijs,
          barcode: treatment.barcode,
          categorie: treatment.categorie,
          foto: null,
          handle: slugify(treatment.naam),
          stockCount: 999,
          available: true,
          kind: "behandeling",
        },
      });
    }

    return NextResponse.json({ error: "Product niet gevonden", code }, { status: 404 });
  } catch (err) {
    console.error("[Product lookup]", err);
    const message = err instanceof Error ? err.message : "Lookup mislukt";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
