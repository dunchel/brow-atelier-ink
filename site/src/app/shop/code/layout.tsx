import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Verkoop via telefoon | Shop",
  description:
    "Zoek product op code, toon QR voor POS-scan en bereken korting — Brow Atelier & Ink.",
};

export default function CodeLookupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
