import { NextRequest, NextResponse } from "next/server";
import { updateStockByBarcode } from "@/lib/sheet-inventory";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const barcode = (body.barcode as string)?.trim();
    if (!barcode) {
      return NextResponse.json({ error: "Geen barcode opgegeven" }, { status: 400 });
    }

    let delta: number;
    if (body.action === "sell") delta = -1;
    else if (body.action === "return") delta = 1;
    else if (typeof body.delta === "number") delta = body.delta;
    else {
      return NextResponse.json(
        { error: "Geef action (sell/return) of delta op" },
        { status: 400 }
      );
    }

    const result = await updateStockByBarcode(barcode, delta);

    return NextResponse.json({
      ok: true,
      barcode,
      oldStock: result.oldStock,
      newStock: result.newStock,
      product: {
        naam: result.product.naam,
        prijs: result.product.prijs,
        barcode: result.product.barcode,
        categorie: result.product.categorie,
        voorraad: String(result.newStock),
      },
    });
  } catch (err) {
    console.error("[Stock]", err);
    const message = err instanceof Error ? err.message : "Voorraad update mislukt";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
