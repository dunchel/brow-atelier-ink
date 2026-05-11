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

type PrintMode = "single" | "stock";
type StickerLayout = "single" | "double" | "grid";

const PRINT_LABEL_WIDTH_MM = 62;
const PRINT_LABEL_HEIGHT_MM = 100;
const PRINT_QR_SIZE_PX = 86;

const GRID_STICKER_WIDTH_MM = 102;
const GRID_STICKER_HEIGHT_MM = 150;
const GRID_COLS = 2;
const GRID_ROWS = 5;
const GRID_LABELS_PER_STICKER = GRID_COLS * GRID_ROWS;

export default function LabelsPage() {
  const [products, setProducts] = useState<LabelProduct[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("alle");
  const [printMode, setPrintMode] = useState<PrintMode | null>(null);
  const [stickerLayout, setStickerLayout] = useState<StickerLayout>("double");

  const labelsPerSticker =
    stickerLayout === "single"
      ? 1
      : stickerLayout === "double"
      ? 2
      : GRID_LABELS_PER_STICKER;

  const stickerWidthMm =
    stickerLayout === "grid" ? GRID_STICKER_WIDTH_MM : PRINT_LABEL_WIDTH_MM;
  const stickerHeightMm =
    stickerLayout === "grid" ? GRID_STICKER_HEIGHT_MM : PRINT_LABEL_HEIGHT_MM;
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

  const parseStockCount = useCallback((voorraadRaw: string) => {
    const match = voorraadRaw.replace(",", ".").match(/-?\d+(\.\d+)?/);
    if (!match) return 0;
    const value = Math.floor(Number(match[0]));
    return Number.isFinite(value) && value > 0 ? value : 0;
  }, []);

  const getLabelCountForProduct = useCallback(
    (product: LabelProduct) => {
      if (!printMode) return 0;
      if (printMode === "single") return 1;
      return parseStockCount(product.voorraad);
    },
    [parseStockCount, printMode]
  );

  const selectedPrintItems = selectedProducts.flatMap((p) =>
    Array.from({ length: getLabelCountForProduct(p) }, () => p)
  );
  const totalLabelsToPrint = selectedPrintItems.length;
  const totalStickersToPrint = Math.ceil(totalLabelsToPrint / labelsPerSticker);

  const renderQrSvg = useCallback((value: string) => {
    return renderToStaticMarkup(
      createElement(QRCodeSVG, { value, size: PRINT_QR_SIZE_PX, level: "M" })
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
    if (!printMode || selectedProducts.length === 0 || totalLabelsToPrint === 0) return;

    const stickers = selectedPrintItems.reduce<LabelProduct[][]>((acc, item, idx) => {
      const pageIdx = Math.floor(idx / labelsPerSticker);
      if (!acc[pageIdx]) acc[pageIdx] = [];
      acc[pageIdx].push(item);
      return acc;
    }, []);

    const labelsHTML = stickers
      .map((sticker) => {
        const labelsMarkup = sticker
          .map(
            (p) => `
        <div class="label-item">
          <div class="qr-container">${renderQrSvg(p.barcode)}</div>
          <div class="info">
            <div class="naam">${escapeHtml(p.naam)}</div>
            <div class="prijs">&euro;${escapeHtml(p.prijs)}</div>
            <div class="code">${escapeHtml(p.barcode)}</div>
          </div>
        </div>`
          )
          .join("");

        const missing = labelsPerSticker - sticker.length;
        const placeholders =
          missing > 0
            ? Array.from({ length: missing })
                .map(() => '<div class="label-item placeholder"></div>')
                .join("")
            : "";

        return `
      <div class="sticker ${stickerLayout}">
        ${labelsMarkup}
        ${placeholders}
      </div>`;
      })
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
      .sticker {
        background: white;
        border: 1px dashed #ccc;
        margin-bottom: 10px;
      }
    }

    .sticker {
      display: flex;
      flex-direction: column;
      align-items: stretch;
      gap: 2mm;
      padding: 4mm 3mm;
      width: ${stickerWidthMm}mm;
      height: ${stickerHeightMm}mm;
      page-break-inside: avoid;
      break-inside: avoid;
      page-break-after: always;
      break-after: page;
    }

    .sticker:last-child {
      page-break-after: auto;
      break-after: auto;
    }

    .sticker.grid {
      display: grid;
      grid-template-columns: repeat(${GRID_COLS}, 1fr);
      grid-template-rows: repeat(${GRID_ROWS}, 1fr);
      gap: 1.5mm;
      padding: 3mm;
    }

    .label-item {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: flex-start;
      gap: 1.8mm;
      height: 100%;
      min-height: 0;
    }

    .sticker.double .label-item {
      height: calc((100% - 2mm) / 2);
      border-bottom: 1px dashed #d7d7d7;
      padding-bottom: 1mm;
    }

    .sticker.double .label-item:last-child {
      border-bottom: none;
      padding-bottom: 0;
    }

    .label-item.placeholder {
      visibility: hidden;
    }

    .sticker.double .qr-container { width: 17mm; height: 17mm; }
    .sticker.double .naam {
      font-size: 10px;
      -webkit-line-clamp: 2;
      max-height: 24px;
    }
    .sticker.double .prijs { font-size: 13px; margin-top: 0.7mm; }
    .sticker.double .code { font-size: 9px; margin-top: 0.6mm; }

    .sticker.grid .label-item {
      flex-direction: row;
      align-items: center;
      justify-content: flex-start;
      gap: 1.5mm;
      padding: 1mm;
      border: 1px dashed #c0c0c0;
      border-radius: 1mm;
      height: 100%;
      overflow: hidden;
    }
    .sticker.grid .qr-container {
      width: 18mm;
      height: 18mm;
    }
    .sticker.grid .info {
      width: auto;
      flex: 1;
      text-align: left;
      align-items: flex-start;
    }
    .sticker.grid .naam {
      font-size: 8px;
      line-height: 1.1;
      -webkit-line-clamp: 2;
      max-height: 18px;
      margin-top: 0;
      text-align: left;
    }
    .sticker.grid .prijs { font-size: 11px; margin-top: 0.5mm; }
    .sticker.grid .code { font-size: 7px; margin-top: 0.4mm; }

    .qr-container {
      flex-shrink: 0;
      width: 25mm;
      height: 25mm;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .qr-container svg { display: block; }

    .info {
      width: 100%;
      min-width: 0;
      text-align: center;
      display: flex;
      flex-direction: column;
      align-items: center;
    }
    .naam {
      width: 100%;
      font-size: 12px;
      font-weight: 700;
      line-height: 1.15;
      margin-top: 0.5mm;
      overflow: hidden;
      word-break: break-word;
      display: -webkit-box;
      -webkit-line-clamp: 3;
      -webkit-box-orient: vertical;
      max-height: 42px;
    }
    .prijs {
      font-size: 16px;
      font-weight: 700;
      margin-top: 1.2mm;
      line-height: 1;
    }
    .code {
      width: 100%;
      font-size: 10px;
      color: #666;
      margin-top: 1.2mm;
      letter-spacing: 0.2px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    @media print {
      @page {
        size: ${stickerWidthMm}mm ${stickerHeightMm}mm;
        margin: 0;
      }
      body { padding: 0; }
      .sticker { margin: 0; border: none; }
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
          Printer: <strong>Brother QL-1100C</strong>. Kies hieronder hoeveel
          labels per product (1 of voorraad) en welke indeling op de sticker.
          Voor de <strong>brede rol DK-22243 (102 mm)</strong> kun je{" "}
          {GRID_LABELS_PER_STICKER} labels op één vel printen en zelf
          uitknippen.
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

        <div className="bg-white rounded-lg border border-brand-cream p-4 mb-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <p className="text-xs uppercase tracking-widest text-brand-taupe">Aantal labels</p>
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => setPrintMode("single")}
                className={`px-3 py-1.5 text-xs rounded border transition-colors whitespace-nowrap ${
                  printMode === "single"
                    ? "bg-brand-dark text-white border-brand-dark"
                    : "bg-white border-brand-cream text-brand-taupe hover:border-brand-gold"
                }`}
              >
                1 per product
              </button>
              <button
                onClick={() => setPrintMode("stock")}
                className={`px-3 py-1.5 text-xs rounded border transition-colors whitespace-nowrap ${
                  printMode === "stock"
                    ? "bg-brand-dark text-white border-brand-dark"
                    : "bg-white border-brand-cream text-brand-taupe hover:border-brand-gold"
                }`}
              >
                Volgens voorraad
              </button>
            </div>
          </div>
          {!printMode && (
            <p className="text-xs text-orange-600 mt-3">
              Kies eerst een modus: <strong>1 per product</strong> of <strong>Volgens voorraad</strong>.
            </p>
          )}
        </div>
        <div className="bg-white rounded-lg border border-brand-cream p-4 mb-4">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <p className="text-xs uppercase tracking-widest text-brand-taupe">Indeling sticker</p>
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => setStickerLayout("single")}
                className={`px-3 py-1.5 text-xs rounded border transition-colors whitespace-nowrap ${
                  stickerLayout === "single"
                    ? "bg-brand-dark text-white border-brand-dark"
                    : "bg-white border-brand-cream text-brand-taupe hover:border-brand-gold"
                }`}
              >
                1 per sticker
              </button>
              <button
                onClick={() => setStickerLayout("double")}
                className={`px-3 py-1.5 text-xs rounded border transition-colors whitespace-nowrap ${
                  stickerLayout === "double"
                    ? "bg-brand-dark text-white border-brand-dark"
                    : "bg-white border-brand-cream text-brand-taupe hover:border-brand-gold"
                }`}
              >
                2 per sticker
              </button>
              <button
                onClick={() => setStickerLayout("grid")}
                className={`px-3 py-1.5 text-xs rounded border transition-colors whitespace-nowrap ${
                  stickerLayout === "grid"
                    ? "bg-brand-dark text-white border-brand-dark"
                    : "bg-white border-brand-cream text-brand-taupe hover:border-brand-gold"
                }`}
              >
                Brede rol (102mm) — {GRID_LABELS_PER_STICKER} per vel
              </button>
            </div>
          </div>
          {stickerLayout === "grid" && (
            <p className="text-xs text-brand-taupe mt-3">
              Voor de brede rol <strong>DK-22243 (102 mm)</strong>. Er passen{" "}
              <strong>{GRID_LABELS_PER_STICKER}</strong> labels op één vel
              ({GRID_COLS} kolommen × {GRID_ROWS} rijen). Snijlijnen worden
              meegeprint zodat je ze met de hand kunt uitknippen.
            </p>
          )}
        </div>

        {/* Actions bar */}
        <div className="flex items-center justify-between mb-2">
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
              {selected.size} producten geselecteerd
            </span>
          </div>
          <button
            onClick={handlePrint}
            disabled={!printMode || selected.size === 0 || totalLabelsToPrint === 0}
            className="btn-primary text-xs disabled:opacity-40"
          >
            Print {totalLabelsToPrint} label{totalLabelsToPrint !== 1 ? "s" : ""}
          </button>
        </div>
        <div className="mb-4">
          <span className="text-xs text-brand-taupe">
            Totaal labels: <strong>{totalLabelsToPrint}</strong> • Stickers:{" "}
            <strong>{totalStickersToPrint}</strong>
          </span>
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
              <div className="text-right text-xs text-brand-taupe min-w-[78px]">
                <p>Voorraad: {parseStockCount(p.voorraad)}</p>
                <p className="font-semibold text-brand-dark">
                  Labels: {printMode ? getLabelCountForProduct(p) : "-"}
                </p>
              </div>
            </div>
          ))}
        </div>

        {filtered.length === 0 && (
          <p className="text-center text-brand-taupe py-12">
            Geen producten gevonden.
          </p>
        )}

        {/* Preview section */}
        {selectedPrintItems.length > 0 && (
          <div className="mt-8 bg-white rounded-lg border border-brand-cream p-6">
            <h2 className="font-heading text-xl mb-4">
              Preview ({selectedPrintItems.length} labels)
            </h2>
            <div ref={printRef} className="space-y-3">
              {selectedPrintItems.slice(0, 5).map((p, idx) => (
                <div
                  key={`${p.barcode}-${idx}`}
                  className="flex flex-col items-center gap-2 p-3 bg-brand-light rounded border border-brand-cream"
                  style={{ maxWidth: `${PRINT_LABEL_WIDTH_MM}mm`, minHeight: `${PRINT_LABEL_HEIGHT_MM}mm` }}
                >
                  <QRCodeSVG value={p.barcode} size={86} level="M" />
                  <div className="min-w-0 w-full text-center">
                    <p
                      className="text-xs font-bold leading-tight break-words overflow-hidden"
                      style={{
                        display: "-webkit-box",
                        WebkitLineClamp: 3,
                        WebkitBoxOrient: "vertical",
                      }}
                    >
                      {p.naam}
                    </p>
                    <p className="text-lg font-bold mt-1 leading-none">
                      &euro;{p.prijs}
                    </p>
                    <p className="text-[10px] text-gray-500 mt-1 truncate">{p.barcode}</p>
                  </div>
                </div>
              ))}
              {selectedPrintItems.length > 5 && (
                <p className="text-xs text-brand-taupe">
                  + {selectedPrintItems.length - 5} meer...
                </p>
              )}
            </div>

            <div className="mt-4 p-3 bg-brand-cream/50 rounded text-xs text-brand-taupe space-y-2">
              <p className="font-medium text-brand-dark">
                In het printvenster: printer <strong>Brother QL-1100C</strong>.
                Papier: <strong>{stickerWidthMm} x {stickerHeightMm} mm</strong>{" "}
                {stickerLayout === "grid" ? (
                  <>
                    (kies een <strong>102 mm</strong> formaat dat dichtbij{" "}
                    {GRID_STICKER_HEIGHT_MM} mm zit, of <strong>102 mm continuous</strong>)
                  </>
                ) : (
                  <>(of dichtstbijzijnde 62 mm breed profiel)</>
                )}
                . Schaal: <strong>100%</strong>, <strong>Actual size</strong>,
                niet fit-to-page. Oriëntatie: <strong>portrait</strong>.
              </p>
              {stickerLayout === "grid" ? (
                <p>
                  <strong>Brede rol DK-22243:</strong> {GRID_LABELS_PER_STICKER}{" "}
                  labels per vel ({GRID_COLS} × {GRID_ROWS}) met dunne
                  snijlijnen. Knip met de hand uit. Zet{" "}
                  <strong>Auto cut = on</strong> zodat ieder vel netjes
                  afgesneden wordt.
                </p>
              ) : (
                <p>
                  <strong>Snijden per label:</strong> zet in de Brother-driver{" "}
                  <strong>Auto cut = on</strong>. Omdat elk label op een aparte
                  printpagina staat, snijdt de QL nu per label.
                </p>
              )}
              <p>
                <strong>QR op het label:</strong> boven de QR, daaronder naam,
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
