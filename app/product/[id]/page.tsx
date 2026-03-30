import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { createProductStack } from "../../../server/bootstrap/products.js";

export const revalidate = 3600;

const {
  SUPABASE_PRODUCTS_TABLE,
  normalizeProductRow,
  refreshBrandRulesCache,
  supabase,
} = createProductStack();

interface Props {
  params: Promise<{ id: string }>;
}

// URL 파라미터에서 숫자 ID 추출: "26-boogieholiday-pea-coat" → "26"
function parseNumericId(param: string): string {
  const match = param.match(/^(\d+)/);
  return match ? match[1] : param;
}

async function fetchProduct(idParam: string) {
  if (!supabase) return null;
  const id = parseNumericId(idParam);
  await refreshBrandRulesCache();
  const { data, error } = await supabase
    .from(SUPABASE_PRODUCTS_TABLE)
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error || !data) return null;
  return normalizeProductRow(data);
}

function resolveImageUrl(imagePath: string): string {
  if (!imagePath) return "";
  if (imagePath.startsWith("http")) return imagePath;
  const supabaseUrl = (process.env.SUPABASE_URL || "").trim();
  const bucket = (process.env.SUPABASE_STORAGE_BUCKET || "product-assets").trim();
  return `${supabaseUrl}/storage/v1/object/public/${bucket}/${imagePath}`;
}

function isPrimaryColumnHeader(value: string): boolean {
  const normalized = value.trim().toLowerCase();
  return normalized === "항목" || normalized === "사이즈" || /^size$/i.test(normalized);
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const product = await fetchProduct(id);
  if (!product) {
    return { title: "상품을 찾을 수 없습니다 | DIGDA" };
  }

  const imageUrl = resolveImageUrl(product.imagePath || product.image || "");
  const description = `${product.brand} ${product.name}의 사이즈표를 확인하세요. 카테고리: ${product.category}`;

  return {
    title: `${product.brand} ${product.name} 사이즈표 | DIGDA`,
    description,
    openGraph: {
      title: `${product.brand} ${product.name}`,
      description,
      images: imageUrl ? [{ url: imageUrl }] : [],
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: `${product.brand} ${product.name} 사이즈표`,
      description,
      images: imageUrl ? [imageUrl] : [],
    },
  };
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
      />
      <div className="min-h-screen bg-black text-white font-sans px-4 py-8">
        <div className="max-w-3xl mx-auto">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-white transition mb-8"
          >
            ← DIGDA 홈으로
          </Link>

          <div className="flex flex-col sm:flex-row gap-6 items-start mb-8">
            {imageUrl && (
              <div className="flex-shrink-0 w-40 h-40 rounded-2xl bg-white/[0.06] flex items-center justify-center overflow-hidden">
                <img
                  src={imageUrl}
                  alt={product.name}
                  className="max-w-full max-h-full object-contain"
                />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2">
                <span className="px-2 py-0.5 bg-orange-500/10 rounded-md text-sm font-bold text-orange-500 uppercase">
                  {product.brand}
                </span>
                <span className="text-sm text-gray-500">{product.category}</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold text-white mb-3">
                {product.name}
              </h1>
              {product.url && product.url !== "#" && (
                <a
                  href={product.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-sm text-gray-300 hover:text-orange-400 transition"
                >
                  공식 페이지 바로가기 ↗
                </a>
              )}
            </div>
          </div>

          <section>
            <h2 className="text-sm font-bold uppercase tracking-widest text-gray-400 mb-3">
              사이즈표
            </h2>
            {headers.length > 0 ? (
              <div className="overflow-x-auto rounded-2xl bg-white/[0.04] border border-white/[0.06]">
                <table className="min-w-full text-center text-sm">
                  <thead>
                    <tr>
                      {headers.map((header, i) => (
                        <th
                          key={i}
                          className={`whitespace-nowrap px-4 py-3 text-xs font-bold uppercase bg-white/[0.04] ${i === 0 ? "border-r border-white/[0.06]" : ""}`}
                          style={{ color: isPrimaryColumnHeader(header) ? "#E5E7EB" : "#00FF00" }}
                        >
                          {header}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((row: string[], ri: number) => (
                      <tr key={ri} className="border-t border-white/[0.04]">
                        {row.map((cell: string, ci: number) => (
                          <td
                            key={ci}
                            className={`whitespace-nowrap px-4 py-3 text-gray-200 ${ci === 0 ? "border-r border-white/[0.06] font-bold text-xs" : ""}`}
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
              <p className="text-gray-500 text-sm">사이즈표 데이터가 없습니다.</p>
            )}
          </section>
        </div>
      </div>
    </>
  );
}
