import { NextRequest, NextResponse } from "next/server";
import { findProductByBarcode, parseStockCount } from "@/lib/sheet-inventory";
import { findTreatmentByBarcode } from "@/lib/treatments";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  try {
    const code = req.nextUrl.searchParams.get("code")?.trim();
    if (!code) {
      return NextResponse.json({ error: "Geen barcode opgegeven" }, { status: 400 });
    }

    const product = await findProductByBarcode(code);
    if (product) {
      return NextResponse.json({
        product: {
          naam: product.naam,
          prijs: product.prijs,
          barcode: product.barcode,
          categorie: product.categorie,
          voorraad: product.voorraad,
          stockCount: parseStockCount(product.voorraad),
          foto: product.foto || null,
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
          voorraad: "",
          stockCount: 999,
          foto: null,
          kind: "behandeling",
        },
      });
    }

    return NextResponse.json({ error: "Product niet gevonden", code }, { status: 404 });
  } catch (err) {
    console.error("[Lookup]", err);
    const message = err instanceof Error ? err.message : "Lookup mislukt";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
