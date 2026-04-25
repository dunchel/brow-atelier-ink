"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

export default function AdminPage() {
  const router = useRouter();

  const handleLogout = async () => {
    await fetch("/api/admin/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "logout" }),
    });
    router.push("/admin/login");
  };

  return (
    <div className="min-h-screen bg-brand-light pt-32 px-6">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-2">
          <h1 className="font-heading text-3xl">Admin Panel</h1>
          <button
            onClick={handleLogout}
            className="text-xs text-brand-taupe hover:text-brand-gold transition-colors uppercase tracking-widest"
          >
            Uitloggen
          </button>
        </div>
        <p className="text-brand-taupe mb-8">
          Tools voor het beheren van producten en de webshop.
        </p>

        <div className="space-y-4">
          <Link
            href="/admin/verkoop"
            className="block p-6 bg-white rounded-lg border border-brand-cream hover:border-brand-gold transition-colors"
          >
            <h2 className="font-heading text-xl mb-1">Verkoop Dashboard</h2>
            <p className="text-sm text-brand-taupe">
              Omzet, bestellingen en statistieken in een overzicht.
            </p>
          </Link>

          <Link
            href="/admin/zendingen"
            className="block p-6 bg-white rounded-lg border border-brand-cream hover:border-brand-gold transition-colors"
          >
            <h2 className="font-heading text-xl mb-1">Zendingen</h2>
            <p className="text-sm text-brand-taupe">
              Verzendstatus, tracking en adresgegevens van alle bestellingen.
            </p>
          </Link>

          <Link
            href="/admin/producten"
            className="block p-6 bg-white rounded-lg border border-brand-cream hover:border-brand-gold transition-colors"
          >
            <h2 className="font-heading text-xl mb-1">Producten beheren</h2>
            <p className="text-sm text-brand-taupe">
              Voeg producten toe, upload foto&apos;s, en sync naar Shopify.
            </p>
          </Link>

          <Link
            href="/admin/upload"
            className="block p-6 bg-white rounded-lg border border-brand-cream hover:border-brand-gold transition-colors"
          >
            <h2 className="font-heading text-xl mb-1">Foto&apos;s uploaden</h2>
            <p className="text-sm text-brand-taupe">
              Upload productfoto&apos;s en krijg een link voor de Google Sheet.
            </p>
          </Link>

          <Link
            href="/admin/labels"
            className="block p-6 bg-white rounded-lg border border-brand-cream hover:border-brand-gold transition-colors"
          >
            <h2 className="font-heading text-xl mb-1">Product Labels</h2>
            <p className="text-sm text-brand-taupe">
              Brother QL-1100C, rol DK-22205 (62 mm, 22205/205). Selecteer
              producten en print.
            </p>
          </Link>

          <Link
            href="/admin/sync-shopify"
            className="block p-6 bg-white rounded-lg border border-brand-cream hover:border-brand-gold transition-colors"
          >
            <h2 className="font-heading text-xl mb-1">Sync naar Shopify</h2>
            <p className="text-sm text-brand-taupe">
              Synchroniseer alle Sheet-producten naar Shopify voor checkout en Instagram.
            </p>
          </Link>

          <a
            href="https://admin.shopify.com/store/brow-atelier-ink"
            target="_blank"
            rel="noopener noreferrer"
            className="block p-6 bg-white rounded-lg border border-brand-cream hover:border-brand-gold transition-colors"
          >
            <h2 className="font-heading text-xl mb-1">
              Shopify Admin &rarr;
            </h2>
            <p className="text-sm text-brand-taupe">
              Directe toegang tot je Shopify winkel-admin.
            </p>
          </a>
        </div>
      </div>
    </div>
  );
}
