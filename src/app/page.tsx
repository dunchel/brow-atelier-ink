import Link from "next/link";
import type { Metadata } from "next";

const MEETAIMY_URL =
  "https://widget2.meetaimy.com/widgetWeb?salonId=NDMxNjUwNQ%3D%3D&salonEmail=YW50aWxib3JnbGluZGFAZ21haWwuY29t";

export const metadata: Metadata = {
  title: "Brow Atelier & Ink | Brows, Lashes & Beauty Helmond",
  description:
    "Het gezelligste brow & lash atelier van Helmond. Powder brows, lash lift, faux freckles, lip blush, sieraden en meer. Plan vandaag nog je brow date!",
  openGraph: {
    title: "Brow Atelier & Ink | Brows, Lashes & Beauty Helmond",
    description:
      "Powder brows, lash lift, faux freckles en lip blush bij het gezelligste atelier van Helmond.",
  },
};

const treatments = [
  {
    title: "Brows",
    description: "Powder brows, lamination, hybrid & meer",
    href: "/wenkbrauwen",
    image: "/images/brows-hero.jpg",
  },
  {
    title: "Lashes",
    description: "Lash lift, verven & volume",
    href: "/lashes",
    image: "/images/lashes-hero.jpg",
  },
  {
    title: "Faux Freckles",
    description: "Natuurlijke getatoeeerde sproetjes",
    href: "/diensten",
    image: "/images/freckles-hero.jpg",
  },
  {
    title: "Lip Blush",
    description: "Semi-permanente lip pigmentatie",
    href: "/diensten",
    image: "/images/lipblush-hero.jpg",
  },
];

export default function HomePage() {
  return (
    <>
      {/* Hero */}
      <section className="relative min-h-screen flex items-center justify-center bg-brand-cream">
        <div className="absolute inset-0 bg-gradient-to-b from-brand-dark/30 to-brand-dark/60" />
        <div className="relative z-10 text-center text-white px-6 max-w-3xl">
          <p className="text-xs tracking-[0.4em] uppercase mb-4 text-brand-gold">
            Jewelry &bull; Beauty &bull; Piercings &bull; Ink
          </p>
          <h1 className="font-heading text-5xl md:text-7xl mb-6 leading-tight">
            Brow Atelier <br />
            <span className="text-brand-gold">&amp; Ink</span>
          </h1>
          <p className="text-lg md:text-xl mb-10 text-gray-200 leading-relaxed">
            Het gezelligste brow &amp; lash atelier van Nederland.
            Stap binnen en laat je in de watten leggen.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href={MEETAIMY_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-primary"
            >
              Plan je Brow Date
            </a>
            <Link href="/diensten" className="btn-outline border-white text-white hover:bg-white hover:text-brand-dark">
              Bekijk behandelingen
            </Link>
          </div>
        </div>
      </section>

      {/* Behandelingen */}
      <section className="section-padding bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-xs tracking-[0.3em] uppercase text-brand-gold mb-3">
              Onze behandelingen
            </p>
            <h2 className="font-heading text-3xl md:text-5xl">
              Ontdek wat we bieden
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {treatments.map((t) => (
              <Link
                key={t.title}
                href={t.href}
                className="group block"
              >
                <div className="aspect-square bg-brand-cream rounded-lg overflow-hidden mb-4 relative">
                  <div className="absolute inset-0 bg-brand-gold/10 group-hover:bg-brand-gold/20 transition-colors flex items-center justify-center">
                    <span className="font-heading text-2xl text-brand-dark">
                      {t.title}
                    </span>
                  </div>
                </div>
                <h3 className="font-heading text-lg mb-1">{t.title}</h3>
                <p className="text-sm text-brand-taupe">{t.description}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Over ons */}
      <section className="section-padding bg-brand-cream">
        <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-12 items-center">
          <div>
            <p className="text-xs tracking-[0.3em] uppercase text-brand-gold mb-3">
              Over ons
            </p>
            <h2 className="font-heading text-3xl md:text-4xl mb-6">
              Welkom bij het gezelligste atelier van Nederland
            </h2>
            <div className="space-y-4 text-brand-taupe leading-relaxed">
              <p>
                Droom jij van perfecte brows, jaloersmakende wimpers of gewoon
                een vleugje extra flair? Bij Brow Atelier &amp; Ink ben je aan
                het juiste adres! Wij zijn een gezellig team van brow &amp; lash
                stylisten met oog voor detail.
              </p>
              <p>
                Of je nu komt voor strakke wenkbrauwen, een subtiele lash lift of
                een echte eye catching statement piece, we zorgen ervoor dat jij
                straalt, met een look die echt bij je past.
              </p>
              <p>
                Stap binnen, laat je in de watten leggen, geniet van een
                cappuccino of bubbels en shop de mooiste statement pieces. We
                nemen de tijd voor jou en zorgen dat je met een glimlach en een
                prachtige blik weer naar buiten stapt.
              </p>
            </div>
            <Link href="/diensten" className="btn-primary mt-8">
              Bekijk behandelingen
            </Link>
          </div>
          <div className="aspect-[4/5] bg-brand-gold/20 rounded-lg flex items-center justify-center">
            <span className="text-brand-taupe text-sm">Foto salon</span>
          </div>
        </div>
      </section>

      {/* Testimonial */}
      <section className="section-padding bg-white">
        <div className="max-w-3xl mx-auto text-center">
          <p className="text-xs tracking-[0.3em] uppercase text-brand-gold mb-6">
            Wat klanten zeggen
          </p>
          <blockquote className="font-heading text-xl md:text-2xl leading-relaxed text-brand-dark italic mb-6">
            &ldquo;Ook al moet ik er 2 uur voor in de auto zitten; voor
            powderbrows ga ik naar Brow Atelier &amp; Ink. Linda is de enige die ik mijn
            wenkbrauwen toevertrouw. De behandeling is heel prettig en totaal
            pijnloos. Ik ben superblij met het resultaat.&rdquo;
          </blockquote>
          <p className="text-sm uppercase tracking-widest text-brand-taupe">
            &mdash; Miriam
          </p>
        </div>
      </section>

      {/* CTA */}
      <section className="section-padding bg-brand-dark text-center">
        <div className="max-w-2xl mx-auto">
          <h2 className="font-heading text-3xl md:text-4xl text-white mb-4">
            Klaar voor jouw Brow Date?
          </h2>
          <p className="text-gray-300 mb-8">
            Shoppen kan altijd zonder afspraak. Voor behandelingen plan je
            eenvoudig online je afspraak.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href={MEETAIMY_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-primary"
            >
              Afspraak maken
            </a>
            <Link href="/shop" className="btn-outline border-brand-gold">
              Bekijk de shop
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
