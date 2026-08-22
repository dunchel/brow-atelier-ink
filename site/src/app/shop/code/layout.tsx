import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Verkoop via telefoon | Shop",
  description:
    "Zoek product of tik een behandeling aan. Eén bon, één keer pinnen — Brow Atelier & Ink.",
};

export default function CodeLookupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
