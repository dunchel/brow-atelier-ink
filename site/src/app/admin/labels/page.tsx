"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { QRCodeSVG } from "qrcode.react";
import { renderToStaticMarkup } from "react-dom/server";
import { createElement } from "react";

interface LabelProduct {
  naam: string;
  prijs: string;
  barcode: string;
  categorie: string;
  voorraad: string;
}

export default function LabelsPage() {
  const [products, setProducts] = useState<LabelProduct[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("alle");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const printRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch("/api/admin/labels")
      .then((r) => r.json())
      .then((data) => {
        if (data.products) setProducts(data.products);
        else setError(data.error || "Onbekende fout");
      })
      .catch(() => setError("Kan geen verbinding maken"))
      .finally(() => setLoading(false));
  }, []);

  const categories = Array.from(new Set(products.map((p) => p.categorie)));

  const filtered = products.filter((p) => {
    const matchSearch =
      !search ||
      p.naam.toLowerCase().includes(search.toLowerCase()) ||
      p.barcode.toLowerCase().includes(search.toLowerCase());
    const matchCat = categoryFilter === "alle" || p.categorie === categoryFilter;
    return matchSearch && matchCat;
  });

  const toggleSelect = (barcode: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(barcode)) next.delete(barcode);
      else next.add(barcode);
      return next;
    });
  };

  const selectAll = () => {
    const allCodes = filtered.map((p) => p.barcode);
    setSelected((prev) => {
      const next = new Set(prev);
      const allSelected = allCodes.every((c) => next.has(c));
      if (allSelected) {
        allCodes.forEach((c) => next.delete(c));
      } else {
        allCodes.forEach((c) => next.add(c));
      }
      return next;
    });
  };

  const selectedProducts = products.filter((p) => selected.has(p.barcode));

  const renderQrSvg = useCallback((value: string) => {
    return renderToStaticMarkup(
      createElement(QRCodeSVG, { value, size: 64, level: "M" })
    );
  }, []);

  const escapeHtml = (s: string) =>
    s
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");

  const handlePrint = () => {
    if (selectedProducts.length === 0) return;

    const labelsHTML = selectedProducts
      .map(
        (p) => `
      <div class="label">
        <div class="qr-container">${renderQrSvg(p.barcode)}</div>
        <div class="info">
          <div class="naam">${escapeHtml(p.naam)}</div>
          <div class="prijs">&euro;${escapeHtml(p.prijs)}</div>
          <div class="code">${escapeHtml(p.barcode)}</div>
        </div>
      </div>`
      )
      .join("");

    const fullHtml = `<!DOCTYPE html>
<html>
<head>
  <title>Labels - Brow Atelier</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: Arial, Helvetica, sans-serif; }

    @media screen {
      body { padding: 20px; background: #f5f5f5; }
      .label {
        background: white;
        border: 1px dashed #ccc;
        margin-bottom: 10px;
      }
    }

    .label {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 6px 10px;
      width: 62mm;
      min-height: 29mm;
      page-break-inside: avoid;
      break-inside: avoid;
    }

    .qr-container { flex-shrink: 0; }
    .qr-container svg { display: block; }

    .info { flex: 1; min-width: 0; }
    .naam { font-size: 9px; font-weight: 700; line-height: 1.2; word-wrap: break-word; }
    .prijs { font-size: 10px; font-weight: 700; margin-top: 2px; }
    .code { font-size: 7px; color: #666; margin-top: 1px; }

    @media print {
      @page {
        size: 62mm auto;
        margin: 0;
      }
      body { padding: 0; }
      .label { margin: 0; border: none; }
    }
  </style>
</head>
<body>
  ${labelsHTML}
</body>
</html>`;

    const iframe = document.createElement("iframe");
    iframe.setAttribute("title", "Print labels");
    iframe.setAttribute("aria-hidden", "true");
    Object.assign(iframe.style, {
      position: "fixed",
      right: "0",
      bottom: "0",
      width: "0",
      height: "0",
      border: "0",
      opacity: "0",
      pointerEvents: "none",
    });
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow?.document;
    if (!doc) {
      document.body.removeChild(iframe);
      return;
    }

    doc.open();
    doc.write(fullHtml);
    doc.close();

    const w = iframe.contentWindow;
    if (!w) {
      document.body.removeChild(iframe);
      return;
    }

    const cleanup = () => {
      try {
        document.body.removeChild(iframe);
      } catch {
        /* already removed */
      }
    };

    const doPrint = () => {
      w.focus();
      w.print();
    };

    if (w.document.readyState === "complete") {
      window.setTimeout(doPrint, 0);
    } else {
      w.addEventListener("load", () => window.setTimeout(doPrint, 0), { once: true });
    }

    w.addEventListener("afterprint", cleanup, { once: true });
    window.setTimeout(cleanup, 120_000);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-brand-light pt-32 px-6 pb-20">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-brand-taupe">Producten laden uit Google Sheet...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-brand-light pt-32 px-6 pb-20">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-red-500">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-brand-light pt-32 px-6 pb-20">
      <div className="max-w-4xl mx-auto">
        <h1 className="font-heading text-3xl mb-2">Product Labels</h1>
        <p className="text-brand-taupe mb-6">
          Printer: <strong>Brother QL-1100C</strong>. Per label: QR, naam, prijs
          en leesbare code, op de rol{" "}
          <strong>DK-22205</strong> (62 mm doorlopend papier; winkel: vaak{" "}
          <em>22205</em> of <em>205</em>).
        </p>

        {/* Filters */}
        <div className="bg-white rounded-lg border border-brand-cream p-4 mb-6">
          <div className="flex flex-col sm:flex-row gap-3">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Zoek op naam of barcode..."
              className="flex-1 px-4 py-2 bg-brand-light border border-brand-cream rounded focus:outline-none focus:border-brand-gold text-sm"
            />
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-4 py-2 bg-brand-light border border-brand-cream rounded focus:outline-none focus:border-brand-gold text-sm"
            >
              <option value="alle">Alle categorieen</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Actions bar */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <button
              onClick={selectAll}
              className="text-xs uppercase tracking-widest text-brand-taupe hover:text-brand-gold transition-colors"
            >
              {filtered.every((p) => selected.has(p.barcode)) && filtered.length > 0
                ? "Deselecteer alles"
                : "Selecteer alles"}
            </button>
            <span className="text-sm text-brand-taupe">
              {selected.size} geselecteerd
            </span>
          </div>
          <button
            onClick={handlePrint}
            disabled={selected.size === 0}
            className="btn-primary text-xs disabled:opacity-40"
          >
            Print {selected.size} label{selected.size !== 1 ? "s" : ""}
          </button>
        </div>

        {/* Product list */}
        <div className="space-y-2">
          {filtered.map((p) => (
            <div
              key={p.barcode}
              onClick={() => toggleSelect(p.barcode)}
              className={`flex items-center gap-4 p-3 rounded-lg border cursor-pointer transition-colors ${
                selected.has(p.barcode)
                  ? "bg-brand-gold/10 border-brand-gold"
                  : "bg-white border-brand-cream hover:border-brand-gold/50"
              }`}
            >
              <div
                className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                  selected.has(p.barcode)
                    ? "bg-brand-gold border-brand-gold"
                    : "border-brand-cream"
                }`}
              >
                {selected.has(p.barcode) && (
                  <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                )}
              </div>

              <div className="w-12 h-12 flex-shrink-0">
                <QRCodeSVG value={p.barcode} size={48} level="M" />
              </div>

              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate">{p.naam}</p>
                <p className="text-xs text-brand-taupe">
                  {p.categorie} &bull; &euro;{p.prijs}
                  {p.voorraad && ` \u00b7 voorraad: ${p.voorraad}`}
                </p>
              </div>

              <span className="text-xs font-mono text-brand-taupe flex-shrink-0">
                {p.barcode}
              </span>
            </div>
          ))}
        </div>

        {filtered.length === 0 && (
          <p className="text-center text-brand-taupe py-12">
            Geen producten gevonden.
          </p>
        )}

        {/* Preview section */}
        {selectedProducts.length > 0 && (
          <div className="mt-8 bg-white rounded-lg border border-brand-cream p-6">
            <h2 className="font-heading text-xl mb-4">
              Preview ({selectedProducts.length} labels)
            </h2>
            <div ref={printRef} className="space-y-3">
              {selectedProducts.slice(0, 5).map((p) => (
                <div
                  key={p.barcode}
                  className="flex items-center gap-3 p-3 bg-brand-light rounded border border-brand-cream"
                  style={{ maxWidth: "62mm" }}
                >
                  <QRCodeSVG value={p.barcode} size={56} level="M" />
                  <div className="min-w-0">
                    <p className="text-[9px] font-bold leading-tight truncate">
                      {p.naam}
                    </p>
                    <p className="text-[10px] font-bold mt-0.5">
                      &euro;{p.prijs}
                    </p>
                    <p className="text-[7px] text-gray-500">{p.barcode}</p>
                  </div>
                </div>
              ))}
              {selectedProducts.length > 5 && (
                <p className="text-xs text-brand-taupe">
                  + {selectedProducts.length - 5} meer...
                </p>
              )}
            </div>

            <div className="mt-4 p-3 bg-brand-cream/50 rounded text-xs text-brand-taupe space-y-2">
              <p className="font-medium text-brand-dark">
                In het printvenster: printer <strong>Brother QL-1100C</strong>.
                Label/papier: 62 mm doorlopend, <strong>DK-22205</strong> (hetzelfde als
                22205/205 in de winkel) als de driver kiest. Schaal: <strong>100%</strong>.
              </p>
              <p>
                <strong>Andere rol in de machine?</strong> Alleen 62 mm{" "}
                <strong>DK-22205</strong> (maat/rol 205). Smal (29/38 mm) past niet: cassette
                wisselen.
              </p>
              <p>
                <strong>QR op het label:</strong> ja: links de QR, rechts naam,
                prijs en de barcode-tekst. De QR is dezelfde waarde als de
                geprinte code (bijv. BA-KET-001); scan testen met de
                iPhone-cameratoets.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
