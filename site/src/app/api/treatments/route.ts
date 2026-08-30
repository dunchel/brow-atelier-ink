import { NextResponse } from "next/server";
import { getTreatments } from "@/lib/treatments";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const treatments = await getTreatments();
    return NextResponse.json(
      { treatments },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Kan behandelingen niet laden";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
