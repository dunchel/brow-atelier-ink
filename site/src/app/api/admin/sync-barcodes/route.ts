import { NextRequest, NextResponse } from "next/server";
import { getAllInventoryProducts } from "@/lib/sheet-inventory";
import { isRateLimitError, shopifyErrorMessage, shopifyRest } from "@/lib/shopify-admin";

interface ShopifyProduct {
  id: number;
  title: string;
  variants: { id: number; barcode: string | null; sku: string | null }[];
}

async function findProductExact(title: string): Promise<ShopifyProduct | null> {
  const data = await shopifyRest(
    `products.json?title=${encodeURIComponent(title)}&limit=10`
  );
  const products = (data?.products ?? []) as ShopifyProduct[];
  const t = title.trim().toLowerCase();
  return products.find((p) => p.title.trim().toLowerCase() === t) ?? null;
}

export async function POST(req: NextRequest) {
  try {
    const { offset = 0, batchSize = 2 } = await req.json().catch(() => ({
      offset: 0,
      batchSize: 2,
    }));

    const inventory = await getAllInventoryProducts();
    if (inventory.length === 0) {
      return NextResponse.json({ error: "Geen producten in Google Sheet" }, { status: 400 });
    }

    const batch = inventory.slice(offset, offset + batchSize);
    const results: {
      title: string;
      barcode: string;
      status: string;
      error?: string;
    }[] = [];
    let updated = 0;
    let skipped = 0;
    let failed = 0;
    let notFound = 0;
    let rateLimited = 0;

    for (const item of batch) {
      try {
        const shopifyProduct = await findProductExact(item.naam);
        if (!shopifyProduct) {
          results.push({
            title: item.naam,
            barcode: item.barcode,
            status: "not_found",
          });
          notFound++;
          continue;
        }

        const variant = shopifyProduct.variants[0];
        if (!variant) {
          results.push({
            title: item.naam,
            barcode: item.barcode,
            status: "error",
            error: "Geen variant",
          });
          failed++;
          continue;
        }

        if (variant.barcode === item.barcode && variant.sku === item.barcode) {
          results.push({
            title: item.naam,
            barcode: item.barcode,
            status: "ok",
          });
          skipped++;
          continue;
        }

        const data = await shopifyRest(`products/${shopifyProduct.id}.json`, "PUT", {
          product: {
            id: shopifyProduct.id,
            variants: [
              {
                id: variant.id,
                barcode: item.barcode,
                sku: item.barcode,
              },
            ],
          },
        });

        const err = shopifyErrorMessage(data);
        if (err) throw new Error(err);

        results.push({
          title: item.naam,
          barcode: item.barcode,
          status: "updated",
        });
        updated++;
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Onbekende fout";
        if (isRateLimitError(msg)) rateLimited++;
        results.push({
          title: item.naam,
          barcode: item.barcode,
          status: "error",
          error: msg,
        });
        failed++;
      }
    }

    const nextOffset = offset + batchSize;
    const hasMore = nextOffset < inventory.length;

    return NextResponse.json({
      summary: {
        total: inventory.length,
        updated,
        skipped,
        notFound,
        failed,
        rateLimited,
        processed: offset + batch.length,
      },
      results,
      hasMore,
      nextOffset: hasMore ? nextOffset : null,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Barcode sync mislukt";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
