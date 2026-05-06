import type { MetadataRoute } from "next";
import { fetchInitialProducts } from "../server/utils/products-list";

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

  const products = await fetchInitialProducts();
  const productUrls: MetadataRoute.Sitemap = products.map((p) => ({
    url: `${siteUrl}/product/${p.slug ? `${p.id}-${p.slug}` : p.id}`,
    changeFrequency: "monthly",
    priority: 0.7,
    lastModified: p.createdAt ? new Date(p.createdAt) : undefined,
  }));

  return [...staticUrls, ...productUrls];
}
