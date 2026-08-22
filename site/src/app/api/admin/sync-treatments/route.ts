import { NextResponse } from "next/server";
import { getTreatments } from "@/lib/treatments";
import { shopifyErrorMessage, shopifyRest } from "@/lib/shopify-admin";
import { adminFetch } from "@/lib/admin";

interface ShopifyProductRow {
  id: number;
  title: string;
  variants?: { id: number; barcode?: string }[];
}

async function findExisting(
  title: string,
  barcode: string
): Promise<ShopifyProductRow | null> {
  try {
    const { data } = await adminFetch(
      `query ($q: String!) {
        productVariants(first: 1, query: $q) {
          edges { node { id legacyResourceId product { title } } }
        }
      }`,
      { q: `barcode:${barcode}` }
    );
    const node = data?.productVariants?.edges?.[0]?.node;
    if (node?.legacyResourceId) {
      return {
        id: 0,
        title: node.product?.title || title,
        variants: [{ id: Number(node.legacyResourceId), barcode }],
      };
    }
  } catch {
    /* fallback op titel */
  }

  const rest = await shopifyRest(
    `products.json?title=${encodeURIComponent(title)}&limit=5`
  );
  const products = (rest?.products ?? []) as ShopifyProductRow[];
  const t = title.trim().toLowerCase();
  return products.find((p) => p.title.trim().toLowerCase() === t) ?? null;
}

export async function POST() {
  try {
    const treatments = await getTreatments();
    const withPrice = treatments.filter((t) => parseFloat(t.prijs.replace(",", ".")) > 0);
    if (withPrice.length === 0) {
      return NextResponse.json(
        { error: "Vul eerst prijzen in bij Behandelingen" },
        { status: 400 }
      );
    }

    const results: { title: string; status: string; error?: string }[] = [];
    let created = 0;
    let updated = 0;
    let skipped = 0;
    let failed = 0;

    for (const t of withPrice) {
      const price = t.prijs.replace(",", ".");
      try {
        const existing = await findExisting(t.naam, t.barcode);

        if (existing) {
          const variantId = existing.variants?.[0]?.id;
          if (variantId) {
            await shopifyRest(`variants/${variantId}.json`, "PUT", {
              variant: {
                id: variantId,
                price,
                barcode: t.barcode,
                sku: t.barcode,
                inventory_management: null,
                inventory_policy: "continue",
              },
            });
          }
          results.push({ title: t.naam, status: "updated" });
          updated++;
          continue;
        }

        const data = await shopifyRest("products.json", "POST", {
          product: {
            title: t.naam,
            body_html: `<p>${t.naam} — behandeling bij Brow Atelier &amp; Ink.</p>`,
            product_type: "Behandeling",
            tags: `behandeling, ${t.categorie}`,
            status: "active",
            published: false,
            variants: [
              {
                price,
                barcode: t.barcode,
                sku: t.barcode,
                inventory_management: null,
                inventory_policy: "continue",
              },
            ],
          },
        });
        const err = shopifyErrorMessage(data);
        if (err) throw new Error(err);
        results.push({ title: t.naam, status: "created" });
        created++;
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Onbekende fout";
        results.push({ title: t.naam, status: "error", error: msg });
        failed++;
        skipped++;
      }
    }

    return NextResponse.json({
      summary: { created, updated, failed, processed: withPrice.length, skipped },
      results,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Sync mislukt";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
