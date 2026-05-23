"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
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
type PrintFormat = "label" | "a4";
type StickerLayout = "single" | "double" | "grid";
type LabelStyle = "full" | "compact" | "mini";

interface LayoutConfig {
  singleWidth: number;
  singleHeight: number;
  doubleWidth: number;
  doubleHeight: number;
  gridWidth: number;
  gridHeight: number;
  gridCols: number;
  gridRows: number;
  qrPx: number;
}

const LAYOUT: Record<LabelStyle, LayoutConfig> = {
  full: {
    singleWidth: 62,
    singleHeight: 100,
    doubleWidth: 62,
    doubleHeight: 100,
    gridWidth: 102,
    gridHeight: 150,
    gridCols: 2,
    gridRows: 5,
    qrPx: 86,
  },
  compact: {
    singleWidth: 62,
    singleHeight: 38,
    doubleWidth: 62,
    doubleHeight: 72,
    gridWidth: 102,
    gridHeight: 144,
    gridCols: 4,
    gridRows: 6,
    qrPx: 70,
  },
  mini: {
    singleWidth: 62,
    singleHeight: 32,
    doubleWidth: 62,
    doubleHeight: 62,
    gridWidth: 102,
    gridHeight: 138,
    gridCols: 5,
    gridRows: 7,
    qrPx: 58,
  },
};

const A4_COLS = 3;
const A4_ROWS = 4;
const A4_ITEMS_PER_PAGE = A4_COLS * A4_ROWS;
const A4_QR_PX = 72;

const JEWELRY_CATEGORIES = new Set([
  "kettingen",
  "armbanden",
  "oorbellen",
  "ringen",
  "enkelbandjes",
  "sieraden",
]);

