"use client";

import Link from "next/link";

export default function AdminPage() {
  return (
    <div className="min-h-screen bg-brand-light pt-32 px-6">
      <div className="max-w-2xl mx-auto">
        <h1 className="font-heading text-3xl mb-2">Admin Panel</h1>
        <p className="text-brand-taupe mb-8">
          Tools voor het beheren van producten en de webshop.
        </p>

        <div className="space-y-4">
          <Link
            href="/admin/producten"
            className="block p-6 bg-white rounded-lg border border-brand-cream hover:border-brand-gold transition-colors"
          >
            <h2 className="font-heading text-xl mb-1">Producten beheren</h2>
            <p className="text-sm text-brand-taupe">
              Voeg producten toe, upload foto&apos;s, en sync naar Shopify. Alles
              in een pagina.
            </p>
          </Link>

          <Link
            href="/admin/upload"
            className="block p-6 bg-white rounded-lg border border-brand-cream hover:border-brand-gold transition-colors"
          >
            <h2 className="font-heading text-xl mb-1">Foto&apos;s uploaden</h2>
            <p className="text-sm text-brand-taupe">
              Upload productfoto&apos;s en krijg een link om in de Sheet te
              plakken.
            </p>
          </Link>

          <Link
            href="/admin/sync"
            className="block p-6 bg-white rounded-lg border border-brand-cream hover:border-brand-gold transition-colors"
          >
            <h2 className="font-heading text-xl mb-1">
              Sync naar Shopify
            </h2>
            <p className="text-sm text-brand-taupe">
              Download een Shopify-klare CSV vanuit de Google Sheet.
            </p>
          </Link>

          <a
            href="https://admin.shopify.com/store/brow-atelier-ink/products"
            target="_blank"
            rel="noopener noreferrer"
            className="block p-6 bg-white rounded-lg border border-brand-cream hover:border-brand-gold transition-colors"
          >
            <h2 className="font-heading text-xl mb-1">
              Shopify Dashboard &rarr;
            </h2>
            <p className="text-sm text-brand-taupe">
              Bestellingen bekijken, producten beheren in Shopify.
            </p>
          </a>
        </div>
      </div>
    </div>
  );
}
