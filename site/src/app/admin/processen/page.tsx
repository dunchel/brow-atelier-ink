"use client";

import Link from "next/link";
import { useState } from "react";

interface Step {
  title: string;
  description: string;
  tip?: string;
}

interface Process {
  id: string;
  title: string;
  subtitle: string;
  steps: Step[];
  links?: { label: string; href: string; external?: boolean }[];
}

const PROCESSES: Process[] = [
  {
    id: "verkoop-winkel",
    title: "Verkoop in de winkel",
    subtitle: "Klant koopt een sieraad aan de balie (pin/contant)",
    steps: [
      {
        title: "Product kiezen",
        description:
          "Klant kiest een sieraad uit de vitrine. Help eventueel met passen of combineren.",
      },
      {
        title: "Product opzoeken",
        description:
          "Scan de QR-code op het label met de iPhone-camera, of zoek op barcode/naam in de Google Sheet.",
        tip: "QR op het label = de barcode (bijv. BA-KET-001).",
      },
      {
        title: "Voorraad controleren",
        description:
          "Check in de Google Sheet of het product op voorraad staat (kolom Voorraad). Geen voorraad = niet verkopen.",
      },
      {
        title: "Prijs doorgeven",
        description:
          "Noem de prijs uit de Sheet. Eventueel kortingsactie of combi-deal met klant afspreken.",
      },
      {
        title: "Betaling ontvangen",
        description:
          "Pin of contant afrekenen. Geef bon mee als klant dat wil.",
      },
      {
        title: "Voorraad bijwerken",
        description:
          "Pas in de Google Sheet de voorraad aan: -1 per verkocht stuk. Dit is verplicht na elke verkoop.",
        tip: "Doe dit direct na betaling, niet aan het eind van de dag.",
      },
      {
        title: "Inpakken & overhandigen",
        description:
          "Verpak in cadeauzakje of doosje. Leg eventueel een visitekaartje of bedankkaartje bij.",
      },
    ],
    links: [
      { label: "Labels printen", href: "/admin/labels" },
      { label: "Producten beheren", href: "/admin/producten" },
    ],
  },
  {
    id: "verkoop-online",
    title: "Verkoop via webshop",
    subtitle: "Klant bestelt op browatelier-ink.com",
    steps: [
      {
        title: "Bestelling binnen",
        description:
          "Klant betaalt via de webshop (Shopify checkout). Je krijgt een e-mailmelding van Shopify.",
      },
      {
        title: "Bestelling bekijken",
        description:
          "Open Admin > Verkoop Dashboard of Shopify Admin. Controleer producten, adres en betalingsstatus.",
      },
      {
        title: "Voorraad controleren",
        description:
          "Check in de Google Sheet of alle items op voorraad zijn. Geen voorraad? Neem contact op met klant.",
      },
      {
        title: "Inpakken",
        description:
          "Verpak zorgvuldig. Voeg bedankkaartje toe. Noteer het bestelnummer op het pakket.",
      },
      {
        title: "Verzenden",
        description:
          "Maak het pakket klaar en boek verzending in. Vul tracking in via Admin > Zendingen of Shopify.",
      },
      {
        title: "Voorraad bijwerken",
        description:
          "Pas in de Google Sheet de voorraad aan per verkocht product (-1 per stuk).",
      },
      {
        title: "Klant informeren",
        description:
          "Shopify stuurt automatisch een verzendmail zodra tracking is ingevuld. Controleer of dit is verstuurd.",
      },
    ],
    links: [
      { label: "Verkoop Dashboard", href: "/admin/verkoop" },
      { label: "Zendingen", href: "/admin/zendingen" },
      {
        label: "Shopify Admin",
        href: "https://admin.shopify.com/store/brow-atelier-ink",
        external: true,
      },
    ],
  },
  {
    id: "retour-winkel",
    title: "Retour in de winkel",
    subtitle: "Klant brengt product terug naar het atelier",
    steps: [
      {
        title: "Retour aanvragen",
        description:
          "Klant meldt retour binnen 14 dagen na aankoop. Vraag bon, betalingsbewijs of productcode.",
      },
      {
        title: "Product opzoeken",
        description:
          "Scan QR-code of zoek product op barcode in de Google Sheet. Controleer oorspronkelijke prijs.",
      },
      {
        title: "Product inspecteren",
        description:
          "Check: onbeschadigd, schoon, originele staat. Geen retour bij slijtage door dragen of ontbrekende onderdelen.",
        tip: "Bij twijfel: overleg met collega of eigenaar.",
      },
      {
        title: "Reden noteren",
        description:
          "Noteer kort waarom klant retourneert (maat, kleur, cadeau, defect). Handig voor inkoop/assortiment.",
      },
      {
        title: "Terugbetaling",
        description:
          "Betaal terug via pin (zelfde dag) of contant. Online bestelling? Verwerk refund in Shopify Admin.",
      },
      {
        title: "Voorraad bijwerken",
        description:
          "Zet in de Google Sheet de voorraad terug: +1 per geretourneerd stuk.",
      },
      {
        title: "Label & vitrine",
        description:
          "Plak indien nodig een nieuw label (Admin > Labels). Leg product terug in de vitrine.",
      },
    ],
    links: [
      { label: "Labels printen", href: "/admin/labels" },
      {
        label: "Shopify refunds",
        href: "https://admin.shopify.com/store/brow-atelier-ink/orders",
        external: true,
      },
    ],
  },
  {
    id: "retour-online",
    title: "Retour webshop-bestelling",
    subtitle: "Klant stuurt online bestelling terug",
    steps: [
      {
        title: "Retour melding",
        description:
          "Klant mailt of appt met bestelnummer. Bevestig retour binnen 14 dagen na ontvangst pakket.",
      },
      {
        title: "Bestelling opzoeken",
        description:
          "Zoek bestelling in Shopify Admin of Admin > Verkoop Dashboard op naam/bestelnummer.",
      },
      {
        title: "Retouradres geven",
        description:
          "Stuur retourinstructies: Brow Atelier & Ink, Mierloseweg 14, 5707 AM Helmond.",
      },
      {
        title: "Pakket ontvangen",
        description:
          "Controleer product bij ontvangst: compleet, onbeschadigd, originele verpakking indien mogelijk.",
      },
      {
        title: "Refund verwerken",
        description:
          "Verwerk terugbetaling in Shopify Admin (Orders > Refund). Klant krijgt automatisch bericht.",
      },
      {
        title: "Voorraad bijwerken",
        description:
          "Google Sheet: +1 voorraad per geretourneerd product.",
      },
      {
        title: "Product klaarzetten",
        description:
          "Nieuw label plakken indien nodig. Product terug in voorraad/vitrine.",
      },
    ],
    links: [
      { label: "Verkoop Dashboard", href: "/admin/verkoop" },
      { label: "Labels printen", href: "/admin/labels" },
    ],
  },
];

