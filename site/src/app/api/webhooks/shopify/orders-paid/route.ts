import { NextRequest, NextResponse } from "next/server";
import { createHmac, timingSafeEqual } from "crypto";
import { findProductByBarcode, findProductByTitle, updateStockByBarcode } from "@/lib/sheet-inventory";

export const runtime = "nodejs";

interface ShopifyLineItem {
  title: string;
  quantity: number;
  sku?: string | null;
}

interface ShopifyOrder {
  id: number;
  name: string;
  line_items: ShopifyLineItem[];
}

function verifyShopifyWebhook(rawBody: string, hmacHeader: string | null): boolean {
  const secret = process.env.SHOPIFY_WEBHOOK_SECRET;
  if (!secret || !hmacHeader) return false;
  const hash = createHmac("sha256", secret).update(rawBody, "utf8").digest("base64");
  try {
    return timingSafeEqual(Buffer.from(hash), Buffer.from(hmacHeader));
  } catch {
    return false;
  }
}

export async function POST(req: NextRequest) {
  const rawBody = await req.text();
  const hmac = req.headers.get("x-shopify-hmac-sha256");

  if (process.env.SHOPIFY_WEBHOOK_SECRET && !verifyShopifyWebhook(rawBody, hmac)) {
    return NextResponse.json({ error: "Ongeldige webhook handtekening" }, { status: 401 });
  }

  try {
    const order = JSON.parse(rawBody) as ShopifyOrder;
    const results: { title: string; barcode?: string; delta: number; ok: boolean; error?: string }[] = [];

    for (const item of order.line_items || []) {
      const sku = item.sku?.trim();
      let product = sku ? await findProductByBarcode(sku) : null;
      if (!product) {
        product = await findProductByTitle(item.title);
      }
      if (!product) {
        results.push({
          title: item.title,
          delta: -item.quantity,
          ok: false,
          error: "Geen match in Google Sheet",
        });
        continue;
      }
      try {
        await updateStockByBarcode(product.barcode, -item.quantity);
        results.push({
          title: item.title,
          barcode: product.barcode,
          delta: -item.quantity,
          ok: true,
        });
      } catch (err) {
        results.push({
          title: item.title,
          barcode: product.barcode,
          delta: -item.quantity,
          ok: false,
          error: err instanceof Error ? err.message : "Update mislukt",
        });
      }
    }

    console.log(`[Webhook orders-paid] ${order.name}`, results);
    return NextResponse.json({ ok: true, order: order.name, results });
  } catch (err) {
    console.error("[Webhook orders-paid]", err);
    return NextResponse.json({ error: "Webhook verwerking mislukt" }, { status: 500 });
  }
}
