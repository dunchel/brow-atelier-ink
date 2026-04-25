import { NextRequest, NextResponse } from "next/server";
import { getAllProducts } from "@/lib/products";

const domain = process.env.NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN!;
const adminToken = process.env.SHOPIFY_ADMIN_ACCESS_TOKEN!;

async function shopifyRest(endpoint: string, method = "GET", body?: unknown) {
  const res = await fetch(`https://${domain}/admin/api/2024-01/${endpoint}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      "X-Shopify-Access-Token": adminToken,
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  return res.json();
}

async function findProduct(title: string) {
  const data = await shopifyRest(`products.json?title=${encodeURIComponent(title)}&limit=1`);
  return data?.products?.[0] ?? null;
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
          inventory_management: null,
          inventory_policy: "continue",
        },
      ],
      images: imgSrcs,
    },
  });

  if (data?.errors) {
    throw new Error(JSON.stringify(data.errors));
  }

  return data?.product;
}

export async function POST(req: NextRequest) {
  try {
    const { offset = 0, batchSize = 5 } = await req.json().catch(() => ({ offset: 0, batchSize: 5 }));

    const allProducts = await getAllProducts();

    if (allProducts.length === 0) {
      return NextResponse.json({ error: "Geen producten gevonden in de Sheet" }, { status: 400 });
    }

    const batch = allProducts.slice(offset, offset + batchSize);
    const results: { title: string; status: string; error?: string }[] = [];
    let created = 0;
    let skipped = 0;
    let failed = 0;

    for (const product of batch) {
      try {
        const existing = await findProduct(product.title);
        if (existing) {
          results.push({ title: product.title, status: "exists" });
          skipped++;
          continue;
        }

        await createProduct(product);
        results.push({ title: product.title, status: "created" });
        created++;

        await new Promise((r) => setTimeout(r, 500));
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Onbekende fout";
        results.push({ title: product.title, status: "error", error: msg });
        failed++;
      }
    }

    const nextOffset = offset + batchSize;
    const hasMore = nextOffset < allProducts.length;

    return NextResponse.json({
      summary: { total: allProducts.length, created, skipped, failed, processed: offset + batch.length },
      results,
      hasMore,
      nextOffset: hasMore ? nextOffset : null,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Sync mislukt";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