function ProcessCard({ process }: { process: Process }) {
  const [checked, setChecked] = useState<Set<number>>(new Set());

  const toggle = (idx: number) => {
    setChecked((prev) => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx);
      else next.add(idx);
      return next;
    });
  };

  const reset = () => setChecked(new Set());

  return (
    <div className="bg-white rounded-lg border border-brand-cream overflow-hidden">
      <div className="p-5 border-b border-brand-cream">
        <h2 className="font-heading text-xl mb-1">{process.title}</h2>
        <p className="text-sm text-brand-taupe">{process.subtitle}</p>
        {checked.size > 0 && (
          <p className="text-xs text-brand-gold mt-2">
            {checked.size} van {process.steps.length} stappen afgevinkt{" "}
            <button onClick={reset} className="underline ml-1 hover:text-brand-dark">
              reset
            </button>
          </p>
        )}
      </div>

      <ol className="divide-y divide-brand-cream">
        {process.steps.map((step, idx) => {
          const done = checked.has(idx);
          return (
            <li key={idx}>
              <button
                onClick={() => toggle(idx)}
                className={`w-full text-left px-5 py-4 flex gap-4 transition-colors hover:bg-brand-light/50 ${
                  done ? "bg-green-50/50" : ""
                }`}
              >
                <span
                  className={`flex-shrink-0 w-7 h-7 rounded-full border-2 flex items-center justify-center text-xs font-bold mt-0.5 ${
                    done
                      ? "bg-green-500 border-green-500 text-white"
                      : "border-brand-cream text-brand-taupe"
                  }`}
                >
                  {done ? "✓" : idx + 1}
                </span>
                <div className="min-w-0">
                  <p
                    className={`font-medium text-sm ${
                      done ? "text-brand-taupe line-through" : "text-brand-dark"
                    }`}
                  >
                    {step.title}
                  </p>
                  <p className="text-sm text-brand-taupe mt-1 leading-relaxed">
                    {step.description}
                  </p>
                  {step.tip && (
                    <p className="text-xs text-orange-600 mt-2 bg-orange-50 rounded px-2 py-1 inline-block">
                      Tip: {step.tip}
                    </p>
                  )}
                </div>
              </button>
            </li>
          );
        })}
      </ol>

      {process.links && process.links.length > 0 && (
        <div className="px-5 py-3 bg-brand-light/50 border-t border-brand-cream flex flex-wrap gap-2">
          {process.links.map((link) =>
            link.external ? (
              <a
                key={link.href}
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs px-3 py-1.5 rounded border border-brand-cream bg-white text-brand-taupe hover:border-brand-gold transition-colors"
              >
                {link.label} &rarr;
              </a>
            ) : (
              <Link
                key={link.href}
                href={link.href}
                className="text-xs px-3 py-1.5 rounded border border-brand-cream bg-white text-brand-taupe hover:border-brand-gold transition-colors"
              >
                {link.label}
              </Link>
            )
          )}
        </div>
      )}
    </div>
  );
}

