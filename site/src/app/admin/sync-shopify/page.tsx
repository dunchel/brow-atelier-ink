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
  const [results, setResults] = useState<SyncResult[] | null>(null);
  const [summary, setSummary] = useState<{ total: number; created: number; skipped: number; failed: number } | null>(null);
  const [error, setError] = useState<string | null>(null);

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
          body: JSON.stringify({ offset, batchSize: 5 }),
        });
        const data = await res.json();

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
      }
    } catch {
      setError("Sync mislukt. Probeer opnieuw.");
    } finally {
      setRunning(false);
    }
  };

  return (
    <div className="min-h-screen bg-brand-light pt-32 pb-20 px-6">
      <div className="max-w-2xl mx-auto">
        <Link href="/admin" className="text-xs text-brand-taupe hover:text-brand-gold transition-colors uppercase tracking-widest">
          &larr; Admin
        </Link>
        <h1 className="font-heading text-3xl mt-2 mb-2">Sync naar Shopify</h1>
        <p className="text-brand-taupe mb-8">
          Synchroniseer alle producten uit je Google Sheet naar Shopify. Producten die al bestaan worden overgeslagen.
          Dit is nodig zodat de checkout en Instagram Shopping werken.
        </p>

        <button
          onClick={handleSync}
          disabled={running}
          className="btn-primary text-xs disabled:opacity-50"
        >
          {running ? "Bezig met synchroniseren..." : "Start sync naar Shopify"}
        </button>

        {error && (
          <div className="mt-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-700 text-sm">{error}</p>
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
                  r.status === "created" ? "bg-green-500" :
                  r.status === "exists" ? "bg-brand-taupe" :
                  "bg-red-500"
                }`} />
                <span className="flex-1 truncate">{r.title}</span>
                <span className="text-xs text-brand-taupe">
                  {r.status === "created" ? "Aangemaakt" :
                   r.status === "exists" ? "Bestaat al" :
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
