import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import {
  buildProductMetadata,
  fetchProduct,
  isPrimaryColumnHeader,
  resolveImageUrl,
} from "../../../server/utils/product-detail";

export const revalidate = 3600;

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  return buildProductMetadata(await fetchProduct(id));
}

export default async function ProductPage({ params }: Props) {
  const { id } = await params;
  const product = await fetchProduct(id);
  if (!product) notFound();

  const imageUrl = resolveImageUrl(product.imagePath || product.image || "");
  const headers = product.sizeTable?.headers ?? [];
  const rows = product.sizeTable?.rows ?? [];

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    brand: { "@type": "Brand", name: product.brand },
    category: product.category,
    ...(imageUrl ? { image: imageUrl } : {}),
    ...(product.url && product.url !== "#" ? { url: product.url } : {}),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        suppressHydrationWarning
      />
      <div className="min-h-screen bg-black px-4 py-8 font-sans text-white">
        <div className="mx-auto max-w-3xl">
          <Link
            href="/"
            className="mb-8 inline-flex items-center gap-1.5 text-sm text-gray-400 transition hover:text-white"
          >
            DIGBOX로 돌아가기
          </Link>

          <div className="mb-8 flex flex-col items-start gap-6 sm:flex-row">
            {imageUrl && (
              <div className="flex h-40 w-40 flex-shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-white/[0.06]">
                <img src={imageUrl} alt={product.name} className="max-h-full max-w-full object-contain" />
              </div>
            )}
            <div className="min-w-0 flex-1">
              <div className="mb-2 flex items-center gap-2">
                <span className="rounded-md bg-orange-500/10 px-2 py-0.5 text-sm font-bold uppercase text-orange-500">
                  {product.brand}
                </span>
                <span className="text-sm text-gray-500">{product.category}</span>
              </div>
              <h1 className="mb-3 text-2xl font-bold text-white sm:text-3xl">{product.name}</h1>
              {product.url && product.url !== "#" && (
                <a
                  href={product.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-sm text-gray-300 transition hover:text-orange-400"
                >
                  공식 페이지 바로가기
                </a>
              )}
            </div>
          </div>

          <section>
            <h2 className="mb-3 text-sm font-bold uppercase tracking-widest text-gray-400">사이즈표</h2>
            {headers.length > 0 ? (
              <div className="overflow-x-auto rounded-2xl border border-white/[0.06] bg-white/[0.04]">
                <table className="min-w-full text-center text-sm">
                  <thead>
                    <tr>
                      {headers.map((header, index) => (
                        <th
                          key={index}
                          className={`whitespace-nowrap bg-white/[0.04] px-4 py-3 text-xs font-bold uppercase ${index === 0 ? "border-r border-white/[0.06]" : ""}`}
                          style={{ color: isPrimaryColumnHeader(header) ? "#E5E7EB" : "#00FF00" }}
                        >
                          {header}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((row: string[], rowIndex: number) => (
                      <tr key={rowIndex} className="border-t border-white/[0.04]">
                        {row.map((cell: string, cellIndex: number) => (
                          <td
                            key={cellIndex}
                            className={`whitespace-nowrap px-4 py-3 text-gray-200 ${cellIndex === 0 ? "border-r border-white/[0.06] text-xs font-bold" : ""}`}
                          >
                            {cell}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-sm text-gray-500">사이즈표 데이터가 없습니다.</p>
            )}
          </section>
        </div>
      </div>
    </>
  );
}
