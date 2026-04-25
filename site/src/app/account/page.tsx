"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAccount } from "@/components/AccountProvider";
import type { CustomerInfo } from "@/lib/customer";

function formatPrice(amount: string, currencyCode = "EUR") {
  return new Intl.NumberFormat("nl-NL", {
    style: "currency",
    currency: currencyCode,
  }).format(parseFloat(amount));
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("nl-NL", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

const statusMap: Record<string, string> = {
  UNFULFILLED: "In behandeling",
  FULFILLED: "Verzonden",
  PARTIALLY_FULFILLED: "Deels verzonden",
};

const statusBadgeColors: Record<string, string> = {
  UNFULFILLED: "bg-yellow-100 text-yellow-800",
  FULFILLED: "bg-green-100 text-green-800",
  PARTIALLY_FULFILLED: "bg-blue-100 text-blue-800",
};

export default function AccountPage() {
  const { customer, accessToken, logout, loading: authLoading } = useAccount();
  const router = useRouter();
  const [fullCustomer, setFullCustomer] = useState<CustomerInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!accessToken && !authLoading) {
      router.push("/account/login");
      return;
    }
    if (!accessToken) return;

    fetch(`/api/account?action=me&token=${encodeURIComponent(accessToken)}`)
      .then((res) => res.json())
      .then(({ customer: c }) => {
        if (c) setFullCustomer(c);
        else router.push("/account/login");
      })
      .catch(() => router.push("/account/login"))
      .finally(() => setLoading(false));
  }, [accessToken, authLoading, router]);

  if (loading || authLoading) {
    return (
      <div className="pt-40 pb-20 text-center">
        <p className="text-brand-taupe">Laden...</p>
      </div>
    );
  }

  if (!customer || !fullCustomer) return null;

  const orders = fullCustomer.orders.edges.map((e) => e.node);
  const addresses = fullCustomer.addresses.edges.map((e) => e.node);

  return (
    <>
      <section className="pt-32 pb-12 bg-brand-cream">
        <div className="max-w-4xl mx-auto text-center px-6">
          <p className="text-xs tracking-[0.3em] uppercase text-brand-gold mb-3">
            Brow Atelier &amp; Ink
          </p>
          <h1 className="font-heading text-4xl md:text-5xl mb-4">
            Welkom, {customer.firstName}
          </h1>
          <button
            onClick={() => { logout(); router.push("/"); }}
            className="text-xs text-brand-taupe hover:text-brand-gold transition-colors uppercase tracking-wider"
          >
            Uitloggen
          </button>
        </div>
      </section>

      <section className="section-padding bg-white">
        <div className="max-w-4xl mx-auto space-y-16">
          <div>
            <h2 className="font-heading text-2xl mb-6">Bestellingen</h2>
            {orders.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-brand-taupe mb-4">Je hebt nog geen bestellingen.</p>
                <Link href="/shop" className="btn-primary text-xs">
                  Naar de shop
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {orders.map((order) => (
                  <div
                    key={order.id}
                    className="border border-brand-cream rounded-lg p-5"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
                      <div>
                        <span className="font-medium text-sm">
                          Bestelling #{order.orderNumber}
                        </span>
                        <span className="text-xs text-brand-taupe ml-3">
                          {formatDate(order.processedAt)}
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className={`text-xs px-3 py-1 rounded-full ${statusBadgeColors[order.fulfillmentStatus] ?? "bg-brand-cream text-brand-taupe"}`}>
                          {statusMap[order.fulfillmentStatus] ?? order.fulfillmentStatus}
                        </span>
                        <span className="text-sm font-medium text-brand-gold">
                          {formatPrice(order.totalPrice.amount, order.totalPrice.currencyCode)}
                        </span>
                      </div>
                    </div>
                    <div className="text-xs text-brand-taupe space-y-1">
                      {order.lineItems.edges.map((li, i) => (
                        <p key={i}>
                          {li.node.quantity}x {li.node.title}
                        </p>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div>
            <h2 className="font-heading text-2xl mb-6">Adressen</h2>
            {addresses.length === 0 ? (
              <p className="text-brand-taupe text-sm">
                Geen opgeslagen adressen. Je adres wordt opgeslagen bij je eerste bestelling.
              </p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {addresses.map((addr) => (
                  <div
                    key={addr.id}
                    className="border border-brand-cream rounded-lg p-5 text-sm"
                  >
                    <p>{addr.address1}</p>
                    <p>{addr.zip} {addr.city}</p>
                    <p className="text-brand-taupe">{addr.country}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div>
            <h2 className="font-heading text-2xl mb-6">Accountgegevens</h2>
            <div className="border border-brand-cream rounded-lg p-5 text-sm space-y-2">
              <p><span className="text-brand-taupe">Naam:</span> {fullCustomer.firstName} {fullCustomer.lastName}</p>
              <p><span className="text-brand-taupe">E-mail:</span> {fullCustomer.email}</p>
              {fullCustomer.phone && (
                <p><span className="text-brand-taupe">Telefoon:</span> {fullCustomer.phone}</p>
              )}
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
