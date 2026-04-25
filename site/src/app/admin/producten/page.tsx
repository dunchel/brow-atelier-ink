"use client";

import { useState, useCallback } from "react";

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

const EMPTY_PRODUCT: Product = {
  naam: "",
  prijs: "",
  beschrijving: "",
  categorie: "Sieraden",
  foto: "",
  tags: "",
  beschikbaar: "Ja",
  oudePrijs: "",
};

const CATEGORIES = [
  "Sieraden",
  "Brow producten",
  "Lash producten",
  "PMU Aftercare",
  "Cadeaubonnen",
  "Overig",
];

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
    "Handle", "Title", "Body (HTML)", "Vendor", "Product Category", "Type",
    "Tags", "Published", "Option1 Name", "Option1 Value", "Variant SKU",
    "Variant Grams", "Variant Inventory Tracker", "Variant Inventory Qty",
    "Variant Inventory Policy", "Variant Fulfillment Service", "Variant Price",
    "Variant Compare At Price", "Variant Requires Shipping", "Variant Taxable",
    "Image Src", "Image Alt Text", "Status",
  ];
  const rows = products.map((p) => [
    slugify(p.naam), p.naam, `<p>${p.beschrijving}</p>`, "Brow Atelier & Ink",
    "", p.categorie, p.tags.replace(/;/g, ","),
    p.beschikbaar.toLowerCase() !== "nee" ? "TRUE" : "FALSE",
    "Title", "Default Title", "", "0", "shopify", "10", "deny", "manual",
    p.prijs, p.oudePrijs || "", "TRUE", "TRUE", p.foto, p.naam,
    p.beschikbaar.toLowerCase() !== "nee" ? "active" : "draft",
  ].map(escapeCSV));
  return [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
}

function toGoogleSheetRow(p: Product): string {
  return [p.naam, p.prijs, p.beschrijving, p.categorie, p.foto, p.tags, p.beschikbaar, p.oudePrijs]
    .map(escapeCSV).join(",");
}

