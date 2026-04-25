"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAccount } from "@/components/AccountProvider";

export default function RegisterPage() {
  const { register, loading } = useAccount();
  const router = useRouter();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      await register(email, password, firstName, lastName);
      router.push("/account");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registratie mislukt");
    }
  };

  return (
    <>
      <section className="pt-32 pb-12 bg-brand-cream">
        <div className="max-w-4xl mx-auto text-center px-6">
          <p className="text-xs tracking-[0.3em] uppercase text-brand-gold mb-3">
            Brow Atelier &amp; Ink
          </p>
          <h1 className="font-heading text-4xl md:text-5xl mb-4">Account aanmaken</h1>
        </div>
      </section>

      <section className="section-padding bg-white">
        <div className="max-w-sm mx-auto">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="firstName" className="block text-xs uppercase tracking-wider text-brand-taupe mb-2">
                  Voornaam
                </label>
                <input
                  id="firstName"
                  type="text"
                  required
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="w-full px-4 py-3 border border-brand-taupe/20 rounded-md text-sm focus:outline-none focus:border-brand-gold transition-colors"
                />
              </div>
              <div>
                <label htmlFor="lastName" className="block text-xs uppercase tracking-wider text-brand-taupe mb-2">
                  Achternaam
                </label>
                <input
                  id="lastName"
                  type="text"
                  required
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="w-full px-4 py-3 border border-brand-taupe/20 rounded-md text-sm focus:outline-none focus:border-brand-gold transition-colors"
                />
              </div>
            </div>
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
                minLength={5}
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
              {loading ? "Moment..." : "Registreren"}
            </button>
          </form>

          <div className="mt-8 text-center">
            <p className="text-sm text-brand-taupe">
              Al een account?{" "}
              <Link href="/account/login" className="text-brand-gold hover:underline">
                Inloggen
              </Link>
            </p>
          </div>
        </div>
      </section>
    </>
  );
}
