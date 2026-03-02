"use client";

import Link from "next/link";
import { useState } from "react";

const MEETAIMY_URL =
  "https://widget2.meetaimy.com/widgetWeb?salonId=NDMxNjUwNQ%3D%3D&salonEmail=YW50aWxib3JnbGluZGFAZ21haWwuY29t";

const navLinks = [
  { href: "/", label: "Home" },
  { href: "/diensten", label: "Diensten" },
  { href: "/wenkbrauwen", label: "Brows" },
  { href: "/lashes", label: "Lashes" },
  { href: "/shop", label: "Shop" },
  { href: "/contact", label: "Contact" },
];

export function Header() {
  const [open, setOpen] = useState(false);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-brand-light/95 backdrop-blur-sm border-b border-brand-cream">
      <div className="max-w-7xl mx-auto flex items-center justify-between px-6 py-4">
        <Link href="/" className="flex flex-col items-center">
          <span className="font-heading text-xl md:text-2xl tracking-wider text-brand-dark">
            BROW ATELIER & INK
          </span>
          <span className="text-[10px] tracking-[0.3em] text-brand-taupe uppercase">
            Jewelry &bull; Beauty &bull; Piercings &bull; Ink
          </span>
        </Link>

        <nav className="hidden lg:flex items-center gap-8">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-xs uppercase tracking-widest text-brand-dark hover:text-brand-gold transition-colors"
            >
              {link.label}
            </Link>
          ))}
          <a
            href={MEETAIMY_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-primary text-xs"
          >
            Afspraak maken
          </a>
        </nav>

        <button
          onClick={() => setOpen(!open)}
          className="lg:hidden flex flex-col gap-1.5 p-2"
          aria-label="Menu openen"
        >
          <span
            className={`block w-6 h-0.5 bg-brand-dark transition-transform ${
              open ? "rotate-45 translate-y-2" : ""
            }`}
          />
          <span
            className={`block w-6 h-0.5 bg-brand-dark transition-opacity ${
              open ? "opacity-0" : ""
            }`}
          />
          <span
            className={`block w-6 h-0.5 bg-brand-dark transition-transform ${
              open ? "-rotate-45 -translate-y-2" : ""
            }`}
          />
        </button>
      </div>

      {open && (
        <div className="lg:hidden bg-brand-light border-t border-brand-cream">
          <nav className="flex flex-col px-6 py-6 gap-4">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className="text-sm uppercase tracking-widest text-brand-dark hover:text-brand-gold transition-colors"
              >
                {link.label}
              </Link>
            ))}
            <a
              href={MEETAIMY_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-primary text-center text-xs mt-2"
            >
              Afspraak maken
            </a>
          </nav>
        </div>
      )}
    </header>
  );
}
