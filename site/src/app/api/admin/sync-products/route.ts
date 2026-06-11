import { NextRequest, NextResponse } from "next/server";
import { getAllProducts } from "@/lib/products";
import { getAllInventoryProducts } from "@/lib/sheet-inventory";
import { isRateLimitError, shopifyErrorMessage, shopifyRest } from "@/lib/shopify-admin";

interface ShopifyProductRow {
  id: number;
  title: string;
}

async function findProduct(title: string): Promise<ShopifyProductRow | null> {
  const data = await shopifyRest(
    `products.json?title=${encodeURIComponent(title)}&limit=5`
  );
  const products = (data?.products ?? []) as ShopifyProductRow[];
  const t = title.trim().toLowerCase();
  return products.find((p) => p.title.trim().toLowerCase() === t) ?? null;
}

async function createProduct(product: {
  title: string;
  description: string;
  price: string;
  compareAtPrice?: string;
  imageUrl: string;
  images: string[];
  tags: string[];
  category: string;
  barcode?: string;
}) {
  const price = product.price.replace(",", ".");
  const compareAtPrice = product.compareAtPrice?.replace(",", ".") || undefined;

  const imgSrcs = product.images.filter(Boolean).map((src) => ({ src }));
  if (imgSrcs.length === 0 && product.imageUrl) {
    imgSrcs.push({ src: product.imageUrl });
  }

  const data = await shopifyRest("products.json", "POST", {
    product: {
      title: product.title,
      body_html: product.description,
      product_type: product.category,
      tags: product.tags.join(", "),
      status: "active",
      variants: [
        {
          price,
          ...(compareAtPrice ? { compare_at_price: compareAtPrice } : {}),
          ...(product.barcode
            ? { barcode: product.barcode, sku: product.barcode }
            : {}),
          inventory_management: null,
          inventory_policy: "continue",
        },
      ],
      images: imgSrcs,
    },
  });

  const err = shopifyErrorMessage(data);
  if (err) throw new Error(err);

  return data?.product;
}

export async function POST(req: NextRequest) {
  try {
    const { offset = 0, batchSize = 1 } = await req.json().catch(() => ({
      offset: 0,
      batchSize: 1,
    }));

    const allProducts = await getAllProducts();
    const inventory = await getAllInventoryProducts();
    const barcodeByTitle = new Map(
      inventory.map((p) => [p.naam.trim().toLowerCase(), p.barcode])
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
        const existing = await findProduct(product.title);
        if (existing) {
          results.push({ title: product.title, status: "exists" });
          skipped++;
          continue;
        }

        await createProduct({
          ...product,
          barcode: barcodeByTitle.get(product.title.trim().toLowerCase()),
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
