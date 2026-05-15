import type { MetadataRoute } from "next"
import { createAdminClient } from "@/lib/supabase/admin"

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env["NEXT_PUBLIC_APP_URL"] || "http://localhost:3000"

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: baseUrl, lastModified: new Date(), changeFrequency: "daily", priority: 1 },
    {
      url: `${baseUrl}/eventos`,
      lastModified: new Date(),
      changeFrequency: "hourly",
      priority: 0.9,
    },
    {
      url: `${baseUrl}/entrar`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.3,
    },
    {
      url: `${baseUrl}/privacidade`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.2,
    },
    {
      url: `${baseUrl}/termos`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.2,
    },
  ]

  try {
    const admin = createAdminClient()
    const { data: events } = await admin
      .from("events")
      .select("slug, updated_at")
      .eq("status", "published")
      .limit(1000)

    const eventRoutes: MetadataRoute.Sitemap = (events ?? []).map((e) => ({
      url: `${baseUrl}/eventos/${e.slug}`,
      lastModified: new Date(e.updated_at),
      changeFrequency: "daily" as const,
      priority: 0.8,
    }))

    return [...staticRoutes, ...eventRoutes]
  } catch {
    return staticRoutes
  }
}
