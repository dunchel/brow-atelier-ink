import type { Metadata } from "next";

const MEETAIMY_URL =
  "https://widget2.meetaimy.com/widgetWeb?salonId=NDMxNjUwNQ%3D%3D&salonEmail=YW50aWxib3JnbGluZGFAZ21haWwuY29t";

export const metadata: Metadata = {
  title: "Diensten & Behandelingen",
  description:
    "Overzicht van alle behandelingen bij Brow Atelier & Ink in Helmond: brows, lashes, faux freckles, lip blush en meer. Bekijk prijzen en plan je afspraak.",
};

const diensten = [
  {
    category: "Brows",
    href: "/wenkbrauwen",
    items: [
      { name: "Powder Brows", description: "Ingeschaduwde wenkbrauwen met pigment. Semi-permanent resultaat van 1-3 jaar." },
      { name: "Hybrid Brows + Shape", description: "Combinatie van powder en microblading met langhoudende verf voor vollere, strakkere wenkbrauwen." },
      { name: "Full Brow Lamination + Hybrid Tint", description: "Wenkbrauwhaartjes in de juiste richting gelift met serum + langhoudende verf. Tot 6 weken resultaat." },
      { name: "Henna Brows", description: "Natuurlijke henna kleuring die haartjes en huid verft voor een 'ingetekend' effect." },
      { name: "Full Brow Lamination", description: "Wenkbrauwhaartjes gelift en getemd voor volumineuze brows tot 6 weken." },
      { name: "Brow Wax & Tint", description: "Waxen, epileren en verven voor perfect gevormde, natuurlijke wenkbrauwen." },
      { name: "Brow Wax", description: "Waxen en epileren in een natuurlijke shape, zonder verven." },
    ],
  },
  {
    category: "Lashes",
    href: "/lashes",
    items: [
      { name: "Lash Lift + Tint", description: "Natuurlijke wimpers gelift en geverfd voor een sprekende blik tot 6 weken." },
    ],
  },
  {
    category: "Faux Freckles",
    items: [
      {
        name: "Faux Freckles",
        description:
          "Getatoeeerde sproetjes op je wangen en neus via semi-permanente make-up. Super natuurlijk resultaat, 1-3 jaar houdbaar. Aantal en plek bepaal je zelf.",
      },
    ],
  },
  {
    category: "Lip Blush",
    items: [
      {
        name: "Lip Blush",
        description:
          "Semi-permanente lip pigmentatie voor vollere, symmetrische lippen met een natuurlijke kleur. Geen dagelijkse lipstick meer nodig.",
      },
    ],
  },
];

export default function DienstenPage() {
  return (
    <>
      <section className="pt-32 pb-12 bg-brand-cream">
        <div className="max-w-4xl mx-auto text-center px-6">
          <p className="text-xs tracking-[0.3em] uppercase text-brand-gold mb-3">
            Brow Atelier &amp; Ink
          </p>
          <h1 className="font-heading text-4xl md:text-6xl mb-4">Diensten</h1>
          <p className="text-brand-taupe max-w-2xl mx-auto">
            Ontdek onze behandelingen en vind de perfecte look die bij jou past.
            Voor elke behandeling nemen we de tijd om een resultaat te creeren
            waar je blij van wordt.
          </p>
        </div>
      </section>

      <section className="section-padding bg-white">
        <div className="max-w-4xl mx-auto space-y-16">
          {diensten.map((cat) => (
            <div key={cat.category}>
              <div className="flex items-center gap-4 mb-8">
                <h2 className="font-heading text-2xl md:text-3xl">
                  {cat.category}
                </h2>
                <div className="flex-1 h-px bg-brand-cream" />
              </div>
              <div className="space-y-6">
                {cat.items.map((item) => (
                  <div
                    key={item.name}
                    className="flex flex-col sm:flex-row sm:items-start gap-4 p-6 bg-brand-light rounded-lg"
                  >
                    <div className="flex-1">
                      <h3 className="font-heading text-lg mb-2">
                        {item.name}
                      </h3>
                      <p className="text-sm text-brand-taupe leading-relaxed">
                        {item.description}
                      </p>
                    </div>
                    <a
                      href={MEETAIMY_URL}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn-primary text-xs whitespace-nowrap self-start"
                    >
                      Boek nu
                    </a>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="section-padding bg-brand-dark text-center">
        <div className="max-w-2xl mx-auto">
          <h2 className="font-heading text-3xl text-white mb-4">
            Wil je een afspraak maken?
          </h2>
          <p className="text-gray-300 mb-8">
            Plan eenvoudig online je behandeling. We nemen de tijd voor jou.
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
