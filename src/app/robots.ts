import type { MetadataRoute } from 'next';
import { SITE_URL } from '@/lib/salon';

/**
 * Nothing here was hidden before — there was simply no robots.txt at all, and
 * a crawler that cannot find one has to guess.
 *
 * Everything on this site is meant to be found, with one exception: the
 * feedback and invoice links carry an id that identifies one customer's visit.
 * They are unguessable rather than secret, but a crawler following one from a
 * shared screenshot would put a real person's bill in a search index.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/feedback/', '/invoice/', '/api/'],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
