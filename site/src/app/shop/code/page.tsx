"use client";

import { Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { PosWorkstation } from "@/components/PosWorkstation";

function CodeLookupContent() {
  const searchParams = useSearchParams();
  const fromUrl = searchParams.get("code");

  return (
    <>
      <section className="pt-24 pb-8 bg-brand-cream">
        <div className="max-w-lg mx-auto text-center px-4">
          <Link
            href="/shop"
            className="text-xs uppercase tracking-widest text-brand-taupe hover:text-brand-gold transition-colors"
          >
            &larr; Shop
          </Link>
          <h1 className="font-heading text-2xl md:text-3xl mt-3 mb-2">
            Verkoop via telefoon
          </h1>
          <p className="text-brand-taupe text-sm">
            Product scannen of behandeling aantikken. Alles op één bon — één keer
            pinnen.
          </p>
        </div>
      </section>

      <section className="pb-16 px-4">
        <div className="max-w-lg mx-auto">
          <PosWorkstation autofocus={!fromUrl} initialCode={fromUrl || undefined} />
        </div>
      </section>
    </>
  );
}

export default function CodeLookupPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-brand-light pt-24 flex items-center justify-center">
          <p className="text-brand-taupe">Laden...</p>
        </div>
      }
    >
      <CodeLookupContent />
    </Suspense>
  );
}
