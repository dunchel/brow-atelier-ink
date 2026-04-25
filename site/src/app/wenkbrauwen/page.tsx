import type { Metadata } from "next";
import Link from "next/link";

const MEETAIMY_URL =
  "https://widget2.meetaimy.com/widgetWeb?salonId=NDMxNjUwNQ%3D%3D&salonEmail=YW50aWxib3JnbGluZGFAZ21haWwuY29t";

export const metadata: Metadata = {
  title: "Brows | Wenkbrauw Behandelingen",
  description:
    "Powder brows, brow lamination, hybrid brows, henna brows en meer bij Brow Atelier & Ink in Helmond. Ontdek de perfecte wenkbrauw behandeling voor jou.",
};

const browImages = [
  "https://static.wixstatic.com/media/1fc3db_0940c25e759c42f2b3f768a70c7368c7~mv2.jpg/v1/crop/x_0,y_10,w_1561,h_1425/fill/w_800,h_800,al_c,q_80,enc_avif,quality_auto/WhatsApp%20Image%202025-12-15%20at%2016_46_edited.jpg",
  "https://static.wixstatic.com/media/2a5a13_a1db6e2098fa4aa6a8cf061277e6857d~mv2.jpg/v1/crop/x_0,y_473,w_2250,h_2055/fill/w_600,h_548,al_c,q_80,enc_avif,quality_auto/image_167789569_edited.jpg",
  "https://static.wixstatic.com/media/2a5a13_00319bcf6c1048598a6c62f43195cc17~mv2.jpg/v1/crop/x_0,y_635,w_3024,h_2761/fill/w_600,h_548,al_c,q_80,enc_avif,quality_auto/image_67171073_JPG.jpg",
  "https://static.wixstatic.com/media/2a5a13_7303031df9404ce49f9b097c8b432ba9~mv2.jpg/v1/crop/x_0,y_161,w_768,h_701/fill/w_600,h_548,al_c,q_80,enc_avif,quality_auto/WhatsApp%20Image%202023-12-01%20at%2018_49_edited.jpg",
  "https://static.wixstatic.com/media/1fc3db_4f228387ca6a48d09d40a59856078d0e~mv2.jpeg/v1/crop/x_0,y_366,w_1442,h_1317/fill/w_600,h_548,al_c,q_80,enc_avif,quality_auto/WhatsApp%20Image%202026-01-19%20at%2017_25_29.jpeg",
  "https://static.wixstatic.com/media/2a5a13_75ed242480a748e5823a421043e571de~mv2.jpeg/v1/crop/x_0,y_161,w_768,h_701/fill/w_600,h_548,al_c,q_80,enc_avif,quality_auto/WhatsApp%20Image%202023-12-01%20at%2018_49_10%20(5).jpeg",
  "https://static.wixstatic.com/media/1fc3db_c3c68ed798d0422c8a658bfeddf9d2b7~mv2.jpeg/v1/crop/x_0,y_88,w_942,h_860/fill/w_600,h_548,al_c,q_80,enc_avif,quality_auto/WhatsApp%20Image%202025-05-14%20at%2010_10_50.jpeg",
];

const browTreatments = [
  {
    name: "Powder Brows",
    tagline: "Semi-permanent · 1–3 jaar resultaat",
    description:
      "Wenkbrauwen ingeschaduwd met pigment voor een volle, poederachtige look. Linda stemt de vorm en kleur altijd af op jouw gezicht. Pijnloos en semi-permanent.",
    duration: "2–3 uur",
  },
  {
    name: "Hybrid Brows + Shape",
    tagline: "De beste van twee werelden",
    description:
      "Hybrid verf kleurt niet alleen de haartjes maar ook de huid mee. Vollere en strakkere wenkbrauwen met een langdurig, natuurlijk resultaat.",
    duration: "1,5–2 uur",
  },
  {
    name: "Full Brow Lamination + Hybrid Tint",
    tagline: "Volume en kleur in één behandeling",
    description:
      "Haartjes worden met speciaal serum in perfecte richting geplaatst, aangevuld met langhoudende hybrid tint voor maximaal volume en definitie.",
    duration: "60–90 min",
  },
  {
    name: "Henna Brows",
    tagline: "Natuurlijk ingetekend effect",
    description:
      "Haartjes én huid worden geverfd voor een ingetekend effect. Voedt, verdikt en versterkt de wenkbrauwhaartjes. Tot 4 weken houdbaar.",
    duration: "45–60 min",
  },
  {
    name: "Full Brow Lamination",
    tagline: "Volumineuze brows · tot 6 weken",
    description:
      "Eigenwijze wenkbrauwhaartjes worden met serum getemd en in de juiste richting geplaatst. Strak, vol en natuurlijk — zonder verf.",
    duration: "45–60 min",
  },
  {
    name: "Brow Wax & Tint",
    tagline: "Perfecte shape plus kleur",
    description:
      "Met brow mapping worden wenkbrauwen in optimale vorm gebracht door epileren en waxen, aangevuld met kleuring in jouw natuurlijke tint.",
    duration: "45–60 min",
  },
  {
    name: "Brow Wax",
    tagline: "Strak en zo natuurlijk mogelijk",
    description:
      "Perfecte shape zonder kleuring. Epileren en waxen op basis van de brow mapping techniek — zo vol en natuurlijk mogelijk.",
    duration: "30–45 min",
  },
];

