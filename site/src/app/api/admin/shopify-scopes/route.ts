import { NextResponse } from "next/server";
import { shopifyGraphql } from "@/lib/shopify-admin";
import { resetPublicationCache } from "@/lib/shopify-publish";

export const dynamic = "force-dynamic";

const REQUIRED_FOR_PUBLISHING = ["read_publications", "write_publications"];

/**
 * Welke rechten heeft het Admin-token dat deze site gebruikt? Shopify vult
 * afgeleide leesrechten zelf aan, dus `write_publications` levert ook
 * `read_publications` op.
 */
export async function GET() {
  try {
    const res = await shopifyGraphql(`{
      currentAppInstallation {
        app { title }
        accessScopes { handle }
      }
    }`);

    if (res.errors?.length) {
      return NextResponse.json({
        ok: false,
        error: `Shopify antwoordde: ${res.errors[0].message}. Klopt SHOPIFY_ADMIN_ACCESS_TOKEN nog?`,
      });
    }

    const installation = res.data?.currentAppInstallation as
      | { app?: { title?: string }; accessScopes?: { handle: string }[] }
      | undefined;

    if (!installation) {
      return NextResponse.json({
        ok: false,
        error: "Shopify gaf geen app-installatie terug. Waarschijnlijk is het Admin-token verlopen of ingetrokken.",
      });
    }

    const scopes = (installation.accessScopes ?? []).map((s) => s.handle).sort();
    const missing = REQUIRED_FOR_PUBLISHING.filter((scope) => !scopes.includes(scope));

    // Een eerdere mislukte poging wordt in het geheugen onthouden. Zijn de
    // rechten er nu wel, dan moet die herinnering weg, anders blijft
    // publiceren overgeslagen worden tot de server herstart.
    if (missing.length === 0) resetPublicationCache();

    return NextResponse.json({
      ok: true,
      app: installation.app?.title ?? null,
      scopes,
      missing,
      canPublish: missing.length === 0,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Rechten opvragen mislukt";
    return NextResponse.json({ ok: false, error: message });
  }
}