export default function LabelsPage() {
  const [products, setProducts] = useState<LabelProduct[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("alle");
  const [printMode, setPrintMode] = useState<PrintMode | null>(null);
  const [printFormat, setPrintFormat] = useState<PrintFormat>("label");
  const [stickerLayout, setStickerLayout] = useState<StickerLayout>("grid");
  const [labelStyle, setLabelStyle] = useState<LabelStyle>("compact");
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

  const cfg = LAYOUT[labelStyle];
  const gridLabelsPerSticker = cfg.gridCols * cfg.gridRows;

  const labelsPerSticker =
    stickerLayout === "single"
      ? 1
      : stickerLayout === "double"
      ? 2
      : gridLabelsPerSticker;

  const stickerWidthMm =
    stickerLayout === "single"
      ? cfg.singleWidth
      : stickerLayout === "double"
      ? cfg.doubleWidth
      : cfg.gridWidth;
  const stickerHeightMm =
    stickerLayout === "single"
      ? cfg.singleHeight
      : stickerLayout === "double"
      ? cfg.doubleHeight
      : cfg.gridHeight;

  const categories = Array.from(new Set(products.map((p) => p.categorie)));

  const categoryCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const p of products) {
      counts.set(p.categorie, (counts.get(p.categorie) ?? 0) + 1);
    }
    return counts;
  }, [products]);

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

  const selectedProducts = useMemo(
    () => products.filter((p) => selected.has(p.barcode)),
    [products, selected]
  );

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

  const buildPrintItems = useCallback(
    (prods: LabelProduct[]) =>
      prods.flatMap((p) =>
        Array.from({ length: getLabelCountForProduct(p) }, () => p)
      ),
    [getLabelCountForProduct]
  );

  const selectOnlyCategory = useCallback(
    (cat: string) => {
      setCategoryFilter(cat);
      const codes = products.filter((p) => p.categorie === cat).map((p) => p.barcode);
      setSelected(new Set(codes));
    },
    [products]
  );

  const canPrintProducts = useCallback(
    (prods: LabelProduct[]) => {
      if (prods.length === 0) return false;
      if (printFormat === "a4") return true;
      if (!printMode) return false;
      return buildPrintItems(prods).length > 0;
    },
    [printFormat, printMode, buildPrintItems]
  );

  const allSelectedAreJewelry =
    selectedProducts.length > 0 &&
    selectedProducts.every((p) =>
      JEWELRY_CATEGORIES.has((p.categorie || "").toLowerCase().trim())
    );

  const renderQrSvg = useCallback(
    (value: string) =>
      renderToStaticMarkup(
        createElement(QRCodeSVG, { value, size: cfg.qrPx, level: "M" })
      ),
    [cfg.qrPx]
  );

  const escapeHtml = (s: string) =>
    s
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");

  const printInIframe = (fullHtml: string) => {
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

  const renderQrSvgSized = (value: string, size: number) =>
    renderToStaticMarkup(
      createElement(QRCodeSVG, { value, size, level: "M" })
    );

  const handlePrintA4 = (productsOverride?: LabelProduct[]) => {
    const prods = productsOverride ?? selectedProducts;
    if (prods.length === 0) return;

    const pages = prods.reduce<LabelProduct[][]>((acc, item, idx) => {
      const pageIdx = Math.floor(idx / A4_ITEMS_PER_PAGE);
      if (!acc[pageIdx]) acc[pageIdx] = [];
      acc[pageIdx].push(item);
      return acc;
    }, []);

    const pagesHTML = pages
      .map((pageItems) => {
        const cells = pageItems
          .map(
            (p) => `
          <div class="a4-item">
            <div class="a4-naam">${escapeHtml(p.naam)}</div>
            <div class="a4-qr">${renderQrSvgSized(p.barcode, A4_QR_PX)}</div>
            <div class="a4-code">${escapeHtml(p.barcode)}</div>
          </div>`
          )
          .join("");
        const missing = A4_ITEMS_PER_PAGE - pageItems.length;
        const placeholders =
          missing > 0
            ? Array.from({ length: missing })
                .map(() => '<div class="a4-item placeholder"></div>')
                .join("")
            : "";
        return `<div class="a4-page">${cells}${placeholders}</div>`;
      })
      .join("");

    const fullHtml = `<!DOCTYPE html>
<html>
<head>
  <title>QR Boekje - Brow Atelier</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: Arial, Helvetica, sans-serif; }

    @media screen {
      body { padding: 20px; background: #f5f5f5; }
      .a4-page {
        background: white;
        border: 1px dashed #ccc;
        margin-bottom: 16px;
      }
    }

    .a4-page {
      width: 210mm;
      height: 297mm;
      padding: 12mm;
      display: grid;
      grid-template-columns: repeat(${A4_COLS}, 1fr);
      grid-template-rows: repeat(${A4_ROWS}, 1fr);
      gap: 4mm;
      page-break-after: always;
      break-after: page;
    }
    .a4-page:last-child {
      page-break-after: auto;
      break-after: auto;
    }

    .a4-item {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 2mm;
      padding: 3mm;
      border: 1px solid #ddd;
      border-radius: 2mm;
      text-align: center;
      overflow: hidden;
    }
    .a4-item.placeholder { visibility: hidden; border-color: transparent; }

    .a4-naam {
      width: 100%;
      font-size: 11px;
      font-weight: 700;
      line-height: 1.2;
      word-break: break-word;
      display: -webkit-box;
      -webkit-line-clamp: 4;
      -webkit-box-orient: vertical;
      overflow: hidden;
      min-height: 0;
    }
    .a4-qr {
      width: 22mm;
      height: 22mm;
      flex-shrink: 0;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .a4-qr svg { display: block; width: 100%; height: 100%; }
    .a4-code {
      font-size: 9px;
      color: #555;
      letter-spacing: 0.2px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      width: 100%;
    }

    @media print {
      @page { size: A4 portrait; margin: 0; }
      body { padding: 0; }
      .a4-page { margin: 0; border: none; }
    }
  </style>
</head>
<body>
  ${pagesHTML}
</body>
</html>`;

    printInIframe(fullHtml);
  };

  const handlePrint = (productsOverride?: LabelProduct[]) => {
    const prods = productsOverride ?? selectedProducts;

    if (printFormat === "a4") {
      handlePrintA4(prods);
      return;
    }
    if (!printMode || prods.length === 0) return;

    const printItems = buildPrintItems(prods);
    if (printItems.length === 0) return;

    const stickers = printItems.reduce<LabelProduct[][]>((acc, item, idx) => {
      const pageIdx = Math.floor(idx / labelsPerSticker);
      if (!acc[pageIdx]) acc[pageIdx] = [];
      acc[pageIdx].push(item);
      return acc;
    }, []);

    const renderLabel = (p: LabelProduct) => {
      const qr = renderQrSvg(p.barcode);
      if (labelStyle === "compact" || labelStyle === "mini") {
        return `
        <div class="label-item">
          <div class="qr-container">${qr}</div>
          <div class="info">
            <div class="code">${escapeHtml(p.barcode)}</div>
          </div>
        </div>`;
      }
      return `
        <div class="label-item">
          <div class="qr-container">${qr}</div>
          <div class="info">
            <div class="naam">${escapeHtml(p.naam)}</div>
            <div class="prijs">&euro;${escapeHtml(p.prijs)}</div>
            <div class="code">${escapeHtml(p.barcode)}</div>
          </div>
        </div>`;
    };

    const labelsHTML = stickers
      .map((sticker) => {
        const labelsMarkup = sticker.map(renderLabel).join("");
        const missing = labelsPerSticker - sticker.length;
        const placeholders =
          missing > 0
            ? Array.from({ length: missing })
                .map(() => '<div class="label-item placeholder"></div>')
                .join("")
            : "";
        return `
      <div class="sticker ${stickerLayout} style-${labelStyle}">
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
      padding: 3mm;
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
      grid-template-columns: repeat(${cfg.gridCols}, 1fr);
      grid-template-rows: repeat(${cfg.gridRows}, 1fr);
      gap: 1.5mm;
      padding: 3mm;
    }

    .label-item {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 1.2mm;
      height: 100%;
      min-height: 0;
    }
    .label-item.placeholder { visibility: hidden; }

    .qr-container {
      flex-shrink: 0;
      width: 25mm;
      height: 25mm;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .qr-container svg { display: block; width: 100%; height: 100%; }

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
      color: #444;
      margin-top: 1.2mm;
      letter-spacing: 0.2px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    /* === SINGLE layout overrides === */
    .sticker.single.style-compact .qr-container { width: 22mm; height: 22mm; }
    .sticker.single.style-compact .code { font-size: 11px; font-weight: 600; color: #111; }
    .sticker.single.style-mini .qr-container { width: 18mm; height: 18mm; }
    .sticker.single.style-mini .code { font-size: 10px; font-weight: 600; color: #111; }

    /* === DOUBLE layout: 2 labels stacked === */
    .sticker.double .label-item {
      height: calc((100% - 2mm) / 2);
      border-bottom: 1px dashed #d7d7d7;
      padding-bottom: 1mm;
    }
    .sticker.double .label-item:last-child {
      border-bottom: none;
      padding-bottom: 0;
    }
    .sticker.double.style-full .qr-container { width: 17mm; height: 17mm; }
    .sticker.double.style-full .naam { font-size: 10px; -webkit-line-clamp: 2; max-height: 24px; }
    .sticker.double.style-full .prijs { font-size: 13px; margin-top: 0.7mm; }
    .sticker.double.style-full .code { font-size: 9px; margin-top: 0.6mm; }

    .sticker.double.style-compact .qr-container { width: 20mm; height: 20mm; }
    .sticker.double.style-compact .code { font-size: 10px; font-weight: 600; color: #111; }
    .sticker.double.style-mini .qr-container { width: 16mm; height: 16mm; }
    .sticker.double.style-mini .code { font-size: 9px; font-weight: 600; color: #111; }

    /* === GRID layout === */
    .sticker.grid .label-item {
      padding: 1mm;
      border: 1px dashed #c0c0c0;
      border-radius: 1mm;
      overflow: hidden;
    }
    .sticker.grid.style-full .label-item {
      flex-direction: row;
      align-items: center;
      justify-content: flex-start;
      gap: 1.5mm;
    }
    .sticker.grid.style-full .qr-container { width: 18mm; height: 18mm; }
    .sticker.grid.style-full .info {
      width: auto; flex: 1; text-align: left; align-items: flex-start;
    }
    .sticker.grid.style-full .naam {
      font-size: 8px; line-height: 1.1; -webkit-line-clamp: 2;
      max-height: 18px; margin-top: 0; text-align: left;
    }
    .sticker.grid.style-full .prijs { font-size: 11px; margin-top: 0.5mm; }
    .sticker.grid.style-full .code { font-size: 7px; margin-top: 0.4mm; }

    /* Compact grid: square cells with only QR + code */
    .sticker.grid.style-compact .label-item {
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 0.8mm;
    }
    .sticker.grid.style-compact .qr-container { width: 15mm; height: 15mm; }
    .sticker.grid.style-compact .code {
      font-size: 7px;
      font-weight: 600;
      color: #111;
      margin-top: 0.3mm;
      text-align: center;
    }

    /* Mini grid: smallest square cells */
    .sticker.grid.style-mini .label-item {
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 0.5mm;
      padding: 0.8mm;
    }
    .sticker.grid.style-mini .qr-container { width: 12mm; height: 12mm; }
    .sticker.grid.style-mini .code {
      font-size: 6px;
      font-weight: 600;
      color: #111;
      margin-top: 0.2mm;
      text-align: center;
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

    printInIframe(fullHtml);
  };

  const labelStyleLabel =
    labelStyle === "mini" ? "mini" : labelStyle === "compact" ? "compact" : "volledig";

  const a4PagesToPrint = Math.ceil(selectedProducts.length / A4_ITEMS_PER_PAGE);
  const canPrintLabels =
    printMode !== null && selected.size > 0 && totalLabelsToPrint > 0;
  const canPrintA4 = selected.size > 0;

  const printCategory = (cat: string) => {
    const catProducts = products.filter((p) => p.categorie === cat);
    if (!canPrintProducts(catProducts)) return;
    selectOnlyCategory(cat);
    handlePrint(catProducts);
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
          Printer: <strong>Brother QL-1100C</strong> voor labels, of gewone{" "}
          <strong>A4</strong> voor een QR-boekje. Kies formaat, aantal labels
          per product, stijl en indeling.
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

        {/* Print per categorie */}
        {categories.length > 0 && (
          <div className="bg-white rounded-lg border border-brand-cream p-4 mb-4">
            <p className="text-xs uppercase tracking-widest text-brand-taupe mb-1">
              Print per categorie
            </p>
            <p className="text-xs text-brand-taupe mb-3">
              Selecteer of print direct alle producten van één categorie.
              {printFormat === "label" && !printMode && (
                <span className="text-orange-600">
                  {" "}
                  Kies eerst een aantal-modus (1 per product of voorraad).
                </span>
              )}
            </p>
            <div className="flex flex-wrap gap-2">
              {categories.map((cat) => {
                const count = categoryCounts.get(cat) ?? 0;
                const catProducts = products.filter((p) => p.categorie === cat);
                const catPrintable = canPrintProducts(catProducts);
                const catLabelCount =
                  printFormat === "label" && printMode
                    ? buildPrintItems(catProducts).length
                    : count;
                return (
                  <div
                    key={cat}
                    className="flex items-stretch rounded border border-brand-cream overflow-hidden"
                  >
                    <button
                      onClick={() => selectOnlyCategory(cat)}
                      className="px-3 py-2 text-xs bg-white text-brand-dark hover:bg-brand-light transition-colors text-left"
                      title={`Selecteer alle ${count} producten in ${cat}`}
                    >
                      {cat}
                      <span className="text-brand-taupe ml-1">({count})</span>
                    </button>
                    <button
                      onClick={() => printCategory(cat)}
                      disabled={!catPrintable}
                      className="px-3 py-2 text-xs border-l border-brand-cream bg-brand-gold/10 text-brand-dark hover:bg-brand-gold/20 transition-colors disabled:opacity-40 whitespace-nowrap"
                      title={`Print alle producten in ${cat}`}
                    >
                      Print
                      {printFormat === "label" && printMode
                        ? ` (${catLabelCount})`
                        : printFormat === "a4"
                        ? ` (${count})`
                        : ""}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Print formaat */}
        <div className="bg-white rounded-lg border border-brand-cream p-4 mb-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <p className="text-xs uppercase tracking-widest text-brand-taupe">Print formaat</p>
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => setPrintFormat("label")}
                className={`px-3 py-1.5 text-xs rounded border transition-colors whitespace-nowrap ${
                  printFormat === "label"
                    ? "bg-brand-dark text-white border-brand-dark"
                    : "bg-white border-brand-cream text-brand-taupe hover:border-brand-gold"
                }`}
              >
                Labelprinter (Brother QL)
              </button>
              <button
                onClick={() => setPrintFormat("a4")}
                className={`px-3 py-1.5 text-xs rounded border transition-colors whitespace-nowrap ${
                  printFormat === "a4"
                    ? "bg-brand-dark text-white border-brand-dark"
                    : "bg-white border-brand-cream text-brand-taupe hover:border-brand-gold"
                }`}
              >
                A4 boekje (naam + QR)
              </button>
            </div>
          </div>
          {printFormat === "a4" && (
            <p className="text-xs text-brand-taupe mt-3">
              Print geselecteerde producten op gewoon <strong>A4-papier</strong>:
              volledige productnaam, QR-code en barcode.{" "}
              <strong>{A4_ITEMS_PER_PAGE}</strong> producten per pagina (
              {A4_COLS} × {A4_ROWS}). Ideaal om te lamineren of in een boekje
              te binden. Altijd <strong>1 pagina-entry per product</strong> (geen
              voorraad-vermenigvuldiging).
            </p>
          )}
        </div>

        {/* Aantal labels */}
        {printFormat === "label" && (
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
        )}

        {/* Label stijl */}
        {printFormat === "label" && (
        <div className="bg-white rounded-lg border border-brand-cream p-4 mb-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <p className="text-xs uppercase tracking-widest text-brand-taupe">Label stijl</p>
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => setLabelStyle("full")}
                className={`px-3 py-1.5 text-xs rounded border transition-colors whitespace-nowrap ${
                  labelStyle === "full"
                    ? "bg-brand-dark text-white border-brand-dark"
                    : "bg-white border-brand-cream text-brand-taupe hover:border-brand-gold"
                }`}
              >
                Volledig (QR + naam + prijs + code)
              </button>
              <button
                onClick={() => setLabelStyle("compact")}
                className={`px-3 py-1.5 text-xs rounded border transition-colors whitespace-nowrap ${
                  labelStyle === "compact"
                    ? "bg-brand-dark text-white border-brand-dark"
                    : "bg-white border-brand-cream text-brand-taupe hover:border-brand-gold"
                }`}
              >
                Compact (QR + code)
              </button>
              <button
                onClick={() => setLabelStyle("mini")}
                className={`px-3 py-1.5 text-xs rounded border transition-colors whitespace-nowrap ${
                  labelStyle === "mini"
                    ? "bg-brand-dark text-white border-brand-dark"
                    : "bg-white border-brand-cream text-brand-taupe hover:border-brand-gold"
                }`}
              >
                Mini (kleiner, QR + code)
              </button>
            </div>
          </div>
          {(labelStyle === "compact" || labelStyle === "mini") && (
            <p className="text-xs text-brand-taupe mt-3">
              {labelStyle === "mini" ? (
                <>
                  <strong>Mini:</strong> nog een paar mm kleiner dan compact.
                  Op brede rol passen <strong>{gridLabelsPerSticker}</strong> labels
                  ({cfg.gridCols} × {cfg.gridRows}).
                </>
              ) : (
                <>
                  <strong>Compact:</strong> kleine vierkante labels met alleen QR +
                  code. Ideaal voor sieraden.
                </>
              )}
            </p>
          )}
          {labelStyle === "full" && allSelectedAreJewelry && selected.size > 0 && (
            <p className="text-xs text-orange-600 mt-3">
              Tip: je hebt alleen sieraden geselecteerd. Overweeg{" "}
              <button
                onClick={() => setLabelStyle("compact")}
                className="underline font-semibold"
              >
                Compact
              </button>{" "}
              of{" "}
              <button
                onClick={() => setLabelStyle("mini")}
                className="underline font-semibold"
              >
                Mini
              </button>{" "}
              voor kleinere vierkante labels.
            </p>
          )}
        </div>
        )}

        {/* Indeling sticker */}
        {printFormat === "label" && (
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
                Brede rol (102mm) — {gridLabelsPerSticker} per vel
              </button>
            </div>
          </div>
          {stickerLayout === "grid" && (
            <p className="text-xs text-brand-taupe mt-3">
              Voor de brede rol <strong>DK-22243 (102 mm)</strong>. Er passen{" "}
              <strong>{gridLabelsPerSticker}</strong> labels op één vel
              ({cfg.gridCols} × {cfg.gridRows}). Snijlijnen worden meegeprint
              zodat je ze met de hand kunt uitknippen.
            </p>
          )}
        </div>
        )}

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
            onClick={() => handlePrint()}
            disabled={printFormat === "a4" ? !canPrintA4 : !canPrintLabels}
            className="btn-primary text-xs disabled:opacity-40"
          >
            {printFormat === "a4"
              ? `Print A4 boekje (${selected.size} product${selected.size !== 1 ? "en" : ""})`
              : `Print ${totalLabelsToPrint} label${totalLabelsToPrint !== 1 ? "s" : ""}`}
          </button>
        </div>
        <div className="mb-4">
          <span className="text-xs text-brand-taupe">
            {printFormat === "a4" ? (
              <>
                A4-pagina&apos;s: <strong>{a4PagesToPrint}</strong> • Producten:{" "}
                <strong>{selected.size}</strong> •{" "}
                <strong>{A4_ITEMS_PER_PAGE}</strong> per pagina
              </>
            ) : (
              <>
                Totaal labels: <strong>{totalLabelsToPrint}</strong> • Stickers:{" "}
                <strong>{totalStickersToPrint}</strong> • Stijl:{" "}
                <strong>{labelStyleLabel}</strong>
              </>
            )}
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
        {selectedProducts.length > 0 && (
          <div className="mt-8 bg-white rounded-lg border border-brand-cream p-6">
            <h2 className="font-heading text-xl mb-4">
              Preview (
              {printFormat === "a4"
                ? `${selectedProducts.length} producten, ${a4PagesToPrint} A4-pagina${a4PagesToPrint !== 1 ? "'s" : ""}`
                : `${selectedPrintItems.length} labels`}
              )
            </h2>
            <div ref={printRef} className="flex flex-wrap gap-3">
              {printFormat === "a4" ? (
                selectedProducts.slice(0, 6).map((p) => (
                  <div
                    key={p.barcode}
                    className="flex flex-col items-center justify-center gap-2 p-3 bg-brand-light rounded border border-brand-cream text-center"
                    style={{ width: "55mm", minHeight: "70mm" }}
                  >
                    <p
                      className="text-xs font-bold leading-tight break-words overflow-hidden w-full"
                      style={{
                        display: "-webkit-box",
                        WebkitLineClamp: 4,
                        WebkitBoxOrient: "vertical",
                      }}
                    >
                      {p.naam}
                    </p>
                    <QRCodeSVG value={p.barcode} size={64} level="M" />
                    <p className="text-[10px] text-gray-500 truncate w-full">{p.barcode}</p>
                  </div>
                ))
              ) : (
                selectedPrintItems.slice(0, 8).map((p, idx) => (
                <div
                  key={`${p.barcode}-${idx}`}
                  className={`flex flex-col items-center justify-center gap-2 p-3 bg-brand-light rounded border border-brand-cream`}
                  style={{
                    width:
                      labelStyle === "mini"
                        ? "22mm"
                        : labelStyle === "compact"
                        ? "26mm"
                        : `${cfg.singleWidth}mm`,
                    height:
                      labelStyle === "mini"
                        ? "22mm"
                        : labelStyle === "compact"
                        ? "26mm"
                        : "auto",
                    minHeight:
                      labelStyle === "mini" || labelStyle === "compact"
                        ? undefined
                        : `${cfg.singleHeight}mm`,
                  }}
                >
                  <QRCodeSVG
                    value={p.barcode}
                    size={
                      labelStyle === "mini" ? 48 : labelStyle === "compact" ? 56 : 80
                    }
                    level="M"
                  />
                  {labelStyle === "compact" || labelStyle === "mini" ? (
                    <p className="text-[10px] font-semibold text-gray-800 truncate w-full text-center">
                      {p.barcode}
                    </p>
                  ) : (
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
                  )}
                </div>
              ))
              )}
              {printFormat === "a4" && selectedProducts.length > 6 && (
                <p className="text-xs text-brand-taupe self-center">
                  + {selectedProducts.length - 6} meer...
                </p>
              )}
              {printFormat === "label" && selectedPrintItems.length > 8 && (
                <p className="text-xs text-brand-taupe self-center">
                  + {selectedPrintItems.length - 8} meer...
                </p>
              )}
            </div>

            <div className="mt-4 p-3 bg-brand-cream/50 rounded text-xs text-brand-taupe space-y-2">
              {printFormat === "a4" ? (
                <>
                  <p className="font-medium text-brand-dark">
                    In het printvenster: kies je normale <strong>A4-printer</strong>.
                    Papier: <strong>A4</strong>, oriëntatie <strong>portrait</strong>,
                    schaal <strong>100%</strong> (Actual size). Geen fit-to-page.
                  </p>
                  <p>
                    <strong>QR-boekje:</strong> volledige productnaam boven de QR,
                    barcode eronder. Knip of lamineer per vakje, of bind de
                    pagina&apos;s tot een naslagboekje.
                  </p>
                </>
              ) : (
                <>
              <p className="font-medium text-brand-dark">
                In het printvenster: printer <strong>Brother QL-1100C</strong>.
                Papier: <strong>{stickerWidthMm} x {stickerHeightMm} mm</strong>{" "}
                {stickerLayout === "grid" ? (
                  <>
                    (kies een <strong>102 mm</strong> formaat dichtbij{" "}
                    {cfg.gridHeight} mm, of <strong>102 mm continuous</strong>)
                  </>
                ) : (
                  <>(of dichtstbijzijnde 62 mm breed profiel)</>
                )}
                . Schaal: <strong>100%</strong>, <strong>Actual size</strong>,
                niet fit-to-page. Oriëntatie: <strong>portrait</strong>.
              </p>
              {stickerLayout === "grid" ? (
                <p>
                  <strong>Brede rol DK-22243:</strong> {gridLabelsPerSticker}{" "}
                  labels per vel ({cfg.gridCols} × {cfg.gridRows}) met dunne
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
              {labelStyle === "compact" || labelStyle === "mini" ? (
                <p>
                  <strong>{labelStyle === "mini" ? "Mini" : "Compact"}-stijl:</strong>{" "}
                  alleen QR + barcode-tekst op een klein vierkant label. Scan met
                  iPhone-camera om te testen.
                </p>
              ) : (
                <p>
                  <strong>QR op het label:</strong> boven de QR, daaronder
                  naam, prijs en de barcode-tekst.
                </p>
              )}
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