export default function WenkbrauwenPage() {
  return (
    <>
      {/* ── Hero ── */}
      <section className="relative h-[80vh] min-h-[520px] flex items-end">
        <div className="absolute inset-0 z-0">
          <img
            src={browImages[0]}
            alt="Brow behandeling bij Brow Atelier & Ink"
            className="w-full h-full object-cover object-top"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-brand-dark/85 via-brand-dark/25 to-transparent" />
        </div>
        <div className="relative z-10 w-full max-w-7xl mx-auto px-6 pb-16 md:pb-24">
          <div className="max-w-xl">
            <p className="text-xs tracking-[0.3em] uppercase text-brand-gold mb-4">
              Brow Atelier &amp; Ink · Helmond
            </p>
            <h1 className="font-heading text-4xl md:text-6xl text-white mb-5 leading-tight">
              Perfecte brows,<br />elke dag
            </h1>
            <p className="text-white/70 text-base mb-8 leading-relaxed">
              Semi-permanent, langdurig en altijd op maat. Ontdek welke behandeling bij jou past.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <a
                href={MEETAIMY_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block bg-brand-gold text-white px-8 py-3 text-xs tracking-widest uppercase hover:bg-white hover:text-brand-dark transition-colors text-center"
              >
                Boek een afspraak
              </a>
              <a
                href="#behandelingen"
                className="inline-block border border-white/50 text-white px-8 py-3 text-xs tracking-widest uppercase hover:border-white transition-colors text-center"
              >
                Bekijk behandelingen
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ── Fotogalerie ── */}
      <section className="bg-white py-6 overflow-hidden">
        <div className="flex gap-2 overflow-x-auto scrollbar-hide px-4 md:grid md:grid-cols-6 md:overflow-visible md:px-6 md:gap-3">
          {browImages.slice(1).map((img, i) => (
            <div
              key={i}
              className="flex-shrink-0 w-28 h-28 md:w-auto md:h-44 rounded-lg overflow-hidden"
            >
              <img
                src={img}
                alt={`Brow resultaat ${i + 1}`}
                loading="lazy"
                className="w-full h-full object-cover hover:scale-105 transition-transform duration-700"
              />
            </div>
          ))}
        </div>
      </section>

      {/* ── Introductie ── */}
      <section className="section-padding bg-brand-cream">
        <div className="max-w-3xl mx-auto text-center">
          <p className="text-xs tracking-[0.3em] uppercase text-brand-gold mb-3">Onze aanpak</p>
          <h2 className="font-heading text-3xl md:text-4xl mb-6">
            Elke dag wakker worden met mooie wenkbrauwen
          </h2>
          <p className="text-brand-taupe leading-relaxed text-base md:text-lg">
            Zwemmen of de sauna bezoeken zonder zorgen. Doei wenkbrauwpotlood — hallo beautiful
            brows. Linda werkt altijd op maat, afgestemd op de vorm van jouw gezicht en wat jij
            mooi vindt.
          </p>
        </div>
      </section>

      {/* ── Behandelingen ── */}
      <section id="behandelingen" className="section-padding bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-xs tracking-[0.3em] uppercase text-brand-gold mb-3">
              Specialisaties
            </p>
            <h2 className="font-heading text-3xl md:text-5xl">Onze behandelingen</h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {browTreatments.map((treatment) => (
              <div
                key={treatment.name}
                className="group flex flex-col p-6 border border-brand-cream rounded-xl hover:border-brand-gold/40 hover:shadow-md transition-all"
              >
                <div className="flex items-start justify-between mb-5">
                  <div className="w-7 h-7 rounded-full bg-brand-cream flex items-center justify-center flex-shrink-0">
                    <div className="w-1.5 h-1.5 rounded-full bg-brand-gold" />
                  </div>
                  <span className="text-[10px] tracking-wider uppercase text-brand-taupe/60 bg-brand-cream px-2 py-1 rounded-full">
                    {treatment.duration}
                  </span>
                </div>
                <h3 className="font-heading text-lg mb-1 group-hover:text-brand-gold transition-colors">
                  {treatment.name}
                </h3>
                <p className="text-[11px] uppercase tracking-wide text-brand-gold/70 mb-3">
                  {treatment.tagline}
                </p>
                <p className="text-brand-taupe text-sm leading-relaxed flex-1">
                  {treatment.description}
                </p>
                <div className="mt-5 pt-5 border-t border-brand-cream">
                  <a
                    href={MEETAIMY_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs uppercase tracking-widest text-brand-dark hover:text-brand-gold transition-colors"
                  >
                    Boek deze behandeling &rarr;
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA sectie ── */}
      <section className="relative py-28 overflow-hidden">
        <div className="absolute inset-0">
          <img
            src={browImages[4]}
            alt="Brow Atelier & Ink"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-brand-dark/80" />
        </div>
        <div className="relative z-10 max-w-xl mx-auto text-center px-6">
          <p className="text-xs tracking-[0.3em] uppercase text-brand-gold mb-4">
            Maak een afspraak
          </p>
          <h2 className="font-heading text-3xl md:text-5xl text-white mb-6">
            Klaar voor jouw<br />perfecte brows?
          </h2>
          <p className="text-white/70 mb-10 leading-relaxed">
            Boek direct online via MeetAimy, of loop gerust binnen in ons atelier aan de
            Mierloseweg 14 in Helmond.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href={MEETAIMY_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block bg-brand-gold text-white px-10 py-4 text-xs tracking-widest uppercase hover:bg-white hover:text-brand-dark transition-colors"
            >
              Boek nu
            </a>
            <Link
              href="/contact"
              className="inline-block border border-white/50 text-white px-10 py-4 text-xs tracking-widest uppercase hover:border-white hover:bg-white/10 transition-colors"
            >
              Contact
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
