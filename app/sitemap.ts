import type { MetadataRoute } from "next";
import { SUPABASE_PRODUCTS_TABLE } from "../server/config/env.js";
import { assertSupabaseConfig, supabase } from "../server/lib/supabase.js";

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ||
  (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : "http://localhost:3000");

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticUrls: MetadataRoute.Sitemap = [
    {
      url: `${siteUrl}/`,
      changeFrequency: "daily",
      priority: 1,
    },
  ];

  assertSupabaseConfig();
  if (!supabase) throw new Error("Supabase is not configured");
  const { data: products, error } = await supabase
    .from(SUPABASE_PRODUCTS_TABLE)
    .select("id,slug,created_at")
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message || "failed to fetch sitemap products");

  const productUrls: MetadataRoute.Sitemap = products.map((p) => ({
    url: `${siteUrl}/product/${p.slug ? `${p.id}-${p.slug}` : p.id}`,
    changeFrequency: "monthly",
    priority: 0.7,
    lastModified: p.created_at ? new Date(p.created_at) : undefined,
  }));

  return [...staticUrls, ...productUrls];
}
