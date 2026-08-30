import { NextRequest, NextResponse } from "next/server";
import { getCart, updateCartLine, removeCartLine } from "@/lib/cart";
import { addCartLine } from "@/lib/cart-add";
import { resolveTreatmentForCart } from "@/lib/treatment-shopify";

export async function GET(req: NextRequest) {
  const cartId = req.nextUrl.searchParams.get("cartId");
  if (!cartId) {
    return NextResponse.json({ error: "Geen cartId opgegeven" }, { status: 400 });
  }
  try {
    const cart = await getCart(cartId);
    return NextResponse.json({ cart });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Fout bij ophalen winkelwagen";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { cartId, variantId, barcode, quantity = 1 } = await req.json();

    let merchandiseId = variantId as string | undefined;
    if (!merchandiseId && barcode) {
      merchandiseId = await resolveTreatmentForCart(String(barcode));
    }

    if (!merchandiseId) {
      return NextResponse.json({ error: "Geen variantId opgegeven" }, { status: 400 });
    }

    const cart = await addCartLine(cartId, merchandiseId, quantity);
    return NextResponse.json({ cart });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Kon niet toevoegen aan winkelwagen. Probeer het opnieuw.";
    const status = /niet in je mandje|niet op het verkoopkanaal|nog niet in kassa|nog geen prijs/i.test(message) ? 409 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const { cartId, lineId, quantity } = await req.json();

    if (!cartId || !lineId || quantity == null) {
      return NextResponse.json({ error: "cartId, lineId en quantity zijn verplicht" }, { status: 400 });
    }

    const cart = await updateCartLine(cartId, lineId, quantity);
    return NextResponse.json({ cart });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Fout bij bijwerken winkelwagen";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { cartId, lineId } = await req.json();

    if (!cartId || !lineId) {
      return NextResponse.json({ error: "cartId en lineId zijn verplicht" }, { status: 400 });
    }

    const cart = await removeCartLine(cartId, lineId);
    return NextResponse.json({ cart });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Fout bij verwijderen uit winkelwagen";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
