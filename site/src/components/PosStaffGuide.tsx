"use client";

interface PosStaffGuideProps {
  device: "phone" | "laptop";
}

export function PosStaffGuide({ device }: PosStaffGuideProps) {
  const kassaUrl = device === "phone" ? "/shop/code" : "/admin/verkoop";

  return (
    <div className="mb-4 space-y-2">
      <details className="rounded-lg border border-brand-gold/40 bg-white p-4 text-sm">
        <summary className="cursor-pointer font-medium">
          {device === "phone"
            ? "Telefoon — 5 stappen tot pinnen"
            : "Laptop — 5 stappen tot pinnen"}
        </summary>
        <ol className="mt-3 list-decimal pl-5 space-y-2 text-brand-taupe">
          {device === "phone" ? (
            <>
              <li>
                Open op je telefoon <span className="font-mono text-brand-dark">{kassaUrl}</span>{" "}
                (of via Admin → Verkoop via telefoon).
              </li>
              <li>Tik de behandeling(en) aan. Sieraad erbij? Scan of typ de code van het label.</li>
              <li>
                Tik <strong className="text-brand-dark">Toon QR&apos;s voor POS</strong>.
              </li>
              <li>
                Open de <strong className="text-brand-dark">Shopify POS</strong>-app en scan elke
                QR. De app herkent de barcode (BA-BHL-…).
              </li>
              <li>
                Tik in POS op <strong className="text-brand-dark">Betalen</strong> en pin één keer.
              </li>
            </>
          ) : (
            <>
              <li>
                Open op de laptop <span className="font-mono text-brand-dark">{kassaUrl}</span>{" "}
                (inloggen als admin).
              </li>
              <li>Tik de behandeling(en) aan, of zoek een productcode.</li>
              <li>
                Tik <strong className="text-brand-dark">Toon QR&apos;s voor POS</strong>.
              </li>
              <li>
                Scan de QR&apos;s met de telefoon in de Shopify POS-app, of typ dezelfde code in
                het zoekvak van POS op de laptop.
              </li>
              <li>
                Tik in POS op <strong className="text-brand-dark">Betalen</strong> en pin één keer.
              </li>
            </>
          )}
        </ol>
      </details>

      <details className="rounded-lg border border-brand-cream bg-white p-4 text-sm">
        <summary className="cursor-pointer font-medium">
          Liever alleen in de Shopify POS-app tikken?
        </summary>
        <div className="mt-3 space-y-3 text-brand-taupe">
          <p>
            Behandelingen staan in Shopify op het kanaal <strong className="text-brand-dark">Point of Sale</strong>.
            Je kunt ze zoeken — een tegel op het startscherm moeten we in de app zelf zetten.
          </p>
          <p className="text-xs uppercase tracking-widest text-brand-taupe">Zoeken (elke verkoop)</p>
          <ol className="list-decimal pl-5 space-y-1">
            <li>Open Shopify POS.</li>
            <li>Tik op het zoekveld bovenin.</li>
            <li>Typ de naam, bijvoorbeeld &quot;Brow wax&quot;.</li>
            <li>
              Tik de behandeling aan — daarna <strong className="text-brand-dark">Betalen</strong>.
            </li>
          </ol>
          <p className="text-xs uppercase tracking-widest text-brand-taupe">Tegel op het startscherm (één keer)</p>
          <ol className="list-decimal pl-5 space-y-1">
            <li>In POS: tik rechtsboven op het potlood (raster bewerken).</li>
            <li>Kies <strong className="text-brand-dark">Tegel toevoegen</strong>.</li>
            <li>Kies Product en zoek de behandeling, of een slimme collectie.</li>
            <li>Sla op. Daarna is het één tik op het startscherm.</li>
          </ol>
          {device === "laptop" && (
            <p>
              Shopify POS is vooral een telefoon- of iPad-app. Op de laptop gebruik je deze
              kassa, of dezelfde zoekbalk als de POS-app op de computer staat.
            </p>
          )}
        </div>
      </details>
    </div>
  );
}
