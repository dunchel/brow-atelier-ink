import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contact",
  description:
    "Neem contact op met Brow Atelier & Ink in Helmond. Mierloseweg 14, 5707 AM Helmond. Bel, WhatsApp of mail ons.",
};

export default function ContactPage() {
  return (
    <>
      <section className="pt-32 pb-12 bg-brand-cream">
        <div className="max-w-4xl mx-auto text-center px-6">
          <p className="text-xs tracking-[0.3em] uppercase text-brand-gold mb-3">
            Brow Atelier &amp; Ink
          </p>
          <h1 className="font-heading text-4xl md:text-6xl mb-4">Contact</h1>
          <p className="text-brand-taupe max-w-2xl mx-auto">
            Heb je een vraag of hulp nodig? Ons team staat voor je klaar! Neem
            gerust contact met ons op, wij doen ons best om binnen 2-3 werkdagen
            te reageren.
          </p>
        </div>
      </section>

      <section className="section-padding bg-white">
        <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-12">
          <div>
            <h2 className="font-heading text-2xl mb-6">Stuur ons een bericht</h2>
            <form
              action="https://formspree.io/f/YOUR_FORM_ID"
              method="POST"
              className="space-y-4"
            >
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="firstName"
                    className="text-xs uppercase tracking-widest text-brand-taupe block mb-1"
                  >
                    Voornaam
                  </label>
                  <input
                    type="text"
                    id="firstName"
                    name="firstName"
                    required
                    className="w-full px-4 py-3 bg-brand-light border border-brand-cream rounded focus:outline-none focus:border-brand-gold transition-colors"
                  />
                </div>
                <div>
                  <label
                    htmlFor="lastName"
                    className="text-xs uppercase tracking-widest text-brand-taupe block mb-1"
                  >
                    Achternaam
                  </label>
                  <input
                    type="text"
                    id="lastName"
                    name="lastName"
                    required
                    className="w-full px-4 py-3 bg-brand-light border border-brand-cream rounded focus:outline-none focus:border-brand-gold transition-colors"
                  />
                </div>
              </div>
              <div>
                <label
                  htmlFor="email"
                  className="text-xs uppercase tracking-widest text-brand-taupe block mb-1"
                >
                  E-mail
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  required
                  className="w-full px-4 py-3 bg-brand-light border border-brand-cream rounded focus:outline-none focus:border-brand-gold transition-colors"
                />
              </div>
              <div>
                <label
                  htmlFor="message"
                  className="text-xs uppercase tracking-widest text-brand-taupe block mb-1"
                >
                  Bericht
                </label>
                <textarea
                  id="message"
                  name="message"
                  rows={5}
                  required
                  className="w-full px-4 py-3 bg-brand-light border border-brand-cream rounded focus:outline-none focus:border-brand-gold transition-colors resize-none"
                />
              </div>
              <button type="submit" className="btn-primary">
                Verstuur
              </button>
            </form>
          </div>

          <div className="space-y-8">
            <div>
              <h3 className="font-heading text-xl mb-4">Bezoek ons</h3>
              <address className="not-italic text-brand-taupe space-y-1">
                <p>Mierloseweg 14</p>
                <p>5707 AM, Helmond</p>
              </address>
            </div>

            <div>
              <h3 className="font-heading text-xl mb-4">Neem contact op</h3>
              <div className="space-y-2 text-brand-taupe">
                <p>
                  <a
                    href="tel:+31623747712"
                    className="hover:text-brand-gold transition-colors"
                  >
                    06-23747712
                  </a>
                </p>
                <p>
                  <a
                    href="mailto:BrowAtelier.Ink@gmail.com"
                    className="hover:text-brand-gold transition-colors"
                  >
                    BrowAtelier.Ink@gmail.com
                  </a>
                </p>
              </div>
            </div>

            <div>
              <h3 className="font-heading text-xl mb-4">Socials</h3>
              <div className="flex gap-4">
                <a
                  href="https://wa.me/31623747712"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-outline text-xs"
                >
                  WhatsApp
                </a>
                <a
                  href="https://www.instagram.com/browatelier_ink/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-outline text-xs"
                >
                  Instagram
                </a>
                <a
                  href="https://www.tiktok.com/@browatelier.ink"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-outline text-xs"
                >
                  TikTok
                </a>
              </div>
            </div>

            <div className="aspect-video bg-brand-cream rounded-lg overflow-hidden">
              <iframe
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2487.5!2d5.6614!3d51.4768!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x47c72390!2sMierloseweg+14!5e0!3m2!1snl!2snl!4v1"
                width="100%"
                height="100%"
                style={{ border: 0 }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title="Brow Atelier & Ink locatie"
              />
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
