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
  "Het Shopify Admin-token mist de scope write_publications, dus nieuwe producten " +
  "komen niet in het verkoopkanaal van de site. Voeg read_publications en " +
  "write_publications toe aan de custom app en installeer hem opnieuw.";

export type PublishResult =
  | { status: "published"; channels: number }
  | { status: "skipped"; reason: string }
  | { status: "failed"; reason: string };

interface Publication {
  id: string;
  name: string;
}

let publicationCache: { ids: Publication[]; timestamp: number } | null = null;
let scopeError: string | null = null;
const PUBLICATION_CACHE_TTL = 10 * 60_000;

function isMissingScope(errors?: { message: string }[]): boolean {
  return (errors ?? []).some((e) => /access denied|write_publications|read_publications/i.test(e.message));
}

/**
 * De verkoopkanalen waar deze app producten op mag zetten. Leeg zolang de
 * scope ontbreekt; dat wordt onthouden zodat elke sync-batch niet opnieuw een
 * kansloze call doet.
 */
export async function getPublications(): Promise<{ publications: Publication[]; error: string | null }> {
  if (scopeError) return { publications: [], error: scopeError };

  if (publicationCache && Date.now() - publicationCache.timestamp < PUBLICATION_CACHE_TTL) {
    return { publications: publicationCache.ids, error: null };
  }

  const res = await shopifyGraphql(`{
    publications(first: 25) {
      edges { node { id name } }
    }
  }`);

  if (isMissingScope(res.errors)) {
    scopeError = MISSING_PUBLICATION_SCOPE;
    return { publications: [], error: scopeError };
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
    scopeError = MISSING_PUBLICATION_SCOPE;
    return { status: "skipped", reason: scopeError };
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
