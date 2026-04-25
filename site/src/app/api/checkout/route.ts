import { NextRequest, NextResponse } from "next/server";
import { createCart, getVariantByProductTitle } from "@/lib/cart";

export async function POST(req: NextRequest) {
  try {
    const { productTitle, variantId: directVariantId, quantity: rawQty, resolveOnly } = await req.json();
    const quantity = Math.max(1, Math.min(20, Number(rawQty) || 1));

    let variantId = directVariantId;

    if (!variantId && productTitle) {
      const result = await getVariantByProductTitle(productTitle);
      if (!result) {
        return NextResponse.json(
          {
            error: "Product niet gevonden in Shopify. Neem contact op via WhatsApp.",
            whatsapp: `https://wa.me/31623747712?text=${encodeURIComponent(
              `Hoi! Ik wil graag bestellen: ${productTitle}`
            )}`,
          },
          { status: 404 }
        );
      }
      variantId = result.variantId;
    }

    if (!variantId) {
      return NextResponse.json({ error: "Geen product opgegeven" }, { status: 400 });
    }

    if (resolveOnly) {
      return NextResponse.json({ variantId });
    }

    const cart = await createCart(variantId, quantity);

    if (!cart?.checkoutUrl) {
      return NextResponse.json(
        { error: "Checkout kon niet worden aangemaakt" },
        { status: 500 }
      );
    }

    return NextResponse.json({ checkoutUrl: cart.checkoutUrl });
  } catch (err) {
    console.error("[Checkout] Error:", err);
    const message = err instanceof Error ? err.message : "Er ging iets mis. Probeer het opnieuw.";
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
