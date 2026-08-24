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
        <div className="text-xs text-brand-taupe mb-6 bg-white border border-brand-cream rounded-lg p-4 space-y-2">
          <p className="font-medium text-brand-dark">Winkelwagen: eenmalig in Shopify</p>
          <ol className="list-decimal list-inside space-y-1">
            <li>
              Open{" "}
              <a
                href="https://admin.shopify.com/store/brow-atelier-ink/settings/apps/development"
                target="_blank"
                rel="noopener noreferrer"
                className="text-brand-gold underline"
              >
                Shopify Admin → Apps → App-ontwikkeling
              </a>
            </li>
            <li>
              Klik op de app <strong>Website Admin</strong> → Configuratie →
              Admin API-integratie → Bewerken
            </li>
            <li>
              Vink aan: <strong>read_publications</strong> en{" "}
              <strong>write_publications</strong>. Opslaan.
            </li>
            <li>
              Ga naar API-gegevens en klik op <strong>App installeren</strong>{" "}
              (of opnieuw installeren).
            </li>
            <li>
              Komt er een nieuwe Admin API-token? Zet die in Vercel als{" "}
              <code>SHOPIFY_ADMIN_ACCESS_TOKEN</code> en deploy opnieuw.
            </li>
            <li>
              Kom hier terug en klik op <strong>Zet op verkoopkanalen</strong>.
            </li>
          </ol>
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
