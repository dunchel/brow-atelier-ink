import { NextRequest, NextResponse } from "next/server";
import { createCart, getVariantByProductTitle } from "@/lib/cart";

export async function POST(req: NextRequest) {
  try {
    const { productTitle, variantId: directVariantId } = await req.json();

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

    const cart = await createCart(variantId);

    if (!cart?.checkoutUrl) {
      return NextResponse.json(
        { error: "Checkout kon niet worden aangemaakt" },
        { status: 500 }
      );
    }

    return NextResponse.json({ checkoutUrl: cart.checkoutUrl });
  } catch {
    return NextResponse.json(
      { error: "Er ging iets mis. Probeer het opnieuw." },
      { status: 500 }
    );
  }
}
