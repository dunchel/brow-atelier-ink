const domain = process.env.NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN!;
const adminToken = process.env.SHOPIFY_ADMIN_ACCESS_TOKEN!;

const ADMIN_URL = `https://${domain}/admin/api/2024-01/graphql.json`;

export async function adminFetch(query: string, variables?: Record<string, unknown>) {
  if (!adminToken) {
    throw new Error("SHOPIFY_ADMIN_ACCESS_TOKEN is niet geconfigureerd");
  }

  const res = await fetch(ADMIN_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Shopify-Access-Token": adminToken,
    },
    body: JSON.stringify({ query, variables }),
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error(`Shopify Admin API fout: ${res.status}`);
  }

  const json = await res.json();

  if (json.errors) {
    const msg = json.errors[0]?.message ?? "Onbekende fout";
    if (msg.includes("Access denied")) {
      throw new Error("Geen toegang. Voeg de benodigde scopes toe aan je Headless channel in Shopify Admin.");
    }
    throw new Error(msg);
  }

  return json;
}
