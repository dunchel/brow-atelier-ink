/** Vouwbare oorbellen-strook, afgelezen van het mock-up op de tegeltafel.
 *  Breedte ≈ 12 mm (nagelbreedte / voeg), lengte ≈ 40–42 mm (⅓ tegelzijde).
 *  Op 62 mm Brother-rol: 5 stroken naast elkaar, vouwlijn in het midden.
 */
export const EARRING_LABEL = {
  tapeWidthMm: 62,
  tapeHeightMm: 42,
  cols: 5,
  stripWidthMm: 12,
  foldAtMm: 21,
  qrPx: 34,
} as const;

export function earringLabelsPerSticker(): number {
  return EARRING_LABEL.cols;
}

export function buildEarringPrintHtml(opts: {
  stickers: { naam: string; prijs: string; barcode: string }[][];
  renderQr: (barcode: string, size: number) => string;
  escapeHtml: (s: string) => string;
}): string {
  const { tapeWidthMm, tapeHeightMm, cols, qrPx } = EARRING_LABEL;
  const { stickers, renderQr, escapeHtml } = opts;

  const stickersHtml = stickers
    .map((group) => {
      const strips = Array.from({ length: cols }, (_, i) => {
        const p = group[i];
        if (!p) return `<div class="earring-strip placeholder"></div>`;
        return `
        <div class="earring-strip">
          <div class="earring-qr">${renderQr(p.barcode, qrPx)}</div>
          <div class="earring-fold"><span>vouw</span></div>
          <div class="earring-info">
            <div class="prijs">&euro;${escapeHtml(p.prijs)}</div>
            <div class="code">${escapeHtml(p.barcode)}</div>
          </div>
        </div>`;
      }).join("");
      return `<div class="sticker earring">${strips}</div>`;
    })
    .join("");

  return `<!DOCTYPE html>
<html>
<head>
  <title>Oorbellen-stroken - Brow Atelier</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: Arial, Helvetica, sans-serif; }

    @media screen {
      body { padding: 20px; background: #f5f5f5; }
      .sticker { background: white; border: 1px dashed #ccc; margin-bottom: 10px; }
    }

    .sticker.earring {
      display: flex;
      flex-direction: row;
      align-items: stretch;
      width: ${tapeWidthMm}mm;
      height: ${tapeHeightMm}mm;
      padding: 0.6mm 1mm;
      page-break-inside: avoid;
      break-inside: avoid;
      page-break-after: always;
      break-after: page;
    }
    .sticker.earring:last-child {
      page-break-after: auto;
      break-after: auto;
    }

    .earring-strip {
      width: 12mm;
      height: 100%;
      border-right: 0.25mm dashed #b0b0b0;
      display: flex;
      flex-direction: column;
      overflow: hidden;
    }
    .earring-strip:last-child { border-right: none; }
    .earring-strip.placeholder { visibility: hidden; }

    .earring-qr {
      height: 19.5mm;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 0.4mm;
    }
    .earring-qr svg { display: block; width: 9.6mm; height: 9.6mm; }

    .earring-fold {
      height: 2.2mm;
      border-top: 0.35mm dashed #111;
      border-bottom: 0.35mm dashed #111;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 4px;
      letter-spacing: 0.2px;
      text-transform: uppercase;
      color: #777;
      flex-shrink: 0;
    }

    /* Onderste helft 180° gedraaid: na omvouwen over het haakje leesbaar */
    .earring-info {
      height: 19.5mm;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 0.7mm;
      transform: rotate(180deg);
      padding: 0.5mm;
    }
    .earring-info .prijs {
      font-size: 7.5px;
      font-weight: 800;
      line-height: 1;
    }
    .earring-info .code {
      font-size: 4.6px;
      font-weight: 600;
      letter-spacing: -0.1px;
      text-align: center;
      line-height: 1.15;
      word-break: break-all;
      max-width: 11mm;
    }

    @media print {
      @page { size: ${tapeWidthMm}mm ${tapeHeightMm}mm; margin: 0; }
      body { padding: 0; }
      .sticker { margin: 0; border: none; }
    }
  </style>
</head>
<body>
  ${stickersHtml}
</body>
</html>`;
}
