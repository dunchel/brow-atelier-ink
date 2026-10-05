import { NextResponse } from "next/server";
import { revalidatePath, revalidateTag } from "next/cache";
import { getAllProducts } from "@/lib/products";

export async function POST() {
  try {
    const products = await getAllProducts({ fresh: true });
    revalidateTag("products");
    revalidateTag("sheet-snapshot");
    revalidatePath("/shop");
    revalidatePath("/");
    revalidatePath("/shop/[handle]", "page");
    return NextResponse.json({
      ok: true,
      count: products.length,
      available: products.filter((p) => p.available).length,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Catalogus verversen mislukt";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
