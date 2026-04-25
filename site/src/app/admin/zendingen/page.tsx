"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface Fulfillment {
  trackingInfo: { number: string; url: string; company: string }[];
  status: string;
  createdAt: string;
}

interface Order {
  id: string;
  name: string;
  createdAt: string;
  displayFulfillmentStatus: string;
  shippingAddress: {
    name: string;
    address1: string;
    city: string;
    zip: string;
    country: string;
  } | null;
  customer: { firstName: string; lastName: string; email: string } | null;
  fulfillments: Fulfillment[];
  lineItems: { edges: { node: { title: string; quantity: number } }[] };
}

const statusColors: Record<string, string> = {
  FULFILLED: "bg-green-100 text-green-800",
  UNFULFILLED: "bg-yellow-100 text-yellow-800",
  PARTIALLY_FULFILLED: "bg-blue-100 text-blue-800",
};

const statusLabels: Record<string, string> = {
  FULFILLED: "Verzonden",
  UNFULFILLED: "Onverzonden",
  PARTIALLY_FULFILLED: "Deels verzonden",
};

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("nl-NL", { day: "numeric", month: "short", year: "numeric" });
}

export default function ZendingenPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");

  useEffect(() => {
    setLoading(true);
    fetch(`/api/admin/fulfillments?status=${filter}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.error) setError(data.error);
        else setOrders(data.orders);
      })
      .catch(() => setError("Kan zendingen niet laden"))
      .finally(() => setLoading(false));
  }, [filter]);

  const filtered = search
    ? orders.filter(
        (o) =>
          o.name.toLowerCase().includes(search.toLowerCase()) ||
          (o.customer && `${o.customer.firstName} ${o.customer.lastName}`.toLowerCase().includes(search.toLowerCase()))
      )
    : orders;

  return (
    <div className="min-h-screen bg-brand-light pt-32 pb-20 px-6">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <Link href="/admin" className="text-xs text-brand-taupe hover:text-brand-gold transition-colors uppercase tracking-widest">
            &larr; Admin
          </Link>
          <h1 className="font-heading text-3xl mt-2">Zendingen</h1>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-8">
            <p className="text-red-700 text-sm">{error}</p>
            <p className="text-red-500 text-xs mt-2">
              Voeg <strong>read_orders</strong> en <strong>read_fulfillments</strong> scopes toe aan je Headless channel.
            </p>
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="flex gap-2">
            {[
              { value: "all", label: "Alles" },
              { value: "unfulfilled", label: "Onverzonden" },
              { value: "fulfilled", label: "Verzonden" },
            ].map((f) => (
              <button
                key={f.value}
                onClick={() => setFilter(f.value)}
                className={`px-4 py-2 text-xs uppercase tracking-wider rounded-full transition-colors ${
                  filter === f.value
                    ? "bg-brand-gold text-white"
                    : "bg-white border border-brand-cream text-brand-taupe hover:border-brand-gold"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
          <input
            type="text"
            placeholder="Zoek op bestelnummer of naam..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 px-4 py-2 border border-brand-cream rounded-md text-sm focus:outline-none focus:border-brand-gold transition-colors"
          />
        </div>

        {loading && <p className="text-brand-taupe">Laden...</p>}

        {!loading && filtered.length === 0 && !error && (
          <p className="text-brand-taupe text-center py-12">Geen zendingen gevonden.</p>
        )}

        {filtered.length > 0 && (
          <div className="space-y-4">
            {filtered.map((order) => {
              const tracking = order.fulfillments?.[0]?.trackingInfo?.[0];
              return (
                <div key={order.id} className="bg-white rounded-lg border border-brand-cream p-5">
                  <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
                    <div>
                      <div className="flex items-center gap-3">
                        <span className="font-medium">{order.name}</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${statusColors[order.displayFulfillmentStatus] || "bg-gray-100 text-gray-600"}`}>
                          {statusLabels[order.displayFulfillmentStatus] || order.displayFulfillmentStatus}
                        </span>
                      </div>
                      <p className="text-xs text-brand-taupe mt-1">{formatDate(order.createdAt)}</p>
                    </div>
                    {tracking?.url && (
                      <a
                        href={tracking.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn-outline text-xs"
                      >
                        Track & Trace &rarr;
                      </a>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
                    <div>
                      <p className="text-xs text-brand-taupe uppercase tracking-wider mb-1">Klant</p>
                      <p>{order.customer ? `${order.customer.firstName} ${order.customer.lastName}` : "Gast"}</p>
                      {order.customer?.email && (
                        <p className="text-xs text-brand-taupe">{order.customer.email}</p>
                      )}
                    </div>
                    <div>
                      <p className="text-xs text-brand-taupe uppercase tracking-wider mb-1">Adres</p>
                      {order.shippingAddress ? (
                        <>
                          <p>{order.shippingAddress.name}</p>
                          <p className="text-xs text-brand-taupe">
                            {order.shippingAddress.address1}, {order.shippingAddress.zip} {order.shippingAddress.city}
                          </p>
                        </>
                      ) : (
                        <p className="text-brand-taupe">Geen verzendadres</p>
                      )}
                    </div>
                    <div>
                      <p className="text-xs text-brand-taupe uppercase tracking-wider mb-1">Producten</p>
                      {order.lineItems.edges.map((li, i) => (
                        <p key={i} className="text-xs">{li.node.quantity}x {li.node.title}</p>
                      ))}
                    </div>
                  </div>

                  {tracking?.number && (
                    <div className="mt-3 pt-3 border-t border-brand-cream">
                      <p className="text-xs text-brand-taupe">
                        Tracking: <span className="font-medium text-brand-dark">{tracking.number}</span>
                        {tracking.company && ` (${tracking.company})`}
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
