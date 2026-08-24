import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Retourneren & bedenktijd",
  description:
    "Retourbeleid van Brow Atelier & Ink: 14 dagen bedenktijd op online aankopen, gratis retourneren in de winkel in Helmond, en de regels voor verzegelde sieraden.",
};

export default function RetournerenPage() {
  return (
    <>
      <section className="pt-32 pb-12 bg-brand-cream">
        <div className="max-w-4xl mx-auto text-center px-6">
          <p className="text-xs tracking-[0.3em] uppercase text-brand-gold mb-3">
            Brow Atelier &amp; Ink
          </p>
          <h1 className="font-heading text-4xl md:text-6xl mb-4">
            Retourneren
          </h1>
          <p className="text-brand-taupe max-w-2xl mx-auto">
            Niet helemaal wat je ervan verwachtte? Je hebt 14 dagen bedenktijd op
            alles wat je in onze webshop koopt. Hieronder lees je precies hoe het
            werkt.
          </p>
        </div>
      </section>

      <section className="section-padding bg-white">
        <div className="max-w-3xl mx-auto space-y-12">
          <div className="grid sm:grid-cols-3 gap-4">
            <div className="bg-brand-light border border-brand-cream rounded-lg p-5">
              <p className="text-xs uppercase tracking-widest text-brand-gold mb-2">
                Bedenktijd
              </p>
              <p className="text-sm text-brand-taupe">
                14 dagen na ontvangst van je pakket
              </p>
            </div>
            <div className="bg-brand-light border border-brand-cream rounded-lg p-5">
              <p className="text-xs uppercase tracking-widest text-brand-gold mb-2">
                In de winkel
              </p>
              <p className="text-sm text-brand-taupe">
                Gratis retourneren aan de Mierloseweg 14
              </p>
            </div>
            <div className="bg-brand-light border border-brand-cream rounded-lg p-5">
              <p className="text-xs uppercase tracking-widest text-brand-gold mb-2">
                Terugsturen
              </p>
              <p className="text-sm text-brand-taupe">
                Verzendkosten van de retour zijn voor jou
              </p>
            </div>
          </div>

          <div>
            <h2 className="font-heading text-2xl mb-4">
              Je wettelijke bedenktijd
            </h2>
            <div className="space-y-3 text-brand-taupe leading-relaxed">
              <p>
                Koop je online bij ons? Dan heb je 14 dagen bedenktijd, gerekend
                vanaf de dag nadat je je bestelling hebt ontvangen. Binnen die
                periode mag je zonder opgave van reden van de koop afzien. Dat
                heet het herroepingsrecht.
              </p>
              <p>
                Zodra je ons hebt laten weten dat je de koop ongedaan maakt, heb
                je nog 14 dagen om het artikel daadwerkelijk terug te sturen of
                langs te brengen. De datum van verzending geldt, dus je bent op
                tijd als je het binnen die 14 dagen op de post doet.
              </p>
            </div>
          </div>

          <div>
            <h2 className="font-heading text-2xl mb-4">Hoe meld je een retour</h2>
            <ol className="space-y-4 text-brand-taupe leading-relaxed">
              <li className="flex gap-4">
                <span className="font-heading text-brand-gold text-xl leading-none shrink-0">
                  1
                </span>
                <span>
                  Laat het ons binnen 14 dagen weten via{" "}
                  <a
                    href="mailto:BrowAtelier.Ink@gmail.com?subject=Retour%20webshopbestelling"
                    className="text-brand-dark underline hover:text-brand-gold transition-colors"
                  >
                    BrowAtelier.Ink@gmail.com
                  </a>{" "}
                  of{" "}
                  <a
                    href="https://wa.me/31623747712"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-brand-dark underline hover:text-brand-gold transition-colors"
                  >
                    WhatsApp
                  </a>
                  . Vermeld je naam, je ordernummer en welk artikel je wilt
                  retourneren. Je hoeft geen reden op te geven.
                </span>
              </li>
              <li className="flex gap-4">
                <span className="font-heading text-brand-gold text-xl leading-none shrink-0">
                  2
                </span>
                <span>
                  Breng het artikel langs in de winkel, of stuur het binnen 14
                  dagen na je melding terug naar ons retouradres. Voeg de
                  pakbon of je ordernummer toe zodat we je bestelling
                  terugvinden.
                </span>
              </li>
              <li className="flex gap-4">
                <span className="font-heading text-brand-gold text-xl leading-none shrink-0">
                  3
                </span>
                <span>
                  Wij betalen je binnen 14 dagen terug, op dezelfde manier als je
                  hebt betaald. We mogen daarmee wachten tot we je retour binnen
                  hebben of tot je kunt aantonen dat je het hebt verstuurd.
                </span>
              </li>
            </ol>
          </div>

          <div className="bg-brand-cream rounded-lg p-6">
            <h2 className="font-heading text-xl mb-3">Retouradres</h2>
            <address className="not-italic text-brand-taupe space-y-1">
              <p>Brow Atelier &amp; Ink</p>
              <p>Mierloseweg 14</p>
              <p>5707 AM Helmond</p>
            </address>
            <p className="text-sm text-brand-taupe mt-4">
              Retourneren in de winkel is gratis. Stuur je je pakket op? Dan zijn
              de verzendkosten van de retourzending voor jouw rekening.
            </p>
          </div>

          <div>
            <h2 className="font-heading text-2xl mb-4">Wat je terugkrijgt</h2>
            <ul className="space-y-2 text-brand-taupe leading-relaxed list-disc pl-5">
              <li>
                Stuur je je hele bestelling terug? Dan krijg je het
                aankoopbedrag én de verzendkosten die je bij je bestelling hebt
                betaald terug.
              </li>
              <li>
                Stuur je maar een deel van je bestelling terug? Dan betalen we
                het aankoopbedrag van dat artikel terug; de oorspronkelijke
                verzendkosten blijven dan staan.
              </li>
              <li>
                De kosten van het terugsturen zijn voor jouw rekening. In de
                winkel retourneren is gratis.
              </li>
            </ul>
          </div>

          <div>
            <h2 className="font-heading text-2xl mb-4">
              In welke staat mag je retourneren
            </h2>
            <div className="space-y-3 text-brand-taupe leading-relaxed">
              <p>
                Je mag een artikel bekijken en beoordelen zoals je dat in een
                winkel ook zou doen. Behandel het daarbij zorgvuldig: stuur het
                ongebruikt terug en waar mogelijk in de originele staat en
                verpakking, met eventuele labels eraan. Is een artikel meer
                gebruikt of beschadigd dan nodig was om het te beoordelen, dan
                mogen wij de waardevermindering van je terugbetaling aftrekken.
              </p>
            </div>
          </div>

          <div>
            <h2 className="font-heading text-2xl mb-4">
              Sieraden, oorbellen en piercingsieraden
            </h2>
            <div className="space-y-3 text-brand-taupe leading-relaxed">
              <p>
                Voor sieraden die direct op of in het lichaam worden gedragen —
                zoals oorbellen en piercingsieraden — geldt een wettelijke
                uitzondering op het herroepingsrecht om redenen van
                gezondheidsbescherming en hygiëne. Die uitzondering werkt zo:
              </p>
              <ul className="space-y-2 list-disc pl-5">
                <li>
                  Leveren wij het sieraad verzegeld of hygiënisch afgesloten en
                  verbreek je die verzegeling na ontvangst? Dan vervalt je
                  bedenktijd en kunnen we het artikel niet meer terugnemen. Ook
                  niet als je het niet hebt gedragen: wij kunnen het daarna
                  namelijk niet meer hygiënisch verantwoord opnieuw verkopen.
                </li>
                <li>
                  Laat je de verzegeling intact? Dan geldt je bedenktijd van 14
                  dagen gewoon en kun je het sieraad ongeopend retourneren.
                </li>
                <li>
                  Is een sieraad níet verzegeld bij je aangekomen? Dan geldt deze
                  uitzondering niet en heb je de normale bedenktijd van 14 dagen.
                </li>
              </ul>
              <p>
                Twijfel je of je iets kunt retourneren? Neem even contact met ons
                op voordat je de verpakking opent — dan kijken we samen wat er
                mogelijk is.
              </p>
            </div>
          </div>

          <div>
            <h2 className="font-heading text-2xl mb-4">
              Andere uitzonderingen op de bedenktijd
            </h2>
            <p className="text-brand-taupe leading-relaxed mb-3">
              Naast verzegelde hygiëneproducten geldt de bedenktijd wettelijk ook
              niet voor:
            </p>
            <ul className="space-y-2 text-brand-taupe leading-relaxed list-disc pl-5">
              <li>
                artikelen die speciaal voor jou op maat zijn gemaakt of
                persoonlijk zijn aangepast, bijvoorbeeld een gravure;
              </li>
              <li>
                een dienst die op jouw uitdrukkelijke verzoek al volledig is
                uitgevoerd, bijvoorbeeld een behandeling die je al hebt gehad.
              </li>
            </ul>
          </div>

          <div>
            <h2 className="font-heading text-2xl mb-4">
              Behandelingen en afspraken
            </h2>
            <div className="space-y-3 text-brand-taupe leading-relaxed">
              <p>
                Brows, lashes, PMU, piercings en tattoos zijn diensten en geen
                webshopaankoop. Het herroepingsrecht voor online aankopen geldt
                daar dus niet op dezelfde manier voor.
              </p>
              <p>
                Wil je een afspraak verzetten of afzeggen? Doe dat dan zo snel
                mogelijk, zodat we je plek aan iemand anders kunnen geven. Dat
                kan via de afspraakbevestiging die je van ons hebt gekregen, of
                neem{" "}
                <Link
                  href="/contact"
                  className="text-brand-dark underline hover:text-brand-gold transition-colors"
                >
                  contact
                </Link>{" "}
                met ons op. Voor vragen over een behandeling die je al hebt gehad
                bellen of mailen we liever even met je — meestal is er meer
                mogelijk dan je denkt.
              </p>
            </div>
          </div>

          <div>
            <h2 className="font-heading text-2xl mb-4">
              Iets stuk of niet goed ontvangen?
            </h2>
            <p className="text-brand-taupe leading-relaxed">
              Dat is iets anders dan retourneren binnen je bedenktijd. Je hebt
              altijd recht op een product dat deugt. Stuur ons in dat geval een
              bericht met een foto via{" "}
              <a
                href="mailto:BrowAtelier.Ink@gmail.com?subject=Klacht%20over%20mijn%20bestelling"
                className="text-brand-dark underline hover:text-brand-gold transition-colors"
              >
                BrowAtelier.Ink@gmail.com
              </a>
              , ook als je bedenktijd al voorbij is. We lossen het samen op.
            </p>
          </div>

          <div className="border-t border-brand-cream pt-8">
            <p className="text-sm text-brand-taupe">
              Meer weten over bezorging en verzendkosten? Dat lees je op{" "}
              <Link
                href="/verzending"
                className="text-brand-dark underline hover:text-brand-gold transition-colors"
              >
                verzending &amp; bezorging
              </Link>
              .
            </p>
          </div>
        </div>
      </section>
    </>
  );
}
