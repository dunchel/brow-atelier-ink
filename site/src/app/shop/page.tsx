import type { Metadata } from "next";
import { getAllProducts } from "@/lib/products";
import { ShopFilter } from "@/components/ShopFilter";

export const metadata: Metadata = {
  title: "Shop | Producten",
  description:
    "Shop de mooiste beauty producten en statement pieces bij Brow Atelier & Ink. Brow producten, verzorging, sieraden en meer.",
};

export const revalidate = 300;

export default async function ShopPage() {
  let products: Awaited<ReturnType<typeof getAllProducts>> = [];
  try {
    products = await getAllProducts();
  } catch {
    // Data source not available yet
  }

  return (
    <>
      <section className="pt-32 pb-12 bg-brand-cream">
        <div className="max-w-4xl mx-auto text-center px-6">
          <p className="text-xs tracking-[0.3em] uppercase text-brand-gold mb-3">
            Brow Atelier &amp; Ink
          </p>
          <h1 className="font-heading text-4xl md:text-6xl mb-4">Shop</h1>
          <p className="text-brand-taupe max-w-2xl mx-auto">
            Shop de mooiste statement pieces en beauty producten. Binnenlopen
            kan altijd zonder afspraak!
          </p>
        </div>
      </section>

      <section className="section-padding bg-white">
        <div className="max-w-7xl mx-auto">
          {products.length > 0 ? (
            <ShopFilter products={products} />
          ) : (
            <div className="text-center py-20">
              <div className="max-w-md mx-auto">
                <h2 className="font-heading text-2xl mb-4">
                  Shop komt binnenkort!
                </h2>
                <p className="text-brand-taupe mb-8">
                  We zijn bezig met het toevoegen van onze producten. Kom snel
                  terug, of loop gerust binnen in ons atelier om de collectie te
                  bekijken.
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {[1, 2, 3, 4, 5, 6].map((i) => (
                    <div
                      key={i}
                      className="aspect-square bg-brand-cream rounded-lg animate-pulse"
                    />
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </section>
    </>
  );
}
