import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { getAllProducts, getProductBySlug, formatProductPrice } from "@/lib/products";

interface PageProps {
  params: { handle: string };
}

export async function generateStaticParams() {
  try {
    const products = await getAllProducts();
    return products.map((p) => ({ handle: p.handle }));
  } catch {
    return [];
  }
}

export const dynamicParams = true;

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const product = await getProductBySlug(params.handle);
  if (!product) return {};
  return {
    title: product.title,
    description: product.description?.slice(0, 155) || `${product.title} - Brow Atelier & Ink`,
  };
}

export const revalidate = 300;

export default async function ProductPage({ params }: PageProps) {
  const product = await getProductBySlug(params.handle);

  if (!product) {
    notFound();
  }

  return (
    <>
      <section className="pt-28 pb-4 px-6">
        <div className="max-w-7xl mx-auto">
          <Link
            href="/shop"
            className="text-xs uppercase tracking-widest text-brand-taupe hover:text-brand-gold transition-colors"
          >
            &larr; Terug naar shop
          </Link>
        </div>
      </section>

      <section className="section-padding pt-8 bg-white">
        <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-12">
          <div>
            <div className="aspect-square bg-brand-cream rounded-lg overflow-hidden">
              {product.imageUrl ? (
                <img
                  src={product.imageUrl}
                  alt={product.imageAlt}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-brand-taupe">
                  {product.title}
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-col justify-center">
            {product.category && (
              <p className="text-xs tracking-[0.3em] uppercase text-brand-gold mb-2">
                {product.category}
              </p>
            )}
            <h1 className="font-heading text-3xl md:text-4xl mb-4">
              {product.title}
            </h1>
            <div className="flex items-center gap-3 mb-6">
              <p className="font-heading text-2xl text-brand-gold">
                {formatProductPrice(product.price)}
              </p>
              {product.compareAtPrice && (
                <p className="text-lg text-brand-taupe line-through">
                  {formatProductPrice(product.compareAtPrice)}
                </p>
              )}
            </div>

            {product.description && (
              <p className="text-brand-taupe leading-relaxed mb-8">
                {product.description}
              </p>
            )}

            {!product.available && (
              <p className="text-sm text-red-500 font-medium mb-4">
                Dit product is momenteel uitverkocht.
              </p>
            )}

            {product.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-6">
                {product.tags.map((tag) => (
                  <span
                    key={tag}
                    className="px-3 py-1 bg-brand-cream text-brand-taupe text-xs rounded-full"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}

            <p className="text-sm text-brand-taupe mb-6">
              Interesse in dit product? Neem contact op via WhatsApp of loop
              binnen in ons atelier aan de Mierloseweg 14, Helmond.
            </p>
            <div className="flex gap-4">
              <a
                href={`https://wa.me/31623747712?text=${encodeURIComponent(
                  `Hoi! Ik heb interesse in: ${product.title}`
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-primary text-xs"
              >
                Bestel via WhatsApp
              </a>
              <Link href="/contact" className="btn-outline text-xs">
                Contact
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
