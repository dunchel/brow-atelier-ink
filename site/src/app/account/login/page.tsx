"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAccount } from "@/components/AccountProvider";

export default function LoginPage() {
  const { login, loading } = useAccount();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      await login(email, password);
      router.push("/account");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Inloggen mislukt");
    }
  };

  return (
    <>
      <section className="pt-32 pb-12 bg-brand-cream">
        <div className="max-w-4xl mx-auto text-center px-6">
          <p className="text-xs tracking-[0.3em] uppercase text-brand-gold mb-3">
            Brow Atelier &amp; Ink
          </p>
          <h1 className="font-heading text-4xl md:text-5xl mb-4">Inloggen</h1>
        </div>
      </section>

      <section className="section-padding bg-white">
        <div className="max-w-sm mx-auto">
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
            <div>
              <label htmlFor="password" className="block text-xs uppercase tracking-wider text-brand-taupe mb-2">
                Wachtwoord
              </label>
              <input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 border border-brand-taupe/20 rounded-md text-sm focus:outline-none focus:border-brand-gold transition-colors"
              />
            </div>

            {error && <p className="text-sm text-red-500">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="btn-primary text-xs w-full text-center disabled:opacity-50"
            >
              {loading ? "Moment..." : "Inloggen"}
            </button>
          </form>

          <div className="mt-8 text-center space-y-3">
            <Link href="/account/reset" className="text-xs text-brand-taupe hover:text-brand-gold transition-colors block">
              Wachtwoord vergeten?
            </Link>
            <p className="text-sm text-brand-taupe">
              Nog geen account?{" "}
              <Link href="/account/register" className="text-brand-gold hover:underline">
                Registreer
              </Link>
            </p>
          </div>
        </div>
      </section>
    </>
  );
}