export default function ProcessenPage() {
  const [tab, setTab] = useState<"verkoop" | "retour">("verkoop");

  const visible = PROCESSES.filter((p) =>
    tab === "verkoop"
      ? p.id.startsWith("verkoop")
      : p.id.startsWith("retour")
  );

  return (
    <div className="min-h-screen bg-brand-light pt-32 pb-20 px-6">
      <div className="max-w-3xl mx-auto">
        <Link
          href="/admin"
          className="text-xs text-brand-taupe hover:text-brand-gold transition-colors uppercase tracking-widest"
        >
          &larr; Admin
        </Link>
        <h1 className="font-heading text-3xl mt-2 mb-2">Verkoop &amp; Retour</h1>
        <p className="text-brand-taupe mb-8">
          Stap-voor-stap handleiding voor verkoop en retouren. Vink stappen af
          tijdens het werk — reset per proces wanneer je klaar bent.
        </p>

        <div className="flex gap-2 mb-8">
          <button
            onClick={() => setTab("verkoop")}
            className={`px-4 py-2 text-sm rounded border transition-colors ${
              tab === "verkoop"
                ? "bg-brand-dark text-white border-brand-dark"
                : "bg-white border-brand-cream text-brand-taupe hover:border-brand-gold"
            }`}
          >
            Verkoop
          </button>
          <button
            onClick={() => setTab("retour")}
            className={`px-4 py-2 text-sm rounded border transition-colors ${
              tab === "retour"
                ? "bg-brand-dark text-white border-brand-dark"
                : "bg-white border-brand-cream text-brand-taupe hover:border-brand-gold"
            }`}
          >
            Retour
          </button>
        </div>

        <div className="space-y-8">
          {visible.map((process) => (
            <ProcessCard key={process.id} process={process} />
          ))}
        </div>

        <div className="mt-10 p-4 bg-brand-cream/50 rounded-lg text-xs text-brand-taupe">
          <p className="font-medium text-brand-dark mb-2">Belangrijk</p>
          <ul className="space-y-1 list-disc list-inside">
            <li>Google Sheet = bron van waarheid voor voorraad</li>
            <li>Na elke verkoop of retour: voorraad direct bijwerken</li>
            <li>QR-code op label scannen = snelste manier om product te vinden</li>
            <li>Bij twijfel over retour: eerst overleggen, dan pas terugbetalen</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
