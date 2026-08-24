import { NextRequest, NextResponse } from "next/server";
import { getAllProducts } from "@/lib/products";
import { aggregateStockByTitle, titlesWithoutStock } from "@/lib/stock-sync";
import {
  MISSING_INVENTORY_SCOPE,
  MissingInventoryScope,
  enableTracking,
  findVariantInventory,
  getPrimaryLocation,
  setAvailableQuantity,
} from "@/lib/shopify-inventory";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const { offset = 0, batchSize = 1 } = await req.json().catch(() => ({ offset: 0, batchSize: 1 }));

    const products = await getAllProducts({ fresh: offset === 0 });
    if (products.length === 0) {
      return NextResponse.json({ error: "Geen producten gevonden in de Sheet" }, { status: 400 });
    }

    const rows = products.map((p) => ({ title: p.title, stock: p.stock }));
    const targets = aggregateStockByTitle(rows);
    const skippedNoStock = titlesWithoutStock(rows);

    let location;
    try {
      location = await getPrimaryLocation();
    } catch (err) {
      if (err instanceof MissingInventoryScope) {
        return NextResponse.json({
          error: MISSING_INVENTORY_SCOPE,
          needsScopes: true,
          summary: { total: targets.length, updated: 0, skipped: 0, notFound: 0, failed: 0 },
          results: [],
          hasMore: false,
          nextOffset: null,
        });
      }
      throw err;
    }

    const batch = targets.slice(offset, offset + batchSize);
    const results: { title: string; status: string; quantity?: number; error?: string }[] = [];
    let updated = 0;
    let skipped = 0;
    let notFound = 0;
    let failed = 0;

    for (const target of batch) {
      try {
        const variant = await findVariantInventory(target.title, location.id);
        if (!variant) {
          results.push({ title: target.title, status: "not_found" });
          notFound++;
          continue;
        }

        if (variant.currentQuantity === target.quantity && variant.tracked) {
          results.push({ title: target.title, status: "ok", quantity: target.quantity });
          skipped++;
          continue;
        }

        if (!variant.tracked) await enableTracking(variant.inventoryItemId);
        await setAvailableQuantity(variant.inventoryItemId, location.id, target.quantity);

        results.push({ title: target.title, status: "updated", quantity: target.quantity });
        updated++;
      } catch (err) {
        if (err instanceof MissingInventoryScope) {
          return NextResponse.json({
            error: MISSING_INVENTORY_SCOPE,
            needsScopes: true,
            summary: { total: targets.length, updated, skipped, notFound, failed },
            results,
            hasMore: false,
            nextOffset: null,
          });
        }
        results.push({
          title: target.title,
          status: "error",
          error: err instanceof Error ? err.message : "Onbekende fout",
        });
        failed++;
      }
    }

    const nextOffset = offset + batch.length;
    const hasMore = nextOffset < targets.length;

    return NextResponse.json({
      location: location.name,
      summary: {
        total: targets.length,
        updated,
        skipped,
        notFound,
        failed,
        noStockInSheet: skippedNoStock.length,
        processed: nextOffset,
      },
      results,
      hasMore,
      nextOffset: hasMore ? nextOffset : null,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Voorraadsync mislukt";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
