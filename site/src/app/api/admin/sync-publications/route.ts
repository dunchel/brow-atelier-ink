import { NextRequest, NextResponse } from "next/server";
import { listShopifyProductsPage } from "@/lib/shopify-catalog";
import { getPublications, publishProduct } from "@/lib/shopify-publish";

export async function POST(req: NextRequest) {
  try {
    const { sinceId = 0, batchSize = 1 } = await req.json().catch(() => ({
      sinceId: 0,
      batchSize: 1,
    }));

    const { publications, error: scopeError } = await getPublications();
    if (scopeError) {
      return NextResponse.json({
        error: scopeError,
        needsScopes: true,
        summary: { published: 0, skipped: 0, failed: 0, processed: 0 },
        results: [],
        hasMore: false,
        nextSinceId: null,
      });
    }

    if (publications.length === 0) {
      return NextResponse.json({
        error: "Geen verkoopkanalen gevonden in Shopify",
        summary: { published: 0, skipped: 0, failed: 0, processed: 0 },
        results: [],
        hasMore: false,
        nextSinceId: null,
      });
    }

    const { products, nextSinceId } = await listShopifyProductsPage(sinceId, batchSize);
    const results: { title: string; status: string; error?: string }[] = [];
    let published = 0;
    let skipped = 0;
    let failed = 0;

    for (const product of products) {
      const result = await publishProduct(product.id);
      if (result.status === "published") {
        results.push({ title: product.title, status: "published" });
        published++;
      } else if (result.status === "skipped") {
        results.push({ title: product.title, status: "skipped", error: result.reason });
        skipped++;
        if (/write_publications|read_publications/i.test(result.reason)) {
          return NextResponse.json({
            error: result.reason,
            needsScopes: true,
            summary: { published, skipped, failed, processed: published + skipped + failed },
            results,
            hasMore: false,
            nextSinceId: null,
          });
        }
      } else {
        results.push({ title: product.title, status: "error", error: result.reason });
        failed++;
      }
    }

    return NextResponse.json({
      summary: {
        published,
        skipped,
        failed,
        processed: products.length,
      },
      results,
      hasMore: Boolean(nextSinceId && products.length >= batchSize),
      nextSinceId,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Publiceren mislukt";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
