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
 * we melden het. Koop nu valt terug op de Online Store; In winkelwagen
 * blijft op de site en toont een melding.
 */

import type { Publication } from "./publication-channels";
import {
  publicationKind,
  treatmentPublishChannels,
  treatmentUnpublishChannels,
} from "./publication-channels";
import { shopifyGraphql } from "./shopify-admin";

export type { Publication, PublicationKind } from "./publication-channels";
export { publicationKind, treatmentPublishChannels, treatmentUnpublishChannels };

/** Scope ontbreekt op het Admin-token; publiceren kan pas na aanpassen app. */
export const MISSING_PUBLICATION_SCOPE =
  "Het Admin-token heeft read_publications en write_publications nog niet, dus " +
  "producten komen niet in het verkoopkanaal van de site. De rechten staan al in " +
  "versie 3.0 van de app Website Admin; ze moeten alleen nog één keer goedgekeurd " +
  "worden. Open admin.shopify.com/store/brow-atelier-ink/apps, klik Website Admin " +
  "en bevestig de nieuwe rechten. Klik hier daarna Controleer rechten en pas dan " +
  "Zet op verkoopkanalen. Bestellen via de Shopify-winkelwagen blijft werken.";

export type PublishResult =
  | { status: "published"; channels: number; unpublished?: number }
  | { status: "skipped"; reason: string }
  | { status: "failed"; reason: string };

function productGid(productId: number | string): string {
  return typeof productId === "string" && productId.startsWith("gid://")
    ? productId
    : `gid://shopify/Product/${productId}`;
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
async function runPublicationMutation(
  mutation: "publishablePublish" | "publishableUnpublish",
  gid: string,
  publicationIds: string[]
): Promise<PublishResult | null> {
  if (publicationIds.length === 0) return null;

  const res = await shopifyGraphql(
    `mutation run($id: ID!, $input: [PublicationInput!]!) {
      ${mutation}(id: $id, input: $input) {
        userErrors { field message }
      }
    }`,
    { id: gid, input: publicationIds.map((publicationId) => ({ publicationId })) }
  );

  if (isMissingScope(res.errors)) {
    return { status: "skipped", reason: rememberScopeError() };
  }
  if (res.errors?.length) return { status: "failed", reason: res.errors[0].message };

  const payload = res.data?.[mutation] as { userErrors?: { message: string }[] } | undefined;
  const userErrors = payload?.userErrors ?? [];
  if (userErrors.length) return { status: "failed", reason: userErrors[0].message };

  return { status: "published", channels: publicationIds.length };
}

/**
 * Zet een product op alle verkoopkanalen. Al gepubliceerde kanalen negeert
 * Shopify, dus dit is veilig om nog eens over een bestaand product te draaien.
 * Alleen voor sieraden — behandelingen gaan via publishTreatmentProduct.
 */
export async function publishProduct(productId: number | string): Promise<PublishResult> {
  const gid = productGid(productId);

  const { publications, error } = await getPublications();
  if (error) return { status: "skipped", reason: error };
  if (publications.length === 0) {
    return { status: "skipped", reason: "Geen verkoopkanalen gevonden in Shopify" };
  }

  const result = await runPublicationMutation(
    "publishablePublish",
    gid,
    publications.map((p) => p.id)
  );
  return result ?? { status: "skipped", reason: "Geen verkoopkanalen gevonden in Shopify" };
}

/**
 * Behandeling: zichtbaar in Shopify POS (en Headless voor de site).
 * Niet op Online Store, Shop-app, Facebook of TikTok.
 */
export async function publishTreatmentProduct(productId: number | string): Promise<PublishResult> {
  const gid = productGid(productId);
  const { publications, error } = await getPublications();
  if (error) return { status: "skipped", reason: error };

  const publish = treatmentPublishChannels(publications);
  const unpublish = treatmentUnpublishChannels(publications);
  const hasPos = publish.some((p) => publicationKind(p.name) === "pos");
  if (!hasPos) {
    return { status: "failed", reason: "Geen Point of Sale-kanaal gevonden in Shopify" };
  }

  const published = await runPublicationMutation(
    "publishablePublish",
    gid,
    publish.map((p) => p.id)
  );
  if (published && published.status !== "published") return published;

  const unpublished = await runPublicationMutation(
    "publishableUnpublish",
    gid,
    unpublish.map((p) => p.id)
  );
  if (unpublished && unpublished.status !== "published") return unpublished;

  return {
    status: "published",
    channels: publish.length,
    unpublished: unpublish.length,
  };
}

/** Alleen voor tests: de onthouden scope-fout en kanalen weer vergeten. */
export function resetPublicationCache() {
  publicationCache = null;
  scopeError = null;
}
