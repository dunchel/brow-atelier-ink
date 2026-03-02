import type { Metadata } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { LocalBusinessJsonLd } from "@/components/JsonLd";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
});

export const metadata: Metadata = {
  title: {
    default: "Brow Atelier & Ink | Brows, Lashes & Beauty in Helmond",
    template: "%s | Brow Atelier & Ink",
  },
  description:
    "Het gezelligste brow & lash atelier van Helmond. Powder brows, lash lift, faux freckles, lip blush en meer. Plan vandaag nog je brow date!",
  keywords: [
    "wenkbrauwen Helmond",
    "powder brows",
    "lash lift",
    "brow lamination",
    "faux freckles",
    "lip blush",
    "brow atelier",
    "beauty salon Helmond",
  ],
  openGraph: {
    type: "website",
    locale: "nl_NL",
    siteName: "Brow Atelier & Ink",
    title: "Brow Atelier & Ink | Brows, Lashes & Beauty in Helmond",
    description:
      "Het gezelligste brow & lash atelier van Helmond. Plan vandaag nog je brow date!",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="nl" className={`${inter.variable} ${playfair.variable}`}>
      <body className="font-body">
        <LocalBusinessJsonLd />
        <Header />
        <main className="min-h-screen">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
