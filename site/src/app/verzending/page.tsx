import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Verzending & bezorging",
  description:
    "Verzendkosten van Brow Atelier & Ink: € 7,50 tot en met € 69,99, gratis verzending vanaf € 70 en gratis ophalen in de winkel in Helmond.",
};

export default function VerzendingPage() {
  return (
    <>
      <section className="pt-32 pb-12 bg-brand-cream">
        <div className="max-w-4xl mx-auto text-center px-6">
          <p className="text-xs tracking-[0.3em] uppercase text-brand-gold mb-3">
            Brow Atelier &amp; Ink
          </p>
          <h1 className="font-heading text-4xl md:text-6xl mb-4">
            Verzending &amp; bezorging
          </h1>
          <p className="text-brand-taupe max-w-2xl mx-auto">
            We pakken je sieraden met zorg in en sturen ze naar je toe. Of haal
            je bestelling gratis op in onze winkel in Helmond.
          </p>
        </div>
      </section>

      <section className="section-padding bg-white">
        <div className="max-w-3xl mx-auto space-y-12">
          <div>
            <h2 className="font-heading text-2xl mb-6">Verzendkosten</h2>
            <div className="border border-brand-cream rounded-lg overflow-hidden">
              <div className="flex items-center justify-between gap-4 px-5 py-4 border-b border-brand-cream">
                <span className="text-brand-dark">
                  Bestellingen tot en met € 69,99
                </span>
                <span className="font-heading text-lg text-brand-dark whitespace-nowrap">
                  € 7,50
                </span>
              </div>
              <div className="flex items-center justify-between gap-4 px-5 py-4 border-b border-brand-cream bg-brand-light">
                <span className="text-brand-dark">
                  Bestellingen vanaf € 70
                </span>
                <span className="font-heading text-lg text-brand-gold whitespace-nowrap">
                  Gratis
                </span>
              </div>
              <div className="flex items-center justify-between gap-4 px-5 py-4">
                <span className="text-brand-dark">Ophalen in de winkel</span>
                <span className="font-heading text-lg text-brand-gold whitespace-nowrap">
                  Gratis
                </span>
              </div>
            </div>
            <p className="text-sm text-brand-taupe mt-4">
              De verzendkosten zie je ook nog een keer terug bij het afrekenen,
              voordat je je bestelling definitief maakt.
            </p>
          </div>

          <div>
            <h2 className="font-heading text-2xl mb-4">Zo komt je pakket aan</h2>
            <div className="space-y-3 text-brand-taupe leading-relaxed">
              <p>
                Wij verzenden je pakket via PostNL. We doen ons best om je
                bestelling zo snel mogelijk klaar te maken; is iets onverwacht
                niet op voorraad, dan laten we je dat weten.
              </p>
              <p>
                De verzendkosten hierboven gelden voor bezorging in Nederland.
                Moet je pakket naar een adres in het buitenland? Neem dan even{" "}
                <Link
                  href="/contact"
                  className="text-brand-dark underline hover:text-brand-gold transition-colors"
                >
                  contact
                </Link>{" "}
                met ons op, dan kijken we wat de verzendkosten worden.
              </p>
            </div>
          </div>

          <div className="bg-brand-cream rounded-lg p-6">
            <h2 className="font-heading text-xl mb-3">
              Gratis ophalen in de winkel
            </h2>
            <p className="text-brand-taupe leading-relaxed mb-4">
              Wil je je bestelling zelf ophalen? Dat kan en is altijd gratis. Je
              haalt je bestelling op bij ons atelier:
            </p>
            <address className="not-italic text-brand-taupe space-y-1">
              <p>Brow Atelier &amp; Ink</p>
              <p>Mierloseweg 14</p>
              <p>5707 AM Helmond</p>
            </address>
            <p className="text-sm text-brand-taupe mt-4">
              We laten je weten wanneer je bestelling klaarstaat. Kom je langs?
              Loop gerust even binnen voor een kop koffie.
            </p>
          </div>

          <div>
            <h2 className="font-heading text-2xl mb-4">Retourneren</h2>
            <div className="space-y-3 text-brand-taupe leading-relaxed">
              <p>
                Je hebt 14 dagen bedenktijd op alles wat je online bij ons koopt.
                Retourneren in onze winkel is gratis; stuur je je pakket terug
                met de post, dan zijn die verzendkosten voor jouw rekening. Voor
                verzegelde sieraden zoals oorbellen en piercingsieraden gelden
                extra hygiëneregels.
              </p>
              <p>
                <Link
                  href="/retourneren"
                  className="text-brand-dark underline hover:text-brand-gold transition-colors"
                >
                  Lees alles over retourneren en je bedenktijd
                </Link>
              </p>
            </div>
          </div>

          <div className="border-t border-brand-cream pt-8">
            <p className="text-sm text-brand-taupe">
              Vraag over je bestelling? Mail ons op{" "}
              <a
                href="mailto:BrowAtelier.Ink@gmail.com"
                className="text-brand-dark underline hover:text-brand-gold transition-colors"
              >
                BrowAtelier.Ink@gmail.com
              </a>{" "}
              of stuur een berichtje via{" "}
              <a
                href="https://wa.me/31623747712"
                target="_blank"
                rel="noopener noreferrer"
                className="text-brand-dark underline hover:text-brand-gold transition-colors"
              >
                WhatsApp
              </a>
              .
            </p>
          </div>
        </div>
      </section>
    </>
  );
}
