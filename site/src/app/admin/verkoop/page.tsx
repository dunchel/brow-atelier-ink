"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface Order {
  id: string;
  name: string;
  createdAt: string;
  displayFinancialStatus: string;
  displayFulfillmentStatus: string;
  totalPriceSet: { shopMoney: { amount: string; currencyCode: string } };
  customer: { firstName: string; lastName: string; email: string } | null;
  lineItems: { edges: { node: { title: string; quantity: number } }[] };
}

interface Stats {
  today: { count: number; total: number };
  week: { count: number; total: number };
  month: { count: number; total: number };
  allTime: { count: number; total: number };
}

interface CategorySplit {
  producten: number;
  behandelingen: number;
  countProducten: number;
  countBehandelingen: number;
}

interface CategoryStats {
  today: CategorySplit;
  week: CategorySplit;
  month: CategorySplit;
  allTime: CategorySplit;
}

function formatPrice(amount: number) {
  return new Intl.NumberFormat("nl-NL", { style: "currency", currency: "EUR" }).format(amount);
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("nl-NL", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
}

const statusColors: Record<string, string> = {
  PAID: "bg-green-100 text-green-800",
  PENDING: "bg-yellow-100 text-yellow-800",
  REFUNDED: "bg-red-100 text-red-800",
  PARTIALLY_REFUNDED: "bg-orange-100 text-orange-800",
  FULFILLED: "bg-green-100 text-green-800",
  UNFULFILLED: "bg-yellow-100 text-yellow-800",
  PARTIALLY_FULFILLED: "bg-blue-100 text-blue-800",
};

const statusLabels: Record<string, string> = {
  PAID: "Betaald",
  PENDING: "In afwachting",
  REFUNDED: "Terugbetaald",
  PARTIALLY_REFUNDED: "Deels terugbetaald",
  FULFILLED: "Verzonden",
  UNFULFILLED: "Onverzonden",
  PARTIALLY_FULFILLED: "Deels verzonden",
};

export default function VerkoopPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [categoryStats, setCategoryStats] = useState<CategoryStats | null>(null);
  const [monthByType, setMonthByType] = useState<{ label: string; total: number }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/admin/orders")
      .then((r) => r.json())
      .then((data) => {
        if (data.error) setError(data.error);
        else {
          setOrders(data.orders);
          setStats(data.stats);
          setCategoryStats(data.categoryStats || null);
          setMonthByType(data.monthByType || []);
        }
      })
      .catch(() => setError("Kan bestellingen niet laden"))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-brand-light pt-32 pb-20 px-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <Link href="/admin" className="text-xs text-brand-taupe hover:text-brand-gold transition-colors uppercase tracking-widest">
              &larr; Admin
            </Link>
            <h1 className="font-heading text-3xl mt-2">Verkoop Dashboard</h1>
          </div>
        </div>

        {loading && <p className="text-brand-taupe">Laden...</p>}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-8">
            <p className="text-red-700 text-sm">{error}</p>
            <p className="text-red-500 text-xs mt-2">
              Ga naar Shopify Admin &gt; Headless channel &gt; Storefront &gt; voeg <strong>read_orders</strong> scope toe.
            </p>
          </div>
        )}

        {stats && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {[
              { label: "Vandaag", ...stats.today },
              { label: "Deze week", ...stats.week },
              { label: "Deze maand", ...stats.month },
              { label: "Totaal", ...stats.allTime },
            ].map((s) => (
              <div key={s.label} className="bg-white rounded-lg border border-brand-cream p-5">
                <p className="text-xs text-brand-taupe uppercase tracking-wider mb-1">{s.label}</p>
                <p className="font-heading text-2xl text-brand-gold">{formatPrice(s.total)}</p>
                <p className="text-xs text-brand-taupe mt-1">{s.count} bestelling{s.count !== 1 ? "en" : ""}</p>
              </div>
            ))}
          </div>
        )}

        {categoryStats && (
          <div className="grid md:grid-cols-2 gap-4 mb-6">
            <div className="bg-white rounded-lg border border-brand-cream p-5">
              <p className="text-xs uppercase tracking-widest text-brand-taupe mb-3">
                Deze maand — producten vs behandelingen
              </p>
              <div className="space-y-3">
                <div className="flex justify-between items-baseline">
                  <span className="text-sm">Producten</span>
                  <span className="font-heading text-xl text-brand-gold">
                    {formatPrice(categoryStats.month.producten)}
                  </span>
                </div>
                <div className="flex justify-between items-baseline">
                  <span className="text-sm">Behandelingen</span>
                  <span className="font-heading text-xl text-brand-gold">
                    {formatPrice(categoryStats.month.behandelingen)}
                  </span>
                </div>
                <p className="text-xs text-brand-taupe">
                  {categoryStats.month.countProducten} productregels ·{" "}
                  {categoryStats.month.countBehandelingen} behandelregels
                </p>
              </div>
            </div>
            <div className="bg-white rounded-lg border border-brand-cream p-5">
              <p className="text-xs uppercase tracking-widest text-brand-taupe mb-3">
                Vandaag
              </p>
              <div className="space-y-3">
                <div className="flex justify-between items-baseline">
                  <span className="text-sm">Producten</span>
                  <span className="font-heading text-xl">
                    {formatPrice(categoryStats.today.producten)}
                  </span>
                </div>
                <div className="flex justify-between items-baseline">
                  <span className="text-sm">Behandelingen</span>
                  <span className="font-heading text-xl">
                    {formatPrice(categoryStats.today.behandelingen)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {monthByType.length > 0 && (
          <div className="bg-white rounded-lg border border-brand-cream p-5 mb-10">
            <p className="text-xs uppercase tracking-widest text-brand-taupe mb-3">
              Omzet deze maand per type
            </p>
            <div className="space-y-2">
              {monthByType.map((row) => (
                <div key={row.label} className="flex justify-between text-sm">
                  <span>{row.label}</span>
                  <span className="font-medium">{formatPrice(row.total)}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {orders.length > 0 && (
          <div className="bg-white rounded-lg border border-brand-cream overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-brand-cream text-left">
                    <th className="px-4 py-3 text-xs uppercase tracking-wider text-brand-taupe font-medium">Bestelling</th>
                    <th className="px-4 py-3 text-xs uppercase tracking-wider text-brand-taupe font-medium">Datum</th>
                    <th className="px-4 py-3 text-xs uppercase tracking-wider text-brand-taupe font-medium">Klant</th>
                    <th className="px-4 py-3 text-xs uppercase tracking-wider text-brand-taupe font-medium">Producten</th>
                    <th className="px-4 py-3 text-xs uppercase tracking-wider text-brand-taupe font-medium">Betaling</th>
                    <th className="px-4 py-3 text-xs uppercase tracking-wider text-brand-taupe font-medium">Verzending</th>
                    <th className="px-4 py-3 text-xs uppercase tracking-wider text-brand-taupe font-medium text-right">Bedrag</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-brand-cream">
                  {orders.map((order) => (
                    <tr key={order.id} className="hover:bg-brand-light/50">
                      <td className="px-4 py-3 font-medium">{order.name}</td>
                      <td className="px-4 py-3 text-brand-taupe">{formatDate(order.createdAt)}</td>
                      <td className="px-4 py-3">
                        {order.customer
                          ? `${order.customer.firstName} ${order.customer.lastName}`
                          : "Gast"}
                      </td>
                      <td className="px-4 py-3 text-brand-taupe">
                        {order.lineItems.edges.map((li, i) => (
                          <span key={i}>{li.node.quantity}x {li.node.title}{i < order.lineItems.edges.length - 1 ? ", " : ""}</span>
                        ))}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2 py-0.5 rounded-full ${statusColors[order.displayFinancialStatus] || "bg-gray-100 text-gray-600"}`}>
                          {statusLabels[order.displayFinancialStatus] || order.displayFinancialStatus}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2 py-0.5 rounded-full ${statusColors[order.displayFulfillmentStatus] || "bg-gray-100 text-gray-600"}`}>
                          {statusLabels[order.displayFulfillmentStatus] || order.displayFulfillmentStatus}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right font-medium">
                        {formatPrice(parseFloat(order.totalPriceSet.shopMoney.amount))}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
