"use client";

import { useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";

export default function ResetPasswordPage() {
  const params = useParams();
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError("Wachtwoorden komen niet overeen.");
      return;
    }

    if (password.length < 5) {
      setError("Wachtwoord moet minimaal 5 tekens lang zijn.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/account", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "resetPassword",
          customerId: params.id,
          resetToken: params.token,
          password,
        }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setSuccess(true);
      setTimeout(() => router.push("/account/login"), 3000);
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
          <h1 className="font-heading text-4xl md:text-5xl mb-4">Nieuw wachtwoord</h1>
        </div>
      </section>

      <section className="section-padding bg-white">
        <div className="max-w-sm mx-auto">
          {success ? (
            <div className="text-center space-y-4">
              <p className="text-brand-taupe">
                Je wachtwoord is gewijzigd! Je wordt doorgestuurd naar de inlogpagina...
              </p>
              <Link href="/account/login" className="btn-primary text-xs inline-block">
                Inloggen
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label htmlFor="password" className="block text-xs uppercase tracking-wider text-brand-taupe mb-2">
                  Nieuw wachtwoord
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
              <div>
                <label htmlFor="confirmPassword" className="block text-xs uppercase tracking-wider text-brand-taupe mb-2">
                  Bevestig wachtwoord
                </label>
                <input
                  id="confirmPassword"
                  type="password"
                  required
                  minLength={5}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-4 py-3 border border-brand-taupe/20 rounded-md text-sm focus:outline-none focus:border-brand-gold transition-colors"
                />
              </div>

              {error && <p className="text-sm text-red-500">{error}</p>}

              <button
                type="submit"
                disabled={loading}
                className="btn-primary text-xs w-full text-center disabled:opacity-50"
              >
                {loading ? "Moment..." : "Wachtwoord wijzigen"}
              </button>
            </form>
          )}
        </div>
      </section>
    </>
  );
}
