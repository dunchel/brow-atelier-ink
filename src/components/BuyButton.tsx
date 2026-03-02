"use client";

import { useState } from "react";

export function BuyButton({ productTitle }: { productTitle: string }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleBuy = async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productTitle }),
      });

      const data = await res.json();

      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
      } else if (data.whatsapp) {
        setError("Dit product is nog niet online te bestellen.");
        setTimeout(() => {
          window.open(data.whatsapp, "_blank");
        }, 1500);
      } else {
        setError(data.error || "Er ging iets mis.");
      }
    } catch {
      setError("Er ging iets mis. Probeer het opnieuw.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <button
        onClick={handleBuy}
        disabled={loading}
        className="btn-primary text-xs disabled:opacity-50"
      >
        {loading ? "Moment..." : "Koop nu"}
      </button>
      {error && <p className="text-sm text-red-500 mt-2">{error}</p>}
    </div>
  );
}
