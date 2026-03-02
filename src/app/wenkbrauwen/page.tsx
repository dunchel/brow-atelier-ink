import type { Metadata } from "next";

const MEETAIMY_URL =
  "https://widget2.meetaimy.com/widgetWeb?salonId=NDMxNjUwNQ%3D%3D&salonEmail=YW50aWxib3JnbGluZGFAZ21haWwuY29t";

export const metadata: Metadata = {
  title: "Brows | Wenkbrauw Behandelingen",
  description:
    "Powder brows, brow lamination, hybrid brows, henna brows en meer bij Brow Atelier & Ink in Helmond. Ontdek de perfecte wenkbrauw behandeling voor jou.",
};

const browTreatments = [
  {
    name: "Powder Brows",
    description:
      "Bij powder brows worden je wenkbrauwen ingeschaduwd met pigment en ben je verzekerd van 1-3 jaar perfecte wenkbrauwen. Houd je van een volle en poederachtige look, dan kun je met een gerust hart voor powder brows gaan. Linda stemt de vorm van je nieuwe brows af op de vorm van je gezicht. Samen met jou bepaalt ze de kleur die het beste bij je past. De behandeling is pijnloos en het resultaat is semi-permanent.",
  },
  {
    name: "Hybrid Brows + Shape",
    description:
      "Hybrid brows zijn de uitkomst voor als je nog twijfelt over powder brows of microblading. Hybrid verf is de nieuwste, langhoudende verf voor wenkbrauwen. Hiermee worden niet alleen de haartjes, maar ook de huid meegeverfd. Het resultaat: vollere en strakkere wenkbrauwen.",
  },
  {
    name: "Full Brow Lamination + Hybrid Tint",
    description:
      "Brow lamination is de truc voor volle, perfect gestylde wenkbrauwen. Met deze techniek worden de wenkbrauwharen met een speciaal serum in de juiste richting geplaatst en gehouden. Ook eigenwijze haartjes worden getemd. Hybrid tint is de nieuwste, langhoudende verf voor wenkbrauwen. Het resultaat: strakke en volumineuze wenkbrauwen tot zes weken lang.",
  },
  {
    name: "Henna Brows",
    description:
      "Bij de henna brow treatment worden zowel de haartjes als de huid onder de wenkbrauwen geverfd, waardoor er een 'ingetekend' effect ontstaat. De henna kleuring helpt om de wenkbrauwen expressiever te maken en kale plekjes in te vullen. Tevens helpen de ingredienten om de bestaande wenkbrauwhaartjes te voeden, te verdikken, te versterken en te beschermen.",
  },
  {
    name: "Full Brow Lamination",
    description:
      "Groeien jouw wenkbrauwhaartjes alle kanten op? Met brow lamination worden de wenkbrauwharen met een speciaal serum in de juiste richting geplaatst en gehouden. Ook eigenwijze haartjes worden getemd. Met als resultaat: volumineuze wenkbrauwen tot zes weken lang.",
  },
  {
    name: "Brow Wax & Tint",
    description:
      "Droom je van mooie en natuurlijke wenkbrauwen die je gezicht laten spreken? Met behulp van de brow mapping techniek meten we je wenkbrauwen op en brengen we ze perfect in vorm door ze te epileren en te waxen. Donshaartjes en eigenwijze haartjes worden verwijderd en we verven je wenkbrauwen in jouw natuurlijke kleur.",
  },
  {
    name: "Brow Wax",
    description:
      "Wil je perfecte wenkbrauwen zonder ze te verven? Dan is een brow wax perfect voor je! We waxen en epileren je wenkbrauwen in een natuurlijke shape, zo vol en natuurlijk mogelijk.",
  },
];

export default function WenkbrauwenPage() {
  return (
    <>
      <section className="pt-32 pb-12 bg-brand-cream">
        <div className="max-w-4xl mx-auto text-center px-6">
          <p className="text-xs tracking-[0.3em] uppercase text-brand-gold mb-3">
            Behandelingen
          </p>
          <h1 className="font-heading text-4xl md:text-6xl mb-4">Brows</h1>
          <p className="text-brand-taupe max-w-2xl mx-auto">
            Zou het niet heerlijk zijn; elke dag wakker worden met mooie
            wenkbrauwen. Zwemmen of de sauna bezoeken zonder zorgen. Doei
            wenkbrauwpotlood; hallo beautiful brows!
          </p>
        </div>
      </section>

      <section className="section-padding bg-white">
        <div className="max-w-4xl mx-auto space-y-8">
          {browTreatments.map((treatment, i) => (
            <div
              key={treatment.name}
              className={`grid md:grid-cols-2 gap-8 items-center ${
                i % 2 === 1 ? "md:direction-rtl" : ""
              }`}
            >
              <div className={i % 2 === 1 ? "md:order-2" : ""}>
                <div className="aspect-[4/3] bg-brand-cream rounded-lg flex items-center justify-center">
                  <span className="text-brand-taupe text-sm">
                    Foto {treatment.name}
                  </span>
                </div>
              </div>
              <div className={i % 2 === 1 ? "md:order-1" : ""}>
                <h2 className="font-heading text-2xl mb-4">
                  {treatment.name}
                </h2>
                <p className="text-brand-taupe leading-relaxed mb-6">
                  {treatment.description}
                </p>
                <a
                  href={MEETAIMY_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-primary text-xs"
                >
                  Boek {treatment.name}
                </a>
              </div>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
