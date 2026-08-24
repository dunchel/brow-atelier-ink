const domain = process.env.NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN!;
const adminToken = process.env.SHOPIFY_ADMIN_ACCESS_TOKEN!;

let lastCallAt = 0;
/** Shopify limiet: 2 calls/sec — max 1 call per seconde om veilig te blijven */
const MIN_INTERVAL_MS = 1100;

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

async function throttle() {
  const elapsed = Date.now() - lastCallAt;
  if (elapsed < MIN_INTERVAL_MS) {
    await sleep(MIN_INTERVAL_MS - elapsed);
  }
  lastCallAt = Date.now();
}

const RATE_LIMIT_PATTERN = /too many requests|throttled|rate limit|exceeded \d+ calls?/i;

/**
 * Alleen de foutvelden bekijken, nooit de hele respons. Zoeken op "429" in de
 * ruwe JSON leverde false positives op: dat rijtje cijfers zit ook gewoon in
 * Shopify-id's, waardoor een geslaagde call als rate limit werd geteld en het
 * product als mislukt uit de sync kwam. De echte 429 vangen we op de
 * HTTP-status af.
 */
export function isRateLimitError(data: unknown): boolean {
  if (!data) return false;
  if (typeof data === "string") return RATE_LIMIT_PATTERN.test(data);
  if (Array.isArray(data)) return RATE_LIMIT_PATTERN.test(JSON.stringify(data));

  const errors = (data as { errors?: unknown }).errors;
  if (errors === undefined) return false;
  return RATE_LIMIT_PATTERN.test(JSON.stringify(errors));
}

export function shopifyErrorMessage(data: unknown): string | null {
  if (!data || typeof data !== "object") return null;
  const d = data as Record<string, unknown>;
  if (typeof d.errors === "string") return d.errors;
  if (Array.isArray(d.errors)) return d.errors.join(", ");
  return null;
}

export async function shopifyRest(
  endpoint: string,
  method: "GET" | "POST" | "PUT" = "GET",
  body?: unknown,
  maxRetries = 5
): Promise<Record<string, unknown>> {
  let lastError: unknown = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    await throttle();

    const res = await fetch(`https://${domain}/admin/api/2024-01/${endpoint}`, {
      method,
      headers: {
        "Content-Type": "application/json",
        "X-Shopify-Access-Token": adminToken,
      },
      ...(body ? { body: JSON.stringify(body) } : {}),
    });

    let data: Record<string, unknown>;
    try {
      data = (await res.json()) as Record<string, unknown>;
    } catch {
      data = {};
    }

    if (res.status === 429 || isRateLimitError(data)) {
      lastError = shopifyErrorMessage(data) || "Rate limit";
      await sleep(2000 * (attempt + 1));
      continue;
    }

    return data;
  }

  throw new Error(
    typeof lastError === "string"
      ? lastError
      : "Shopify rate limit — wacht even en probeer opnieuw"
  );
}

/**
 * Admin GraphQL. Nodig voor alles wat de REST-API niet kan, zoals producten
 * publiceren naar een verkoopkanaal. Deelt de throttle met shopifyRest, want
 * Shopify telt beide tegen dezelfde limiet.
 */
export async function shopifyGraphql(
  query: string,
  variables?: Record<string, unknown>,
  maxRetries = 3
): Promise<{ data?: Record<string, unknown>; errors?: { message: string }[] }> {
  let lastError: string | null = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    await throttle();

    const res = await fetch(`https://${domain}/admin/api/2024-10/graphql.json`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Shopify-Access-Token": adminToken,
      },
      body: JSON.stringify({ query, variables }),
    });

    let json: { data?: Record<string, unknown>; errors?: { message: string }[] };
    try {
      json = await res.json();
    } catch {
      json = {};
    }

    if (res.status === 429 || isRateLimitError(json.errors)) {
      lastError = json.errors?.[0]?.message ?? "Rate limit";
      await sleep(2000 * (attempt + 1));
      continue;
    }

    return json;
  }

  throw new Error(lastError ?? "Shopify rate limit — wacht even en probeer opnieuw");
}
