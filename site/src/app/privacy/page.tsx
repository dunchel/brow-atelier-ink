import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "Privacy policy van Brow Atelier & Ink.",
};

export default function PrivacyPage() {
  return (
    <section className="pt-32 section-padding bg-white">
      <div className="max-w-3xl mx-auto prose prose-sm">
        <h1 className="font-heading text-3xl md:text-4xl mb-8">
          Privacy Policy
        </h1>
        <p>
          Brow Atelier &amp; Ink, gevestigd aan Mierloseweg 14, 5707 AM
          Helmond, is verantwoordelijk voor de verwerking van persoonsgegevens
          zoals weergegeven in deze privacyverklaring.
        </p>

        <h2>Contactgegevens</h2>
        <p>
          Mierloseweg 14, 5707 AM Helmond
          <br />
          06-23747712
          <br />
          BrowAtelier.Ink@gmail.com
        </p>

        <h2>Persoonsgegevens die wij verwerken</h2>
        <p>
          Brow Atelier &amp; Ink verwerkt je persoonsgegevens doordat je gebruik
          maakt van onze diensten en/of omdat je deze zelf aan ons verstrekt.
          Hieronder vind je een overzicht van de persoonsgegevens die wij
          verwerken:
        </p>
        <ul>
          <li>Voor- en achternaam</li>
          <li>Telefoonnummer</li>
          <li>E-mailadres</li>
          <li>Overige persoonsgegevens die je actief verstrekt (in correspondentie en telefonisch)</li>
        </ul>

        <h2>Doel verwerking</h2>
        <p>
          Wij verwerken je persoonsgegevens voor de volgende doelen: het
          afhandelen van je betaling, je te kunnen bellen of e-mailen indien
          nodig, en om diensten bij je af te leveren.
        </p>

        <h2>Bewaartermijn</h2>
        <p>
          Brow Atelier &amp; Ink bewaart je persoonsgegevens niet langer dan
          strikt nodig is om de doelen te realiseren waarvoor je data wordt
          verzameld.
        </p>

        <h2>Rechten</h2>
        <p>
          Je hebt het recht om je persoonsgegevens in te zien, te corrigeren of
          te verwijderen. Neem hiervoor contact op via BrowAtelier.Ink@gmail.com.
        </p>
      </div>
    </section>
  );
}
