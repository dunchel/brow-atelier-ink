"use client";

import { useCart } from "./CartProvider";
import Link from "next/link";
import { useEffect } from "react";

function formatPrice(amount: string, currencyCode = "EUR") {
  return new Intl.NumberFormat("nl-NL", {
    style: "currency",
    currency: currencyCode,
  }).format(parseFloat(amount));
}

export function CartDrawer() {
  const { cart, isOpen, closeCart, updateItem, removeItem, loading } = useCart();
  const lines = cart?.lines.edges.map((e) => e.node) ?? [];

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <>
      <div
        className="fixed inset-0 bg-black/40 z-[60] transition-opacity"
        onClick={closeCart}
      />
      <div className="fixed top-0 right-0 bottom-0 w-full max-w-md bg-white z-[70] shadow-2xl flex flex-col animate-slide-in">
        <div className="flex items-center justify-between px-6 py-5 border-b border-brand-cream">
          <h2 className="font-heading text-xl">Winkelwagen</h2>
          <button
            onClick={closeCart}
            className="text-brand-taupe hover:text-brand-dark transition-colors text-2xl leading-none"
            aria-label="Sluiten"
          >
            &times;
          </button>
        </div>

        {lines.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center px-6 text-center">
            <p className="text-brand-taupe mb-6">Je winkelwagen is leeg.</p>
            <button onClick={closeCart} className="btn-outline text-xs">
              Verder winkelen
            </button>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
              {lines.map((line) => {
                const img = line.merchandise.product.images.edges[0]?.node;
                return (
                  <div key={line.id} className="flex gap-4">
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
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {line.merchandise.product.title}
                      </p>
                      {line.merchandise.title !== "Default Title" && (
                        <p className="text-xs text-brand-taupe">{line.merchandise.title}</p>
                      )}
                      <p className="text-sm text-brand-gold font-medium mt-1">
                        {formatPrice(line.merchandise.price.amount, line.merchandise.price.currencyCode)}
                      </p>
                      <div className="flex items-center gap-1 mt-2">
                        <button
                          onClick={() => {
                            if (line.quantity <= 1) removeItem(line.id);
                            else updateItem(line.id, line.quantity - 1);
                          }}
                          disabled={loading}
                          className="w-7 h-7 flex items-center justify-center border border-brand-taupe/20 rounded-l text-xs hover:bg-brand-cream transition-colors disabled:opacity-50"
                        >
                          &minus;
                        </button>
                        <span className="w-8 h-7 flex items-center justify-center border-y border-brand-taupe/20 text-xs tabular-nums">
                          {line.quantity}
                        </span>
                        <button
                          onClick={() => updateItem(line.id, line.quantity + 1)}
                          disabled={loading}
                          className="w-7 h-7 flex items-center justify-center border border-brand-taupe/20 rounded-r text-xs hover:bg-brand-cream transition-colors disabled:opacity-50"
                        >
                          +
                        </button>
                        <button
                          onClick={() => removeItem(line.id)}
                          disabled={loading}
                          className="ml-auto text-xs text-brand-taupe hover:text-red-500 transition-colors disabled:opacity-50"
                        >
                          Verwijder
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="border-t border-brand-cream px-6 py-5 space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Subtotaal</span>
                <span className="font-heading text-lg text-brand-gold">
                  {cart?.cost.subtotalAmount
                    ? formatPrice(cart.cost.subtotalAmount.amount, cart.cost.subtotalAmount.currencyCode)
                    : "---"}
                </span>
              </div>
              <p className="text-xs text-brand-taupe">Verzendkosten worden berekend bij het afrekenen.</p>
              <a
                href={cart?.checkoutUrl}
                className="btn-primary text-xs w-full text-center block"
              >
                Afrekenen
              </a>
              <Link
                href="/cart"
                onClick={closeCart}
                className="block text-center text-xs text-brand-taupe hover:text-brand-gold transition-colors"
              >
                Bekijk volledige winkelwagen
              </Link>
            </div>
          </>
        )}
      </div>
    </>
  );
}
