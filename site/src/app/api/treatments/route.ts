import { NextRequest, NextResponse } from "next/server";
import { getTreatments } from "@/lib/treatments";
import { listTreatmentShopifyVariants } from "@/lib/treatment-shopify";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const treatments = await getTreatments();
    const checkout = req.nextUrl.searchParams.get("checkout") === "1";

    if (!checkout) {
      return NextResponse.json(
        { treatments },
        { headers: { "Cache-Control": "no-store" } }
      );
    }

    let shopify: Awaited<ReturnType<typeof listTreatmentShopifyVariants>> | null = null;
    try {
      shopify = await listTreatmentShopifyVariants();
    } catch (err) {
      console.error("[Treatments] Shopify-status:", err);
    }

    const withCheckout = treatments.map((t) => ({
      ...t,
      ...(shopify
        ? { inShopify: shopify.has(t.barcode.trim().toUpperCase()) }
        : {}),
    }));

    return NextResponse.json(
      { treatments: withCheckout },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Kan behandelingen niet laden";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
