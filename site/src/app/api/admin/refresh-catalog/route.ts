import { NextResponse } from "next/server";
import { revalidatePath, revalidateTag } from "next/cache";
import { getAllProducts, getPricelessRows } from "@/lib/products";

export async function POST() {
  try {
    const products = await getAllProducts({ fresh: true });
    revalidateTag("products");
    revalidateTag("sheet-snapshot");
    revalidatePath("/shop");
    revalidatePath("/");
    revalidatePath("/shop/[handle]", "page");
    const priceless = getPricelessRows();
    return NextResponse.json({
      ok: true,
      count: products.length,
      available: products.filter((p) => p.available).length,
      // Rijen met een naam maar zonder bedrag: die laten we uit de winkel, dus
      // ze horen zichtbaar te zijn in de admin in plaats van als EUR 0,00 online.
      pricelessCount: priceless.length,
      priceless: priceless.slice(0, 50),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Catalogus verversen mislukt";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
