"use client";

import { useState } from "react";
import Link from "next/link";

export default function ResetPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/account", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "recover", email }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Er ging iets mis");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <section className="pt-32 pb-12 bg-brand-cream">
        <div className="max-w-4xl mx-auto text-center px-6">
          <p className="text-xs tracking-[0.3em] uppercase text-brand-gold mb-3">
            Brow Atelier &amp; Ink
          </p>
          <h1 className="font-heading text-4xl md:text-5xl mb-4">Wachtwoord vergeten</h1>
        </div>
      </section>

      <section className="section-padding bg-white">
        <div className="max-w-sm mx-auto">
          {sent ? (
            <div className="text-center space-y-4">
              <p className="text-brand-taupe">
                We hebben een e-mail gestuurd naar <strong>{email}</strong> met instructies om je wachtwoord te resetten.
              </p>
              <Link href="/account/login" className="btn-primary text-xs inline-block">
                Terug naar inloggen
              </Link>
            </div>
          ) : (
            <>
              <p className="text-brand-taupe text-sm mb-6 text-center">
                Vul je e-mailadres in en we sturen je een link om je wachtwoord te resetten.
              </p>
              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label htmlFor="email" className="block text-xs uppercase tracking-wider text-brand-taupe mb-2">
                    E-mailadres
                  </label>
                  <input
                    id="email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-3 border border-brand-taupe/20 rounded-md text-sm focus:outline-none focus:border-brand-gold transition-colors"
                  />
                </div>

                {error && <p className="text-sm text-red-500">{error}</p>}

                <button
                  type="submit"
                  disabled={loading}
                  className="btn-primary text-xs w-full text-center disabled:opacity-50"
                >
                  {loading ? "Moment..." : "Verstuur reset link"}
                </button>
              </form>

              <div className="mt-6 text-center">
                <Link href="/account/login" className="text-xs text-brand-taupe hover:text-brand-gold transition-colors">
                  &larr; Terug naar inloggen
                </Link>
              </div>
            </>
          )}
        </div>
      </section>
    </>
  );
}
