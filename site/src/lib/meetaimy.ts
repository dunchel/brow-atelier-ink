/** Publieke boekingswidget van Aimy — dezelfde data als op /afspraak. */

const AIMY_API = "https://api-v2-app.meetaimy.com";
const SALON_ID = "4316505";
const WIDGET_LOGIN = {
  id: "NDMxNjUwNQ==",
  email: "YW50aWxib3JnbGluZGFAZ21haWwuY29t",
};

const BROWSER_HEADERS = {
  Accept: "application/json",
  "Content-Type": "application/json",
  Origin: "https://widget2.meetaimy.com",
  Referer: "https://widget2.meetaimy.com/",
  "User-Agent":
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
};

export interface AimyService {
  aimyId: number;
  naam: string;
  categorie: string;
  prijs: number;
  prijsVan: number | null;
  prijsTot: number | null;
  duurMin: number;
  duurVan: number | null;
  duurTot: number | null;
}

interface AimyCategory {
  categoryName: string;
  services?: {
    serviceId: number;
    name: string;
    price?: number;
    duration?: number;
    priceRange?: { from?: number; to?: number };
    durationRange?: { from?: number; to?: number };
  }[];
}

async function widgetToken(): Promise<string> {
  const res = await fetch(`${AIMY_API}/api/v1/auth/login/widget`, {
    method: "POST",
    headers: BROWSER_HEADERS,
    body: JSON.stringify(WIDGET_LOGIN),
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error(`Aimy widget-login mislukt (${res.status})`);
  }
  const data = (await res.json()) as { token?: string };
  if (!data.token) throw new Error("Aimy gaf geen token");
  return data.token;
}

export function formatAimyPrice(n: number): string {
  return n.toFixed(2).replace(".", ",");
}

export function formatAimyDuration(
  mins: number,
  from?: number | null,
  to?: number | null
): string {
  if (from && to && from !== to) return `${from}–${to} min`;
  return `${mins} min`;
}

export function aimyBarcode(aimyId: number): string {
  return `BA-BHL-${aimyId}`;
}

export async function fetchAimyServices(): Promise<AimyService[]> {
  const token = await widgetToken();
  const res = await fetch(
    `${AIMY_API}/api/v1/user/${SALON_ID}/widget/services?userId=${SALON_ID}`,
    {
      headers: {
        ...BROWSER_HEADERS,
        Authorization: `Bearer ${token}`,
      },
      cache: "no-store",
    }
  );
  if (!res.ok) {
    throw new Error(`Aimy diensten ophalen mislukt (${res.status})`);
  }
  const cats = (await res.json()) as AimyCategory[];
  const items: AimyService[] = [];
  for (const cat of cats) {
    for (const s of cat.services || []) {
      const prijs = Number(s.price ?? 0);
      items.push({
        aimyId: s.serviceId,
        naam: (s.name || "").trim(),
        categorie: cat.categoryName,
        prijs,
        prijsVan: s.priceRange?.from ?? null,
        prijsTot: s.priceRange?.to ?? null,
        duurMin: Number(s.duration ?? 0),
        duurVan: s.durationRange?.from ?? null,
        duurTot: s.durationRange?.to ?? null,
      });
    }
  }
  return items.filter((s) => s.naam);
}
