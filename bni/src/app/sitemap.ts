import type { MetadataRoute } from "next";
import { getAmbassadors, getChapter, getMembers, getPastEvents, getUpcomingEvents } from "@/lib/data";
import { env } from "@/lib/env";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [chapter, members, ambassadors, past, upcoming] = await Promise.all([
    getChapter(),
    getMembers(),
    getAmbassadors(),
    getPastEvents(),
    getUpcomingEvents(),
  ]);
  const base = env.siteUrl;
  const pages: MetadataRoute.Sitemap = [
    { url: base, changeFrequency: "weekly", priority: 1 },
    { url: `${base}/visit`, changeFrequency: "monthly", priority: 0.9 },
    { url: `${base}/members`, changeFrequency: "weekly", priority: 0.8 },
    { url: `${base}/categories`, changeFrequency: "weekly", priority: 0.8 },
    { url: `${base}/meetings`, changeFrequency: "weekly", priority: 0.7 },
    { url: `${base}/gallery`, changeFrequency: "weekly", priority: 0.6 },
    { url: `${base}/about`, changeFrequency: "monthly", priority: 0.6 },
  ];
  // Sample (seed) content never goes into the sitemap.
  for (const e of [...upcoming, ...past]) {
    if (e.isSample) continue;
    pages.push({ url: `${base}/meetings/${e.slug}`, lastModified: e.updatedAt, priority: 0.5 });
  }
  if (chapter.membersIndexable) {
    for (const m of [...members, ...ambassadors]) {
      if (m.isSample) continue;
      pages.push({ url: `${base}/members/${m.slug}`, lastModified: m.updatedAt, priority: 0.5 });
    }
  }
  return pages;
}
