"use client";

import { useState } from "react";

interface Product {
  naam: string;
  prijs: string;
  beschrijving: string;
  categorie: string;
  foto: string;
  tags: string;
  beschikbaar: string;
  oudePrijs: string;
}

const SHEET_CSV_URL =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vRtEz-zrvXltu_lpG3xJ3AMctfjIYNaE2ax4A6ITDiTCVhiYSj3l9nUOacu0nMYbfqqMk5bttt6yen3/pub?gid=1575650592&single=true&output=csv";

function parseCSV(csv: string): Record<string, string>[] {
  const lines = csv.split("\n").filter((l) => l.trim());
  if (lines.length < 2) return [];
  const headers = lines[0].split(",").map((h) => h.trim().toLowerCase());
  const rows: Record<string, string>[] = [];
  for (let i = 1; i < lines.length; i++) {
    const values: string[] = [];
    let current = "";
    let inQuotes = false;
    for (const char of lines[i]) {
      if (char === '"') inQuotes = !inQuotes;
      else if (char === "," && !inQuotes) {
        values.push(current.trim());
        current = "";
      } else current += char;
    }
    values.push(current.trim());
    const row: Record<string, string> = {};
    headers.forEach((h, idx) => (row[h] = values[idx] || ""));
    rows.push(row);
  }
  return rows;
}

function slugify(text: string) {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

function escapeCSV(val: string) {
  if (val.includes(",") || val.includes('"') || val.includes("\n")) {
    return `"${val.replace(/"/g, '""')}"`;
  }
  return val;
}

function toShopifyCSV(products: Product[]): string {
  const headers = [
    "Handle",
    "Title",
    "Body (HTML)",
    "Vendor",
    "Product Category",
    "Type",
    "Tags",
    "Published",
    "Option1 Name",
    "Option1 Value",
    "Variant SKU",
    "Variant Grams",
    "Variant Inventory Tracker",
    "Variant Inventory Qty",
    "Variant Inventory Policy",
    "Variant Fulfillment Service",
    "Variant Price",
    "Variant Compare At Price",
    "Variant Requires Shipping",
    "Variant Taxable",
    "Image Src",
    "Image Alt Text",
    "Status",
  ];

  const rows = products.map((p) => {
    const tags = p.tags.replace(/;/g, ",");
    const published = p.beschikbaar.toLowerCase() !== "nee";
    return [
      slugify(p.naam),
      p.naam,
      `<p>${p.beschrijving}</p>`,
      "Brow Atelier & Ink",
      "",
      p.categorie,
      tags,
      published ? "TRUE" : "FALSE",
      "Title",
      "Default Title",
      "",
      "0",
      "shopify",
      "10",
      "deny",
      "manual",
      p.prijs,
      p.oudePrijs || "",
      "TRUE",
      "TRUE",
      p.foto,
      p.naam,
      published ? "active" : "draft",
    ].map(escapeCSV);
  });

  return [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
}

export default function SyncPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetched, setFetched] = useState(false);

  const fetchSheet = async () => {
    setLoading(true);
    try {
      const res = await fetch(SHEET_CSV_URL);
      const csv = await res.text();
      const rows = parseCSV(csv);
      const mapped = rows
        .filter((r) => r["naam"] || r["title"])
        .map((r) => ({
          naam: r["naam"] || r["title"] || "",
          prijs: r["prijs"] || r["price"] || "0",
          beschrijving: r["beschrijving"] || r["description"] || "",
          categorie: r["categorie"] || r["category"] || "",
          foto: r["foto"] || r["image"] || "",
          tags: r["tags"] || "",
          beschikbaar: r["beschikbaar"] || r["available"] || "Ja",
          oudePrijs: r["oude prijs"] || r["compare at price"] || "",
        }));
      setProducts(mapped);
      setFetched(true);
    } catch {
      alert("Kon de Sheet niet laden. Is hij gepubliceerd?");
    }
    setLoading(false);
  };

  const downloadCSV = () => {
    const csv = toShopifyCSV(products);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "shopify-producten.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-brand-light pt-32 px-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="font-heading text-3xl mb-2">
          Producten synchroniseren
        </h1>
        <p className="text-brand-taupe mb-8">
          Haal producten op uit de Google Sheet en download een Shopify-klare
          CSV. Die importeer je in Shopify zodat betalingen werken.
        </p>

        <div className="space-y-6">
          <div className="flex gap-4">
            <button
              onClick={fetchSheet}
              disabled={loading}
              className="btn-primary text-xs disabled:opacity-50"
            >
              {loading ? "Laden..." : "Haal producten op uit Sheet"}
            </button>
            {products.length > 0 && (
              <button onClick={downloadCSV} className="btn-outline text-xs">
                Download Shopify CSV ({products.length} producten)
              </button>
            )}
          </div>

          {fetched && products.length === 0 && (
            <p className="text-red-500">Geen producten gevonden in de Sheet.</p>
          )}

          {products.length > 0 && (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-brand-cream">
                      <th className="text-left py-2 pr-4 text-xs uppercase tracking-wider text-brand-taupe">
                        Product
                      </th>
                      <th className="text-left py-2 pr-4 text-xs uppercase tracking-wider text-brand-taupe">
                        Prijs
                      </th>
                      <th className="text-left py-2 pr-4 text-xs uppercase tracking-wider text-brand-taupe">
                        Categorie
                      </th>
                      <th className="text-left py-2 pr-4 text-xs uppercase tracking-wider text-brand-taupe">
                        Foto
                      </th>
                      <th className="text-left py-2 text-xs uppercase tracking-wider text-brand-taupe">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {products.map((p, i) => (
                      <tr key={i} className="border-b border-brand-cream/50">
                        <td className="py-3 pr-4 font-medium">{p.naam}</td>
                        <td className="py-3 pr-4">&euro;{p.prijs}</td>
                        <td className="py-3 pr-4 text-brand-taupe">
                          {p.categorie}
                        </td>
                        <td className="py-3 pr-4">
                          {p.foto ? (
                            <img
                              src={p.foto}
                              alt={p.naam}
                              className="w-10 h-10 object-cover rounded"
                            />
                          ) : (
                            <span className="text-brand-taupe text-xs">
                              Geen foto
                            </span>
                          )}
                        </td>
                        <td className="py-3">
                          <span
                            className={`text-xs px-2 py-0.5 rounded-full ${
                              p.beschikbaar.toLowerCase() !== "nee"
                                ? "bg-green-100 text-green-700"
                                : "bg-red-100 text-red-700"
                            }`}
                          >
                            {p.beschikbaar.toLowerCase() !== "nee"
                              ? "Beschikbaar"
                              : "Uitverkocht"}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="p-6 bg-brand-cream/50 rounded-lg space-y-3">
                <h3 className="font-heading text-lg">
                  Na het downloaden:
                </h3>
                <ol className="list-decimal list-inside text-sm text-brand-taupe space-y-1">
                  <li>
                    Ga naar{" "}
                    <a
                      href="https://admin.shopify.com/store/brow-atelier-ink/products"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-brand-gold underline"
                    >
                      Shopify Admin &gt; Products
                    </a>
                  </li>
                  <li>Klik op <strong>Import</strong></li>
                  <li>
                    Upload het bestand <strong>shopify-producten.csv</strong>
                  </li>
                  <li>Controleer de preview</li>
                  <li>
                    Klik op <strong>Import products</strong>
                  </li>
                  <li>
                    Klaar! De &quot;Koop nu&quot; knop op de website werkt nu
                    voor deze producten.
                  </li>
                </ol>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
