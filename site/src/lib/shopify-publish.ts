/**
 * Producten publiceren naar de verkoopkanalen van de shop.
 *
 * Een product dat via de Admin REST-API wordt aangemaakt staat wel in de
 * Shopify-admin en op de Online Store, maar hangt niet aan het verkoopkanaal
 * van het Storefront-token dat deze site gebruikt. De Storefront-API ziet zo'n
 * product dus niet: `cartCreate` antwoordt met "The merchandise with id ...
 * does not exist" en de klant krijgt "product niet gevonden". Publiceren kan
 * alleen via Admin GraphQL, en alleen met de scope `write_publications`.
 *
 * Heeft het token die scope niet, dan mag de sync daar niet op stukvallen:
 * we melden het en laten de checkout terugvallen op de Online Store (zie
 * `buildDirectCheckoutUrl` in cart.ts).
 */

import { shopifyGraphql } from "./shopify-admin";

/** Scope ontbreekt op het Admin-token; publiceren kan pas na aanpassen app. */
export const MISSING_PUBLICATION_SCOPE =
  "Het Admin-token heeft read_publications en write_publications nog niet, dus " +
  "producten komen niet in het verkoopkanaal van de site. De rechten staan al in " +
  "versie 3.0 van de app Website Admin; ze moeten alleen nog één keer goedgekeurd " +
  "worden. Open admin.shopify.com/store/brow-atelier-ink/apps, klik Website Admin " +
  "en bevestig de nieuwe rechten. Klik hier daarna Controleer rechten en pas dan " +
  "Zet op verkoopkanalen. Bestellen via de Shopify-winkelwagen blijft werken.";

export type PublishResult =
  | { status: "published"; channels: number }
  | { status: "skipped"; reason: string }
  | { status: "failed"; reason: string };

interface Publication {
  id: string;
  name: string;
}

let publicationCache: { ids: Publication[]; timestamp: number } | null = null;
let scopeError: { message: string; timestamp: number } | null = null;
const PUBLICATION_CACHE_TTL = 10 * 60_000;
/**
 * Kort, zodat een sync-run niet elke batch opnieuw een kansloze call doet,
 * maar publiceren wél vanzelf weer werkt zodra de rechten zijn goedgekeurd.
 */
const SCOPE_ERROR_TTL = 60_000;

function rememberScopeError(): string {
  scopeError = { message: MISSING_PUBLICATION_SCOPE, timestamp: Date.now() };
  return MISSING_PUBLICATION_SCOPE;
}

function recentScopeError(): string | null {
  if (!scopeError) return null;
  if (Date.now() - scopeError.timestamp >= SCOPE_ERROR_TTL) {
    scopeError = null;
    return null;
  }
  return scopeError.message;
}

function isMissingScope(errors?: { message: string }[]): boolean {
  return (errors ?? []).some((e) => /access denied|write_publications|read_publications/i.test(e.message));
}

/** De verkoopkanalen waar deze app producten op mag zetten. */
export async function getPublications(): Promise<{ publications: Publication[]; error: string | null }> {
  const remembered = recentScopeError();
  if (remembered) return { publications: [], error: remembered };

  if (publicationCache && Date.now() - publicationCache.timestamp < PUBLICATION_CACHE_TTL) {
    return { publications: publicationCache.ids, error: null };
  }

  const res = await shopifyGraphql(`{
    publications(first: 25) {
      edges { node { id name } }
    }
  }`);

  if (isMissingScope(res.errors)) {
    return { publications: [], error: rememberScopeError() };
  }

  if (res.errors?.length) {
    return { publications: [], error: res.errors[0].message };
  }

  const edges =
    ((res.data?.publications as { edges?: { node: Publication }[] } | undefined)?.edges ?? []);
  const publications = edges.map((e) => e.node);

  publicationCache = { ids: publications, timestamp: Date.now() };
  return { publications, error: null };
}

/**
 * Zet een product op alle verkoopkanalen. Al gepubliceerde kanalen negeert
 * Shopify, dus dit is veilig om nog eens over een bestaand product te draaien.
 */
export async function publishProduct(productId: number | string): Promise<PublishResult> {
  const gid =
    typeof productId === "string" && productId.startsWith("gid://")
      ? productId
      : `gid://shopify/Product/${productId}`;

  const { publications, error } = await getPublications();
  if (error) return { status: "skipped", reason: error };
  if (publications.length === 0) {
    return { status: "skipped", reason: "Geen verkoopkanalen gevonden in Shopify" };
  }

  const res = await shopifyGraphql(
    `mutation publish($id: ID!, $input: [PublicationInput!]!) {
      publishablePublish(id: $id, input: $input) {
        userErrors { field message }
      }
    }`,
    { id: gid, input: publications.map((p) => ({ publicationId: p.id })) }
  );

  if (isMissingScope(res.errors)) {
    return { status: "skipped", reason: rememberScopeError() };
  }

  if (res.errors?.length) return { status: "failed", reason: res.errors[0].message };

  const userErrors =
    ((res.data?.publishablePublish as { userErrors?: { message: string }[] } | undefined)?.userErrors ?? []);
  if (userErrors.length) return { status: "failed", reason: userErrors[0].message };

  return { status: "published", channels: publications.length };
}

/** Alleen voor tests: de onthouden scope-fout en kanalen weer vergeten. */
export function resetPublicationCache() {
  publicationCache = null;
  scopeError = null;
}
