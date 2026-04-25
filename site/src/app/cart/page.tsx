"use client";

import Link from "next/link";
import { useCart } from "@/components/CartProvider";

function formatPrice(amount: string, currencyCode = "EUR") {
  return new Intl.NumberFormat("nl-NL", {
    style: "currency",
    currency: currencyCode,
  }).format(parseFloat(amount));
}

export default function CartPage() {
  const { cart, loading, updateItem, removeItem } = useCart();
  const lines = cart?.lines.edges.map((e) => e.node) ?? [];

  return (
    <>
      <section className="pt-32 pb-12 bg-brand-cream">
        <div className="max-w-4xl mx-auto text-center px-6">
          <p className="text-xs tracking-[0.3em] uppercase text-brand-gold mb-3">
            Brow Atelier &amp; Ink
          </p>
          <h1 className="font-heading text-4xl md:text-6xl mb-4">Winkelwagen</h1>
        </div>
      </section>

      <section className="section-padding bg-white">
        <div className="max-w-4xl mx-auto">
          {lines.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-brand-taupe mb-6 text-lg">Je winkelwagen is leeg.</p>
              <Link href="/shop" className="btn-primary text-xs">
                Naar de shop
              </Link>
            </div>
          ) : (
            <>
              <div className="hidden md:grid grid-cols-[1fr_auto_auto_auto] gap-6 pb-4 border-b border-brand-cream text-xs uppercase tracking-wider text-brand-taupe">
                <span>Product</span>
                <span className="w-32 text-center">Aantal</span>
                <span className="w-24 text-right">Prijs</span>
                <span className="w-16" />
              </div>

              <div className="divide-y divide-brand-cream">
                {lines.map((line) => {
                  const img = line.merchandise.product.images.edges[0]?.node;
                  const lineTotal = (parseFloat(line.merchandise.price.amount) * line.quantity).toFixed(2);
                  return (
                    <div key={line.id} className="py-6 grid grid-cols-1 md:grid-cols-[1fr_auto_auto_auto] gap-4 md:gap-6 items-center">
                      <div className="flex gap-4">
                        <div className="w-20 h-20 bg-brand-cream rounded-md overflow-hidden flex-shrink-0">
                          {img ? (
                            <img
                              src={img.url}
                              alt={img.altText || line.merchandise.product.title}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-xs text-brand-taupe">
                              {line.merchandise.product.title}
                            </div>
                          )}
                        </div>
                        <div>
                          <Link
                            href={`/shop/${line.merchandise.product.handle}`}
                            className="text-sm font-medium hover:text-brand-gold transition-colors"
                          >
                            {line.merchandise.product.title}
                          </Link>
                          {line.merchandise.title !== "Default Title" && (
                            <p className="text-xs text-brand-taupe mt-1">{line.merchandise.title}</p>
                          )}
                          <p className="text-sm text-brand-taupe mt-1 md:hidden">
                            {formatPrice(line.merchandise.price.amount, line.merchandise.price.currencyCode)}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 w-32 justify-center">
                        <button
                          onClick={() => {
                            if (line.quantity <= 1) removeItem(line.id);
                            else updateItem(line.id, line.quantity - 1);
                          }}
                          disabled={loading}
                          className="w-8 h-8 flex items-center justify-center border border-brand-taupe/20 rounded-l-md text-sm hover:bg-brand-cream transition-colors disabled:opacity-50"
                        >
                          &minus;
                        </button>
                        <span className="w-10 h-8 flex items-center justify-center border-y border-brand-taupe/20 text-sm tabular-nums">
                          {line.quantity}
                        </span>
                        <button
                          onClick={() => updateItem(line.id, line.quantity + 1)}
                          disabled={loading}
                          className="w-8 h-8 flex items-center justify-center border border-brand-taupe/20 rounded-r-md text-sm hover:bg-brand-cream transition-colors disabled:opacity-50"
                        >
                          +
                        </button>
                      </div>

                      <span className="w-24 text-right text-sm font-medium hidden md:block">
                        {formatPrice(lineTotal, line.merchandise.price.currencyCode)}
                      </span>

                      <div className="w-16 text-right">
                        <button
                          onClick={() => removeItem(line.id)}
                          disabled={loading}
                          className="text-xs text-brand-taupe hover:text-red-500 transition-colors disabled:opacity-50"
                        >
                          Verwijder
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="mt-8 border-t border-brand-cream pt-8">
                <div className="flex flex-col items-end gap-4">
                  <div className="flex justify-between w-full max-w-xs">
                    <span className="text-sm">Subtotaal</span>
                    <span className="font-heading text-xl text-brand-gold">
                      {cart?.cost.subtotalAmount
                        ? formatPrice(cart.cost.subtotalAmount.amount, cart.cost.subtotalAmount.currencyCode)
                        : "---"}
                    </span>
                  </div>
                  <p className="text-xs text-brand-taupe">
                    Verzendkosten worden berekend bij het afrekenen.
                  </p>
                  <a href={cart?.checkoutUrl} className="btn-primary text-xs">
                    Afrekenen
                  </a>
                  <Link
                    href="/shop"
                    className="text-xs text-brand-taupe hover:text-brand-gold transition-colors"
                  >
                    &larr; Verder winkelen
                  </Link>
                </div>
              </div>
            </>
          )}
        </div>
      </section>
    </>
  );
}
