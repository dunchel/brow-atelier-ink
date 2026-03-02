import Link from "next/link";
import type { Metadata } from "next";
import { getAllProducts, formatProductPrice } from "@/lib/products";

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

  const categories = Array.from(new Set(products.map((p) => p.category).filter(Boolean)));

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
            <>
              {categories.length > 1 && (
                <div className="flex flex-wrap gap-3 mb-10 justify-center">
                  {categories.map((cat) => (
                    <span
                      key={cat}
                      className="px-4 py-1.5 bg-brand-cream text-brand-taupe text-xs uppercase tracking-wider rounded-full"
                    >
                      {cat}
                    </span>
                  ))}
                </div>
              )}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                {products.map((product) => (
                  <Link
                    key={product.id}
                    href={`/shop/${product.handle}`}
                    className="group block"
                  >
                    <div className="aspect-square bg-brand-cream rounded-lg overflow-hidden mb-4 relative">
                      {product.imageUrl ? (
                        <img
                          src={product.imageUrl}
                          alt={product.imageAlt}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-brand-taupe text-sm">
                          {product.title}
                        </div>
                      )}
                      {!product.available && (
                        <div className="absolute inset-0 bg-white/60 flex items-center justify-center">
                          <span className="text-sm font-medium text-brand-dark">
                            Uitverkocht
                          </span>
                        </div>
                      )}
                    </div>
                    <h3 className="font-heading text-base mb-1 group-hover:text-brand-gold transition-colors">
                      {product.title}
                    </h3>
                    <div className="flex items-center gap-2">
                      <p className="text-sm text-brand-dark font-medium">
                        {formatProductPrice(product.price)}
                      </p>
                      {product.compareAtPrice && (
                        <p className="text-xs text-brand-taupe line-through">
                          {formatProductPrice(product.compareAtPrice)}
                        </p>
                      )}
                    </div>
                    {product.category && (
                      <p className="text-xs text-brand-taupe mt-1">
                        {product.category}
                      </p>
                    )}
                  </Link>
                ))}
              </div>
            </>
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
