import { NextRequest, NextResponse } from "next/server";
import { findProductByBarcode, parseStockCount } from "@/lib/sheet-inventory";

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
    if (!product) {
      return NextResponse.json({ error: "Product niet gevonden", code }, { status: 404 });
    }

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
      },
    });
  } catch (err) {
    console.error("[Product lookup]", err);
    const message = err instanceof Error ? err.message : "Lookup mislukt";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
