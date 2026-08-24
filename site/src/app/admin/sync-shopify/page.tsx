"use client";

import { useState } from "react";
import Link from "next/link";

interface SyncResult {
  title: string;
  status: string;
  error?: string;
}

export default function SyncShopifyPage() {
  const [running, setRunning] = useState(false);
  const [syncingBarcodes, setSyncingBarcodes] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [results, setResults] = useState<SyncResult[] | null>(null);
  const [summary, setSummary] = useState<{ total: number; created: number; skipped: number; failed: number } | null>(null);
  const [barcodeSummary, setBarcodeSummary] = useState<{
    total: number;
    updated: number;
    skipped: number;
    notFound: number;
    failed: number;
  } | null>(null);
  const [publishSummary, setPublishSummary] = useState<{
    published: number;
    skipped: number;
    failed: number;
  } | null>(null);
  const [catalogCount, setCatalogCount] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const busy = running || syncingBarcodes || publishing || refreshing;

  const handleSync = async () => {
    setRunning(true);
    setError(null);
    setResults([]);
    setSummary(null);

    let offset = 0;
    const allResults: SyncResult[] = [];
    let totalCreated = 0;
    let totalSkipped = 0;
    let totalFailed = 0;
    let total = 0;

    try {
      while (true) {
        const res = await fetch("/api/admin/sync-products", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ offset, batchSize: 1 }),
        });
        const data = await res.json();

        if (data.publishWarning) setError(data.publishWarning);
        if (data.error) {
          setError(data.error);
          break;
        }

        total = data.summary.total;
        totalCreated += data.summary.created;
        totalSkipped += data.summary.skipped;
        totalFailed += data.summary.failed;
        allResults.push(...data.results);

        setResults([...allResults]);
        setSummary({ total, created: totalCreated, skipped: totalSkipped, failed: totalFailed });

        if (!data.hasMore) break;
        offset = data.nextOffset;
        await new Promise((r) => setTimeout(r, 1500));
      }
    } catch {
      setError("Sync mislukt. Probeer opnieuw.");
    } finally {
      setRunning(false);
    }
  };

  const handleSyncBarcodes = async () => {
    setSyncingBarcodes(true);
    setError(null);
    setResults([]);
    setBarcodeSummary(null);

    let offset = 0;
    const allResults: SyncResult[] = [];
    let totalUpdated = 0;
    let totalSkipped = 0;
    let totalNotFound = 0;
    let totalFailed = 0;
    let total = 0;

    try {
      while (true) {
        const res = await fetch("/api/admin/sync-barcodes", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ offset, batchSize: 1 }),
        });
        const data = await res.json();

        if (data.error) {
          setError(data.error);
          break;
        }

        total = data.summary.total;
        totalUpdated += data.summary.updated;
        totalSkipped += data.summary.skipped;
        totalNotFound += data.summary.notFound;
        totalFailed += data.summary.failed;
        allResults.push(
          ...data.results.map(
            (r: { title: string; status: string; error?: string; barcode: string }) => ({
              title: `${r.title} (${r.barcode})`,
              status: r.status,
              error: r.error,
            })
          )
        );

        setResults([...allResults]);
        setBarcodeSummary({
          total,
          updated: totalUpdated,
          skipped: totalSkipped,
          notFound: totalNotFound,
          failed: totalFailed,
        });

        if (!data.hasMore) break;
        offset = data.nextOffset;
        await new Promise((r) => setTimeout(r, 1500));
      }
    } catch {
      setError("Barcode sync mislukt. Probeer opnieuw.");
    } finally {
      setSyncingBarcodes(false);
    }
  };

  const handleRefreshCatalog = async () => {
    setRefreshing(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/refresh-catalog", { method: "POST" });
      const data = await res.json();
      if (data.error) {
        setError(data.error);
        return;
      }
      setCatalogCount(data.count ?? 0);
    } catch {
      setError("Catalogus verversen mislukt.");
    } finally {
      setRefreshing(false);
    }
  };

  const handlePublish = async () => {
    setPublishing(true);
    setError(null);
    setResults([]);
    setPublishSummary(null);

    let sinceId = 0;
    const allResults: SyncResult[] = [];
    let totalPublished = 0;
    let totalSkipped = 0;
    let totalFailed = 0;

    try {
      while (true) {
        const res = await fetch("/api/admin/sync-publications", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sinceId, batchSize: 1 }),
        });
        const data = await res.json();

        if (data.error) {
          setError(data.error);
          if (data.results?.length) {
            allResults.push(...data.results);
            setResults([...allResults]);
          }
          break;
        }

        totalPublished += data.summary.published;
        totalSkipped += data.summary.skipped;
        totalFailed += data.summary.failed;
        allResults.push(...data.results);
        setResults([...allResults]);
        setPublishSummary({
          published: totalPublished,
          skipped: totalSkipped,
          failed: totalFailed,
        });

        if (!data.hasMore) break;
        sinceId = data.nextSinceId;
        await new Promise((r) => setTimeout(r, 1500));
      }
    } catch {
      setError("Publiceren mislukt. Probeer opnieuw.");
    } finally {
      setPublishing(false);
    }
  };

  return (
    <div className="min-h-screen bg-brand-light pt-32 pb-20 px-6">
      <div className="max-w-2xl mx-auto">
        <Link href="/admin" className="text-xs text-brand-taupe hover:text-brand-gold transition-colors uppercase tracking-widest">
          &larr; Admin
        </Link>
        <h1 className="font-heading text-3xl mt-2 mb-2">Sync naar Shopify</h1>
        <p className="text-brand-taupe mb-4">
          Nieuwe rijen in de Google Sheet staan automatisch op de website
          (binnen ongeveer een minuut). Shopify-sync is alleen nodig voor
          afrekenen, winkelwagen en de kassa.
        </p>
        <p className="text-xs text-brand-taupe mb-4 bg-brand-cream/60 rounded-lg p-3">
          <strong>&quot;Bestaat al&quot;</strong> = goed, staat al in Shopify.{" "}
          <strong>Rate limit</strong> = even wachten (1 min) en opnieuw syncen —
          alleen mislukte producten worden opnieuw geprobeerd als je sync opnieuw
          start (bestaande worden overgeslagen).
        </p>
        <div className="text-xs text-brand-taupe mb-6 bg-white border border-brand-cream rounded-lg p-4 space-y-3">
          <p className="font-medium text-brand-dark">
            Verkoopkanalen: plak deze link (niet via Apps in het linkermenu)
          </p>
          <p>
            Shopify heeft het oude pad “Apps → App-ontwikkeling → Configuratie”
            verplaatst. Dat tabblad staat niet op de gewone app-pagina, niet bij
            POS en niet in de App Store.
          </p>
          <ol className="list-decimal list-inside space-y-1.5">
            <li>
              Plak in de adresbalk:{" "}
              <a
                href="https://admin.shopify.com/store/brow-atelier-ink/settings/apps"
                target="_blank"
                rel="noopener noreferrer"
                className="text-brand-gold underline break-all"
              >
                admin.shopify.com/store/brow-atelier-ink/settings/apps
              </a>
            </li>
            <li>
              Je ziet “Apps” of “Apps en verkoopkanalen”, met geïnstalleerde
              apps. Klik bovenin op <strong>App-ontwikkeling</strong> /{" "}
              <strong>Develop apps</strong>. Direct:{" "}
              <a
                href="https://admin.shopify.com/store/brow-atelier-ink/settings/apps/development"
                target="_blank"
                rel="noopener noreferrer"
                className="text-brand-gold underline"
              >
                …/settings/apps/development
              </a>
            </li>
            <li>
              Staat die knop er niet? Klik eerst{" "}
              <strong>App-ontwikkeling toestaan</strong> /{" "}
              <strong>Allow custom app development</strong> (winkeleigenaar).
              Bevestig de waarschuwing.
            </li>
            <li>
              Open de app <strong>Website Admin</strong>. Niet Point of Sale,
              niet Online Store / thema, niet een app uit de App Store.
            </li>
            <li>
              <strong>Pad A (2026):</strong> knop{" "}
              <strong>Apps in Dev Dashboard bouwen</strong> /{" "}
              <strong>Build apps in Dev Dashboard</strong> → Website Admin →
              tab <strong>Versions</strong> → Access / Select scopes → zoek{" "}
              <strong>publications</strong> → vink{" "}
              <strong>read_publications</strong> en{" "}
              <strong>write_publications</strong> → <strong>Release</strong>.
              Daarna in de winkel de nieuwe rechten goedkeuren als Shopify dat
              vraagt. Dev Dashboard ook via{" "}
              <a
                href="https://dev.shopify.com/dashboard"
                target="_blank"
                rel="noopener noreferrer"
                className="text-brand-gold underline"
              >
                dev.shopify.com/dashboard
              </a>
              .
            </li>
            <li>
              <strong>Pad B (oude app):</strong> kopje “Verouderde aangepaste
              apps” / Legacy custom apps → Website Admin →{" "}
              <strong>Configuratie</strong> → Admin API-integratie → Bewerken
              → dezelfde twee vinkjes → Opslaan → API-gegevens → App
              (opnieuw) installeren. De app zelf niet verwijderen.
            </li>
            <li>
              Kom hier terug en klik <strong>Zet op verkoopkanalen</strong>.
            </li>
          </ol>
          <p>
            Zie je alleen een rode knop Verwijderen en een lijst rechten, zonder
            Configuratie? Dan ben je op de geïnstalleerde app — dat is de
            verkeerde plek. Gebruik pad A of B.
          </p>
          <p>
            Krijgt Shopify een nieuwe Admin API-token? Niet in de chat plakken;
            die hoort in Vercel als <code>SHOPIFY_ADMIN_ACCESS_TOKEN</code>.
          </p>
        </div>
        <div className="text-xs text-brand-taupe mb-6 bg-white border border-brand-cream rounded-lg p-4 space-y-2">
          <p className="font-medium text-brand-dark">Welke knop</p>
          <ul className="list-disc list-inside space-y-1">
            <li>
              <strong>Ververs website-catalogus</strong> — leest de Sheet
              opnieuw. Raakt Shopify niet.
            </li>
            <li>
              <strong>Producten syncen</strong> — zet nieuwe Sheet-rijen in
              Shopify. Bestaande titels slaat hij over. Wis niets.
            </li>
            <li>
              <strong>Barcodes naar Shopify</strong> — vult barcodes op
              bestaande producten.
            </li>
            <li>
              <strong>Zet op verkoopkanalen</strong> — maakt producten zichtbaar
              voor de site-cart. Faalt dit op publications-rechten: bestellen
              via de Shopify-winkelwagen blijft werken.
            </li>
          </ul>
          <p>
            Oude Shopify-producten die niet in de Sheet staan: niet massaal
            verwijderen. Ze staan niet op de website.
          </p>
        </div>

        <div className="flex flex-wrap gap-3 mb-8">
          <button
            onClick={handleRefreshCatalog}
            disabled={busy}
            className="px-4 py-2 text-xs rounded border border-brand-cream bg-white hover:border-brand-gold disabled:opacity-50"
          >
            {refreshing ? "Website verversen..." : "Ververs website-catalogus"}
          </button>
          <button
            onClick={handleSync}
            disabled={busy}
            className="btn-primary text-xs disabled:opacity-50"
          >
            {running ? "Bezig met synchroniseren..." : "Producten syncen"}
          </button>
          <button
            onClick={handleSyncBarcodes}
            disabled={busy}
            className="px-4 py-2 text-xs rounded border border-brand-cream bg-white hover:border-brand-gold disabled:opacity-50"
          >
            {syncingBarcodes ? "Barcodes syncen..." : "Barcodes naar Shopify"}
          </button>
          <button
            onClick={handlePublish}
            disabled={busy}
            className="px-4 py-2 text-xs rounded border border-brand-gold bg-white hover:bg-brand-gold/10 disabled:opacity-50"
          >
            {publishing ? "Kanalen zetten..." : "Zet op verkoopkanalen"}
          </button>
        </div>
        {catalogCount !== null && (
          <p className="text-sm text-brand-taupe mb-4">
            Website toont nu {catalogCount} producten uit de Sheet.
          </p>
        )}

        {error && (
          <div className="mt-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}

        {barcodeSummary && (
          <div className="mt-6 grid grid-cols-5 gap-3">
            <div className="bg-white rounded-lg border border-brand-cream p-4 text-center">
              <p className="font-heading text-2xl">{barcodeSummary.total}</p>
              <p className="text-xs text-brand-taupe">Totaal</p>
            </div>
            <div className="bg-white rounded-lg border border-green-200 p-4 text-center">
              <p className="font-heading text-2xl text-green-600">{barcodeSummary.updated}</p>
              <p className="text-xs text-brand-taupe">Bijgewerkt</p>
            </div>
            <div className="bg-white rounded-lg border border-brand-cream p-4 text-center">
              <p className="font-heading text-2xl">{barcodeSummary.skipped}</p>
              <p className="text-xs text-brand-taupe">Al goed</p>
            </div>
            <div className="bg-white rounded-lg border border-orange-200 p-4 text-center">
              <p className="font-heading text-2xl text-orange-600">{barcodeSummary.notFound}</p>
              <p className="text-xs text-brand-taupe">Niet in Shopify</p>
            </div>
            <div className="bg-white rounded-lg border border-red-200 p-4 text-center">
              <p className="font-heading text-2xl text-red-500">{barcodeSummary.failed}</p>
              <p className="text-xs text-brand-taupe">Mislukt</p>
            </div>
          </div>
        )}

        {publishSummary && (
          <div className="mt-6 grid grid-cols-3 gap-4">
            <div className="bg-white rounded-lg border border-green-200 p-4 text-center">
              <p className="font-heading text-2xl text-green-600">{publishSummary.published}</p>
              <p className="text-xs text-brand-taupe">Gepubliceerd</p>
            </div>
            <div className="bg-white rounded-lg border border-brand-cream p-4 text-center">
              <p className="font-heading text-2xl">{publishSummary.skipped}</p>
              <p className="text-xs text-brand-taupe">Overgeslagen</p>
            </div>
            <div className="bg-white rounded-lg border border-red-200 p-4 text-center">
              <p className="font-heading text-2xl text-red-500">{publishSummary.failed}</p>
              <p className="text-xs text-brand-taupe">Mislukt</p>
            </div>
          </div>
        )}

        {summary && (
          <div className="mt-6 grid grid-cols-4 gap-4">
            <div className="bg-white rounded-lg border border-brand-cream p-4 text-center">
              <p className="font-heading text-2xl">{summary.total}</p>
              <p className="text-xs text-brand-taupe">Totaal</p>
            </div>
            <div className="bg-white rounded-lg border border-green-200 p-4 text-center">
              <p className="font-heading text-2xl text-green-600">{summary.created}</p>
              <p className="text-xs text-brand-taupe">Aangemaakt</p>
            </div>
            <div className="bg-white rounded-lg border border-brand-cream p-4 text-center">
              <p className="font-heading text-2xl">{summary.skipped}</p>
              <p className="text-xs text-brand-taupe">Overgeslagen</p>
            </div>
            <div className="bg-white rounded-lg border border-red-200 p-4 text-center">
              <p className="font-heading text-2xl text-red-500">{summary.failed}</p>
              <p className="text-xs text-brand-taupe">Mislukt</p>
            </div>
          </div>
        )}

        {results && (
          <div className="mt-6 space-y-2">
            {results.map((r, i) => (
              <div key={i} className="flex items-center gap-3 text-sm py-2 border-b border-brand-cream">
                <span className={`w-2 h-2 rounded-full flex-shrink-0 ${
                  r.status === "created" || r.status === "updated" || r.status === "published" ? "bg-green-500" :
                  r.status === "exists" || r.status === "ok" || r.status === "skipped" ? "bg-brand-taupe" :
                  r.status === "not_found" ? "bg-orange-400" :
                  "bg-red-500"
                }`} />
                <span className="flex-1 truncate">{r.title}</span>
                <span className="text-xs text-brand-taupe">
                  {r.status === "created" ? "Aangemaakt" :
                   r.status === "exists" ? "Bestaat al" :
                   r.status === "updated" ? "Barcode gezet" :
                   r.status === "published" ? "Op kanaal" :
                   r.status === "skipped" ? "Overgeslagen" :
                   r.status === "ok" ? "Al goed" :
                   r.status === "not_found" ? "Niet in Shopify" :
                   r.error || "Mislukt"}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
