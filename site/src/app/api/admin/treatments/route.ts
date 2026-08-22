import { NextRequest, NextResponse } from "next/server";
import {
  ensureTreatmentsSheet,
  getTreatments,
  syncTreatmentsFromAimy,
  updateTreatmentPrices,
} from "@/lib/treatments";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const ensured = await ensureTreatmentsSheet();
    return NextResponse.json({
      treatments: ensured.treatments,
      tab: ensured.tab,
      created: ensured.created,
      imported: ensured.imported,
      aimyError: ensured.aimyError,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Kan behandelingen niet laden";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const overwrite = body?.overwrite !== false;
    const synced = await syncTreatmentsFromAimy({ overwritePrices: overwrite });
    return NextResponse.json({
      treatments: synced.treatments,
      tab: synced.tab,
      imported: synced.imported,
      source: synced.source,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Aimy-import mislukt";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const updates = Array.isArray(body?.updates) ? body.updates : [];
    if (updates.length === 0) {
      return NextResponse.json({ treatments: await getTreatments() });
    }
    const treatments = await updateTreatmentPrices(updates);
    return NextResponse.json({ treatments });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Opslaan mislukt";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
