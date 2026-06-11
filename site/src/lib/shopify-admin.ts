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

export function isRateLimitError(data: unknown): boolean {
  const text = JSON.stringify(data ?? "");
  return (
    text.includes("Exceeded") ||
    text.includes("429") ||
    text.includes("Too Many Requests") ||
    text.includes("rate limit")
  );
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
