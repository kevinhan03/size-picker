import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { cookies } from "next/headers";
import {
  buildProductMetadata,
  fetchProduct,
  isPrimaryColumnHeader,
  resolveImageUrl,
} from "../../../server/utils/product-detail";
import {
  getDisplaySizeTable,
  normalizeMeasurementValueForDisplay,
  translateMeasurementLabel,
} from "../../../server/utils/size-table.js";
import type { SizeTable } from "../../../src/types";
import { getLocale, LOCALE_COOKIE_NAME } from "../../../src/i18n/locale";
import { translate } from "../../../src/i18n/messages";

export const revalidate = 3600;

function displayTableCell(value: unknown): string {
  return normalizeMeasurementValueForDisplay(value) || "-";
}

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  return buildProductMetadata(await fetchProduct(id));
}

export default async function ProductPage({ params }: Props) {
  const { id } = await params;
  const [product, cookieStore] = await Promise.all([fetchProduct(id), cookies()]);
  if (!product) notFound();

  const locale = getLocale(cookieStore.get(LOCALE_COOKIE_NAME)?.value);
  const t = (key: Parameters<typeof translate>[1], values?: Record<string, string | number>) =>
    translate(locale, key, values);

  const imageUrl = resolveImageUrl(product.imagePath || product.image || "");
  const displaySizeTable = getDisplaySizeTable(product) as SizeTable | null;
  const headers = displaySizeTable?.headers ?? [];
  const rows = displaySizeTable?.rows ?? [];
  const extraHeaders = displaySizeTable?.extra?.headers ?? [];
  const extraRows = displaySizeTable?.extra?.rows ?? [];

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
            {t("product.backToSaved")}
          </Link>

          <div className="mb-8 flex flex-col items-start gap-6 sm:flex-row">
            {imageUrl && (
              <div className="flex h-40 w-40 flex-shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-white/[0.06]">
                {/* eslint-disable-next-line @next/next/no-img-element -- Preserve native loading for arbitrary product image URLs. */}
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
                  {t("product.visitOfficialSite")}
                </a>
              )}
            </div>
          </div>

          <section>
            <h2 className="mb-3 text-sm font-bold uppercase tracking-widest text-gray-400">{t("sizeTable.title")}</h2>
            {headers.length > 0 ? (
              <div className="overflow-x-auto rounded-2xl border border-white/[0.06] bg-white/[0.04]">
                <div className="px-4 pt-2 text-right text-xs font-semibold text-gray-500">{t("product.unit")}</div>
                <table className="min-w-full text-center text-sm">
                  <thead>
                    <tr>
                      {headers.map((header, index) => (
                        <th
                          key={index}
                          className={`whitespace-nowrap bg-white/[0.04] px-4 py-3 text-xs font-bold uppercase ${index === 0 ? "border-r border-white/[0.06]" : ""}`}
                          style={{ color: isPrimaryColumnHeader(header) ? "#E5E7EB" : "#00FF00" }}
                        >
                          {translateMeasurementLabel(header, locale === "en")}
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
                            {displayTableCell(cell)}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-sm text-gray-500">{t("product.noSizeData")}</p>
            )}
            {extraHeaders.length > 0 ? (
              <details className="mt-3 overflow-hidden rounded-2xl border border-white/[0.06] bg-white/[0.03]">
                <summary className="cursor-pointer px-4 py-3 text-xs font-bold uppercase tracking-widest text-gray-300 transition hover:bg-white/[0.05] hover:text-white">
                  {t("product.extraMeasurements")}
                </summary>
                <div className="overflow-x-auto border-t border-white/[0.06]">
                  <table className="min-w-full text-center text-sm">
                    <thead>
                      <tr>
                        {extraHeaders.map((header, index) => (
                          <th
                            key={index}
                            className={`whitespace-nowrap bg-white/[0.04] px-4 py-3 text-xs font-bold uppercase ${index === 0 ? "border-r border-white/[0.06]" : ""}`}
                            style={{ color: isPrimaryColumnHeader(header) ? "#E5E7EB" : "#00FF00" }}
                          >
                            {translateMeasurementLabel(header, locale === "en")}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {extraRows.map((row: string[], rowIndex: number) => (
                        <tr key={rowIndex} className="border-t border-white/[0.04]">
                          {row.map((cell: string, cellIndex: number) => (
                            <td
                              key={cellIndex}
                              className={`whitespace-nowrap px-4 py-3 text-gray-200 ${cellIndex === 0 ? "border-r border-white/[0.06] text-xs font-bold" : ""}`}
                            >
                              {displayTableCell(cell)}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </details>
            ) : null}
          </section>
        </div>
      </div>
    </>
  );
}
