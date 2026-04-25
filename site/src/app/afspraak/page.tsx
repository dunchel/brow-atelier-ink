import type { Metadata } from "next";

const MEETAIMY_URL =
  "https://widget2.meetaimy.com/widgetWeb?salonId=NDMxNjUwNQ%3D%3D&salonEmail=YW50aWxib3JnbGluZGFAZ21haWwuY29t";

export const metadata: Metadata = {
  title: "Afspraak Maken",
  description:
    "Plan je brow date bij Brow Atelier & Ink in Helmond. Kies je behandeling en boek direct online.",
};

export default function AfspraakPage() {
  return (
    <>
      <section className="pt-32 pb-8 bg-brand-cream">
        <div className="max-w-4xl mx-auto text-center px-6">
          <p className="text-xs tracking-[0.3em] uppercase text-brand-gold mb-3">
            Brow Atelier &amp; Ink
          </p>
          <h1 className="font-heading text-4xl md:text-6xl mb-4">
            Afspraak Maken
          </h1>
          <p className="text-brand-taupe max-w-2xl mx-auto">
            Kies je behandeling en plan direct je brow date. We nemen de tijd
            voor jou!
          </p>
        </div>
      </section>

      <section className="section-padding bg-white">
        <div className="max-w-4xl mx-auto">
          <div className="rounded-lg overflow-hidden border border-brand-cream" style={{ minHeight: "700px" }}>
            <iframe
              src={MEETAIMY_URL}
              width="100%"
              height="700"
              style={{ border: "none", minHeight: "700px" }}
              title="Afspraak maken bij Brow Atelier & Ink"
              loading="lazy"
            />
          </div>
          <div className="mt-8 text-center">
            <p className="text-sm text-brand-taupe">
              Lukt het boeken niet? Neem dan contact op via{" "}
              <a
                href="https://wa.me/31623747712"
                className="text-brand-gold hover:underline"
              >
                WhatsApp
              </a>{" "}
              of bel{" "}
              <a
                href="tel:+31623747712"
                className="text-brand-gold hover:underline"
              >
                06-23747712
              </a>
              .
            </p>
          </div>
        </div>
      </section>
    </>
  );
}
