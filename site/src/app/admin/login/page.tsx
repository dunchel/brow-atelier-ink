"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/admin/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "login", email, password }),
      });
      const data = await res.json();

      if (data.success) {
        router.push("/admin");
      } else {
        setError(data.error || "Inloggen mislukt");
      }
    } catch {
      setError("Kan geen verbinding maken met de server");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-brand-light flex items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="font-heading text-3xl mb-2">Admin</h1>
          <p className="text-brand-taupe text-sm">Brow Atelier & Ink</p>
        </div>

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
      </div>
    </div>
  );
}
