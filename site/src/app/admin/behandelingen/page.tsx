"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface Treatment {
  naam: string;
  prijs: string;
  barcode: string;
  categorie: string;
  duur: string;
}

export default function BehandelingenAdminPage() {
  const [treatments, setTreatments] = useState<Treatment[]>([]);
  const [tab, setTab] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState("");
  const [msg, setMsg] = useState("");

  const load = () => {
    setLoading(true);
    setError("");
    fetch("/api/admin/treatments", { cache: "no-store" })
      .then((r) => r.json())
      .then((data) => {
        if (data.error) setError(data.error);
        else {
          setTreatments(data.treatments || []);
          setTab(data.tab || "Behandelingen");
          if (data.created) setMsg("Tab 'Behandelingen' aangemaakt in Google Sheet. Vul de prijzen in.");
        }
      })
      .catch(() => setError("Kan behandelingen niet laden"))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const setPrijs = (barcode: string, prijs: string) => {
    setTreatments((prev) =>
      prev.map((t) => (t.barcode === barcode ? { ...t, prijs } : t))
    );
  };

  const save = async () => {
    setSaving(true);
    setError("");
    setMsg("");
    try {
      const res = await fetch("/api/admin/treatments", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          updates: treatments.map((t) => ({ barcode: t.barcode, prijs: t.prijs })),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Opslaan mislukt");
      setTreatments(data.treatments);
      setMsg("Prijzen opgeslagen in Google Sheet.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Opslaan mislukt");
    } finally {
      setSaving(false);
    }
  };

  const syncShopify = async () => {
    setSyncing(true);
    setError("");
    setMsg("");
    try {
      const res = await fetch("/api/admin/sync-treatments", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Sync mislukt");
      const s = data.summary;
      setMsg(
        `Shopify: ${s.created} nieuw, ${s.updated} bijgewerkt, ${s.failed} fout. Daarna scanbaar in POS.`
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sync mislukt");
    } finally {
      setSyncing(false);
    }
  };

  const missingPrices = treatments.filter((t) => !parseFloat((t.prijs || "").replace(",", "."))).length;

  return (
    <div className="min-h-screen bg-brand-light pt-32 pb-20 px-6">
      <div className="max-w-2xl mx-auto">
        <Link
          href="/admin"
          className="text-xs text-brand-taupe hover:text-brand-gold transition-colors uppercase tracking-widest"
        >
          &larr; Admin
        </Link>
        <h1 className="font-heading text-3xl mt-2 mb-2">Behandelingen &amp; tarieven</h1>
        <p className="text-brand-taupe text-sm mb-6">
          Zet de salonprijzen hier (of in Google Sheet-tab <strong>{tab || "Behandelingen"}</strong>).
          Daarna sync naar Shopify zodat je behandeling + sieraad in één keer kunt pinnen.
        </p>

        {loading && <p className="text-brand-taupe">Laden...</p>}
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
            {error}
          </div>
        )}
        {msg && (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-800">
            {msg}
          </div>
        )}

        {!loading && (
          <>
            <div className="bg-white rounded-lg border border-brand-cream overflow-hidden mb-4">
              {treatments.map((t) => (
                <div
                  key={t.barcode}
                  className="flex items-center gap-3 p-3 border-b border-brand-cream last:border-b-0"
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm">{t.naam}</p>
                    <p className="text-xs text-brand-taupe">
                      {t.categorie}
                      {t.duur ? ` · ${t.duur}` : ""} · {t.barcode}
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-sm text-brand-taupe">€</span>
                    <input
                      type="text"
                      inputMode="decimal"
                      value={t.prijs}
                      onChange={(e) => setPrijs(t.barcode, e.target.value)}
                      placeholder="0,00"
                      className="w-20 px-2 py-1.5 text-sm bg-brand-light border border-brand-cream rounded focus:outline-none focus:border-brand-gold text-right"
                    />
                  </div>
                </div>
              ))}
            </div>

            {missingPrices > 0 && (
              <p className="text-xs text-orange-600 mb-4">
                {missingPrices} behandeling{missingPrices !== 1 ? "en" : ""} zonder prijs —
                die kun je nog niet aantikken op de telefoon.
              </p>
            )}

            <div className="flex flex-wrap gap-2">
              <button onClick={save} disabled={saving} className="btn-primary text-sm disabled:opacity-40">
                {saving ? "Opslaan..." : "Prijzen opslaan"}
              </button>
              <button
                onClick={syncShopify}
                disabled={syncing || missingPrices === treatments.length}
                className="px-4 py-2 text-sm rounded border border-brand-cream bg-white hover:border-brand-gold disabled:opacity-40"
              >
                {syncing ? "Shopify..." : "Sync naar Shopify POS"}
              </button>
              <Link
                href="/shop/code"
                className="px-4 py-2 text-sm rounded border border-brand-cream bg-white hover:border-brand-gold"
              >
                Open telefoonkassa
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
