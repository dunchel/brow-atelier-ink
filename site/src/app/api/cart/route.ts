import { NextRequest, NextResponse } from "next/server";
import {
  getCart,
  createCart,
  addToCart,
  updateCartLine,
  removeCartLine,
} from "@/lib/cart";

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
    const { cartId, variantId, quantity = 1 } = await req.json();

    if (!variantId) {
      return NextResponse.json({ error: "Geen variantId opgegeven" }, { status: 400 });
    }

    let cart;
    if (cartId) {
      cart = await addToCart(cartId, variantId, quantity);
    } else {
      cart = await createCart(variantId, quantity);
    }

    return NextResponse.json({ cart });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Fout bij toevoegen aan winkelwagen";
    return NextResponse.json({ error: message }, { status: 500 });
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
