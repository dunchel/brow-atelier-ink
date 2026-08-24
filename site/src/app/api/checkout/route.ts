import { NextRequest, NextResponse } from "next/server";
import { buildDirectCheckoutUrl, createCart } from "@/lib/cart";
import { resolveOrderableVariant } from "@/lib/shopify-catalog";

export const runtime = "nodejs";

function whatsappLink(productTitle: string) {
  return `https://wa.me/31623747712?text=${encodeURIComponent(
    `Hoi! Ik wil graag bestellen: ${productTitle}`
  )}`;
}

export async function POST(req: NextRequest) {
  try {
    const { productTitle, variantId: directVariantId, quantity: rawQty, resolveOnly } = await req.json();
    const quantity = Math.max(1, Math.min(20, Number(rawQty) || 1));

    let variantId = directVariantId;

    if (!variantId && productTitle) {
      const result = await resolveOrderableVariant(productTitle);

      if (result.status === "out_of_stock") {
        return NextResponse.json(
          {
            error: `${result.title} is momenteel uitverkocht.`,
            outOfStock: true,
            whatsapp: whatsappLink(result.title),
          },
          { status: 409 }
        );
      }

      if (result.status === "unknown") {
        return NextResponse.json(
          {
            error: "Product niet gevonden. Neem contact op via WhatsApp.",
            whatsapp: whatsappLink(productTitle),
          },
          { status: 404 }
        );
      }

      variantId = result.ref.variantId;
    }

    if (!variantId) {
      return NextResponse.json({ error: "Geen product opgegeven" }, { status: 400 });
    }

    // Alleen het variant-id; In winkelwagen mag nooit een checkout-URL krijgen.
    if (resolveOnly) {
      return NextResponse.json({ variantId });
    }

    const directUrl = buildDirectCheckoutUrl(variantId, quantity);

    try {
      const cart = await createCart(variantId, quantity);
      if (cart?.checkoutUrl) {
        return NextResponse.json({ checkoutUrl: cart.checkoutUrl });
      }
    } catch (err) {
      console.error("[Checkout] Storefront-cart geweigerd, val terug op Online Store:", err);
    }

    if (directUrl) {
      return NextResponse.json({ checkoutUrl: directUrl, via: "online-store" });
    }

    return NextResponse.json(
      { error: "Checkout kon niet worden aangemaakt" },
      { status: 500 }
    );
  } catch (err) {
    console.error("[Checkout] Error:", err);
    const message = err instanceof Error ? err.message : "Er ging iets mis. Probeer het opnieuw.";
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