export default function ProductenPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [current, setCurrent] = useState<Product>({ ...EMPTY_PRODUCT });
  const [uploading, setUploading] = useState(false);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);

  const handlePhotoUpload = useCallback(async (file: File) => {
    setUploading(true);
    setPhotoPreview(URL.createObjectURL(file));

    try {
      const formData = new FormData();
      formData.append("image", file);
      const res = await fetch(
        "https://api.imgbb.com/1/upload?key=7a9d2b4c8e1f3a5d7b9c0e2f4a6b8d0e",
        { method: "POST", body: formData }
      );
      if (res.ok) {
        const data = await res.json();
        const url = data.data?.display_url || data.data?.url || "";
        setCurrent((prev) => ({ ...prev, foto: url }));
      }
    } catch {
      // Upload failed, user can try again or paste URL manually
    }
    setUploading(false);
  }, []);

  const addProduct = () => {
    if (!current.naam || !current.prijs) return;
    setProducts((prev) => [...prev, { ...current }]);
    setCurrent({ ...EMPTY_PRODUCT });
    setPhotoPreview(null);
  };

  const removeProduct = (idx: number) => {
    setProducts((prev) => prev.filter((_, i) => i !== idx));
  };

  const downloadShopifyCSV = () => {
    const csv = toShopifyCSV(products);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "shopify-producten.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const copyForSheet = () => {
    const header = "Naam,Prijs,Beschrijving,Categorie,Foto,Tags,Beschikbaar,Oude prijs";
    const rows = products.map(toGoogleSheetRow);
    const csv = [header, ...rows].join("\n");
    navigator.clipboard.writeText(csv);
    alert("Gekopieerd! Plak dit in je Google Sheet (Ctrl+V of Cmd+V)");
  };

  return (
    <div className="min-h-screen bg-brand-light pt-32 px-6 pb-20">
      <div className="max-w-4xl mx-auto">
        <h1 className="font-heading text-3xl mb-2">Producten toevoegen</h1>
        <p className="text-brand-taupe mb-8">
          Voeg producten toe met foto, en exporteer naar Shopify of Google
          Sheet.
        </p>

        {/* Product form */}
        <div className="bg-white rounded-lg border border-brand-cream p-6 mb-8">
          <h2 className="font-heading text-xl mb-4">Nieuw product</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs uppercase tracking-widest text-brand-taupe block mb-1">
                Productnaam *
              </label>
              <input
                type="text"
                value={current.naam}
                onChange={(e) => setCurrent({ ...current, naam: e.target.value })}
                placeholder="Bijv. Gold Hoop Earrings"
                className="w-full px-4 py-3 bg-brand-light border border-brand-cream rounded focus:outline-none focus:border-brand-gold"
              />
            </div>
            <div>
              <label className="text-xs uppercase tracking-widest text-brand-taupe block mb-1">
                Prijs *
              </label>
              <input
                type="text"
                value={current.prijs}
                onChange={(e) => setCurrent({ ...current, prijs: e.target.value })}
                placeholder="24.95"
                className="w-full px-4 py-3 bg-brand-light border border-brand-cream rounded focus:outline-none focus:border-brand-gold"
              />
            </div>
            <div className="md:col-span-2">
              <label className="text-xs uppercase tracking-widest text-brand-taupe block mb-1">
                Beschrijving
              </label>
              <textarea
                value={current.beschrijving}
                onChange={(e) => setCurrent({ ...current, beschrijving: e.target.value })}
                placeholder="Korte beschrijving van het product..."
                rows={2}
                className="w-full px-4 py-3 bg-brand-light border border-brand-cream rounded focus:outline-none focus:border-brand-gold resize-none"
              />
            </div>
            <div>
              <label className="text-xs uppercase tracking-widest text-brand-taupe block mb-1">
                Categorie
              </label>
              <select
                value={current.categorie}
                onChange={(e) => setCurrent({ ...current, categorie: e.target.value })}
                className="w-full px-4 py-3 bg-brand-light border border-brand-cream rounded focus:outline-none focus:border-brand-gold"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs uppercase tracking-widest text-brand-taupe block mb-1">
                Oude prijs (optioneel, voor aanbiedingen)
              </label>
              <input
                type="text"
                value={current.oudePrijs}
                onChange={(e) => setCurrent({ ...current, oudePrijs: e.target.value })}
                placeholder="29.95"
                className="w-full px-4 py-3 bg-brand-light border border-brand-cream rounded focus:outline-none focus:border-brand-gold"
              />
            </div>
            <div>
              <label className="text-xs uppercase tracking-widest text-brand-taupe block mb-1">
                Tags (gescheiden door ;)
              </label>
              <input
                type="text"
                value={current.tags}
                onChange={(e) => setCurrent({ ...current, tags: e.target.value })}
                placeholder="sieraden; goud; oorbellen"
                className="w-full px-4 py-3 bg-brand-light border border-brand-cream rounded focus:outline-none focus:border-brand-gold"
              />
            </div>
            <div>
              <label className="text-xs uppercase tracking-widest text-brand-taupe block mb-1">
                Beschikbaar
              </label>
              <select
                value={current.beschikbaar}
                onChange={(e) => setCurrent({ ...current, beschikbaar: e.target.value })}
                className="w-full px-4 py-3 bg-brand-light border border-brand-cream rounded focus:outline-none focus:border-brand-gold"
              >
                <option value="Ja">Ja</option>
                <option value="Nee">Nee (uitverkocht)</option>
              </select>
            </div>

            {/* Photo upload */}
            <div className="md:col-span-2">
              <label className="text-xs uppercase tracking-widest text-brand-taupe block mb-1">
                Productfoto
              </label>
              <div className="flex gap-4 items-start">
                <div
                  onClick={() => {
                    const input = document.createElement("input");
                    input.type = "file";
                    input.accept = "image/*";
                    input.capture = "environment";
                    input.onchange = () => {
                      if (input.files?.[0]) handlePhotoUpload(input.files[0]);
                    };
                    input.click();
                  }}
                  className="w-24 h-24 border-2 border-dashed border-brand-cream rounded-lg flex items-center justify-center cursor-pointer hover:border-brand-gold transition-colors overflow-hidden flex-shrink-0"
                >
                  {photoPreview ? (
                    <img src={photoPreview} alt="Preview" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-2xl text-brand-taupe">+</span>
                  )}
                </div>
                <div className="flex-1">
                  <input
                    type="text"
                    value={current.foto}
                    onChange={(e) => setCurrent({ ...current, foto: e.target.value })}
                    placeholder="Foto-URL (wordt automatisch ingevuld na upload)"
                    className="w-full px-4 py-3 bg-brand-light border border-brand-cream rounded focus:outline-none focus:border-brand-gold text-sm"
                  />
                  {uploading && (
                    <p className="text-xs text-brand-gold mt-1">Uploading...</p>
                  )}
                  <p className="text-xs text-brand-taupe mt-1">
                    Klik op het vierkant om een foto te maken of te kiezen.
                    Of plak een URL.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <button
            onClick={addProduct}
            disabled={!current.naam || !current.prijs}
            className="btn-primary text-xs mt-6 disabled:opacity-50"
          >
            + Product toevoegen aan lijst
          </button>
        </div>

        {/* Product list */}
        {products.length > 0 && (
          <div className="bg-white rounded-lg border border-brand-cream p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-heading text-xl">
                {products.length} producten
              </h2>
              <div className="flex gap-3">
                <button onClick={copyForSheet} className="btn-outline text-xs">
                  Kopieer voor Sheet
                </button>
                <button onClick={downloadShopifyCSV} className="btn-primary text-xs">
                  Download Shopify CSV
                </button>
              </div>
            </div>

            <div className="space-y-3">
              {products.map((p, i) => (
                <div
                  key={i}
                  className="flex items-center gap-4 p-3 bg-brand-light rounded-lg"
                >
                  {p.foto ? (
                    <img
                      src={p.foto}
                      alt={p.naam}
                      className="w-12 h-12 object-cover rounded flex-shrink-0"
                    />
                  ) : (
                    <div className="w-12 h-12 bg-brand-cream rounded flex items-center justify-center flex-shrink-0">
                      <span className="text-xs text-brand-taupe">?</span>
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{p.naam}</p>
                    <p className="text-xs text-brand-taupe">
                      {p.categorie} &bull; &euro;{p.prijs}
                      {p.oudePrijs && (
                        <span className="line-through ml-1">
                          &euro;{p.oudePrijs}
                        </span>
                      )}
                    </p>
                  </div>
                  <button
                    onClick={() => removeProduct(i)}
                    className="text-xs text-red-400 hover:text-red-600"
                  >
                    Verwijder
                  </button>
                </div>
              ))}
            </div>

            <div className="mt-6 p-4 bg-brand-cream/50 rounded-lg space-y-2">
              <h3 className="font-heading text-base">Na het downloaden:</h3>
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
                <li>Upload <strong>shopify-producten.csv</strong></li>
                <li>Controleer de preview en klik <strong>Import products</strong></li>
              </ol>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
