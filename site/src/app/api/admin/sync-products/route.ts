import { NextRequest, NextResponse } from "next/server";
import { getAllProducts } from "@/lib/products";
import { getAllInventoryProducts } from "@/lib/sheet-inventory";
import { isRateLimitError } from "@/lib/shopify-admin";
import { createShopifyProduct, findShopifyProductByTitle } from "@/lib/shopify-catalog";
import { normalizeTitle } from "@/lib/product-match";

export async function POST(req: NextRequest) {
  try {
    const { offset = 0, batchSize = 1 } = await req.json().catch(() => ({
      offset: 0,
      batchSize: 1,
    }));

    const allProducts = await getAllProducts();
    const inventory = await getAllInventoryProducts();
    const barcodeByTitle = new Map(
      inventory.map((p) => [normalizeTitle(p.naam), p.barcode])
    );

    if (allProducts.length === 0) {
      return NextResponse.json({ error: "Geen producten gevonden in de Sheet" }, { status: 400 });
    }

    const batch = allProducts.slice(offset, offset + batchSize);
    const results: { title: string; status: string; error?: string }[] = [];
    let created = 0;
    let skipped = 0;
    let failed = 0;
    let rateLimited = 0;

    for (const product of batch) {
      try {
        const existing = await findShopifyProductByTitle(product.title);
        if (existing) {
          results.push({ title: product.title, status: "exists" });
          skipped++;
          continue;
        }

        await createShopifyProduct({
          ...product,
          barcode: barcodeByTitle.get(normalizeTitle(product.title)),
        });
        results.push({ title: product.title, status: "created" });
        created++;
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Onbekende fout";
        if (isRateLimitError(msg)) rateLimited++;
        results.push({ title: product.title, status: "error", error: msg });
        failed++;
      }
    }

    const nextOffset = offset + batchSize;
    const hasMore = nextOffset < allProducts.length;

    return NextResponse.json({
      summary: {
        total: allProducts.length,
        created,
        skipped,
        failed,
        rateLimited,
        processed: offset + batch.length,
      },
      results,
      hasMore,
      nextOffset: hasMore ? nextOffset : null,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Sync mislukt";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
