import type { Metadata } from "next";

const MEETAIMY_URL =
  "https://widget2.meetaimy.com/widgetWeb?salonId=NDMxNjUwNQ%3D%3D&salonEmail=YW50aWxib3JnbGluZGFAZ21haWwuY29t";

export const metadata: Metadata = {
  title: "Lashes | Wimper Behandelingen",
  description:
    "Lash lift en wimper behandelingen bij Brow Atelier & Ink in Helmond. Lange, donkere wimpers voor een sprekende blik tot 6 weken lang.",
};

export default function LashesPage() {
  return (
    <>
      <section className="pt-32 pb-12 bg-brand-cream">
        <div className="max-w-4xl mx-auto text-center px-6">
          <p className="text-xs tracking-[0.3em] uppercase text-brand-gold mb-3">
            Behandelingen
          </p>
          <h1 className="font-heading text-4xl md:text-6xl mb-4">Lashes</h1>
          <p className="text-brand-taupe max-w-2xl mx-auto">
            Wil jij de show stelen waar je ook gaat? Met onze lash
            behandelingen krijg je lange, donkere wimpers die je ogen laten
            stralen.
          </p>
        </div>
      </section>

      <section className="section-padding bg-white">
        <div className="max-w-4xl mx-auto grid md:grid-cols-2 gap-12 items-center">
          <div className="aspect-[4/5] bg-brand-cream rounded-lg overflow-hidden">
            <img
              src="https://files.catbox.moe/6e7mi9.png"
              alt="Lash lift resultaat bij Brow Atelier & Ink"
              className="w-full h-full object-cover"
            />
          </div>
          <div>
            <h2 className="font-heading text-2xl md:text-3xl mb-6">
              Lash Lift + Tint
            </h2>
            <div className="space-y-4 text-brand-taupe leading-relaxed">
              <p>
                Ook voor fantastisch mooie wimpers moet je bij Brow Atelier
                &amp; Ink zijn. Lange, donkere wimpers zorgen voor een sprekende
                blik en laten je ogen stralen.
              </p>
              <p>
                Met lash lifting worden je natuurlijke wimpers gelift en krijgen
                ze meer volume. Je eigen wimpers worden vanaf de wortel tegen een
                zachte, siliconen mal aan &apos;gelift&apos; met een speciaal
                serum die de nieuwe vorm in de wimpers blijvend maakt tot wel 6
                weken lang.
              </p>
              <p>
                Ook worden je wimpers geverfd zodat je een mascara look krijgt.
                Een lash lift maakt wimper krullers overbodig.
              </p>
            </div>
            <a
              href={MEETAIMY_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-primary text-xs mt-8"
            >
              Boek Lash Lift
            </a>
          </div>
        </div>
      </section>

      <section className="section-padding bg-brand-dark text-center">
        <div className="max-w-2xl mx-auto">
          <h2 className="font-heading text-3xl text-white mb-4">
            Klaar voor een sprekende blik?
          </h2>
          <p className="text-gray-300 mb-8">
            Plan eenvoudig online je lash lift behandeling.
          </p>
          <a
            href={MEETAIMY_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-primary"
          >
            Afspraak maken
          </a>
        </div>
      </section>
    </>
  );
}
