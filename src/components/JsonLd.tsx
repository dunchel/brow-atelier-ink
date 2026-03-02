export function LocalBusinessJsonLd() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BeautySalon",
    name: "Brow Atelier & Ink",
    description:
      "Het gezelligste brow & lash atelier van Helmond. Powder brows, lash lift, faux freckles, lip blush, sieraden en meer.",
    url: "https://www.browatelier-ink.com",
    telephone: "+31623747712",
    email: "BrowAtelier.Ink@gmail.com",
    address: {
      "@type": "PostalAddress",
      streetAddress: "Mierloseweg 14",
      addressLocality: "Helmond",
      postalCode: "5707 AM",
      addressCountry: "NL",
    },
    geo: {
      "@type": "GeoCoordinates",
      latitude: 51.4768,
      longitude: 5.6614,
    },
    sameAs: [
      "https://www.instagram.com/browatelier_ink/",
      "https://www.tiktok.com/@browatelier.ink",
    ],
    priceRange: "$$",
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}

export function ServiceJsonLd({
  name,
  description,
}: {
  name: string;
  description: string;
}) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Service",
    name,
    description,
    provider: {
      "@type": "BeautySalon",
      name: "Brow Atelier & Ink",
      address: {
        "@type": "PostalAddress",
        streetAddress: "Mierloseweg 14",
        addressLocality: "Helmond",
        postalCode: "5707 AM",
        addressCountry: "NL",
      },
    },
    areaServed: {
      "@type": "City",
      name: "Helmond",
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}
