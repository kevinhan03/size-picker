import type { MetadataRoute } from "next";
import { SUPABASE_PRODUCTS_TABLE } from "../server/config/env.js";
import { assertSupabaseConfig, supabase } from "../server/lib/supabase.js";
import { normalizeProductRow } from "../server/utils/product.js";

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ||
  (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : "http://localhost:3000");

// Product URLs come from Supabase, so generate this metadata route at request
// time instead of requiring the database to be reachable during `next build`.
export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticUrls: MetadataRoute.Sitemap = [
    {
      url: `${siteUrl}/`,
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: `${siteUrl}/privacy`,
      changeFrequency: "yearly",
      priority: 0.3,
      lastModified: new Date("2026-07-24"),
    },
    {
      url: `${siteUrl}/terms`,
      changeFrequency: "yearly",
      priority: 0.3,
      lastModified: new Date("2026-07-24"),
    },
  ];

  assertSupabaseConfig();
  if (!supabase) throw new Error("Supabase is not configured");
  const { data: products, error } = await supabase
    .from(SUPABASE_PRODUCTS_TABLE)
    .select("id,slug,created_at,brand,name")
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message || "failed to fetch sitemap products");

  // Keep the sitemap aligned with the product route. The route returns a 404
  // when its required public fields are missing, so those incomplete rows must
  // never be submitted to search engines as indexable URLs.
  const productUrls: MetadataRoute.Sitemap = products
    .map((row) => normalizeProductRow(row))
    .filter((product): product is NonNullable<typeof product> => product !== null)
    .map((product) => ({
      url: `${siteUrl}/product/${product.slug ? `${product.id}-${product.slug}` : product.id}`,
      changeFrequency: "monthly",
      priority: 0.7,
      lastModified: product.createdAt ? new Date(product.createdAt) : undefined,
    }));

  return [...staticUrls, ...productUrls];
}
