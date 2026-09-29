import type { MetadataRoute } from 'next';
import { SITE_URL } from '@/lib/salon';

/**
 * The three pages that exist, and their honest priorities.
 *
 * A sitemap listing pages that do not exist is worse than none: it teaches a
 * crawler that this site's claims are unreliable. So this is written by hand
 * from the app directory rather than generated from a wish list — when a
 * per-service page is added, it is added here in the same commit.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  return [
    { url: SITE_URL, lastModified: now, changeFrequency: 'monthly', priority: 1 },
    { url: `${SITE_URL}/gallery`, lastModified: now, changeFrequency: 'weekly', priority: 0.8 },
    { url: `${SITE_URL}/book`, lastModified: now, changeFrequency: 'monthly', priority: 0.9 },
  ];
}
