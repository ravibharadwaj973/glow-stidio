/**
 * PHOTOGRAPHS LIVE IN CLOUDINARY, NOT IN THIS REPOSITORY.
 *
 * A salon's gallery changes weekly. Committing images to a git repository and
 * redeploying to add three photographs of a balayage is a workflow no salon
 * owner will ever use twice — which is how galleries end up eighteen months
 * out of date and quietly removed.
 *
 * ── How a salon adds a photograph ────────────────────────────────────────
 *
 *   1. Upload it in Cloudinary (the web app, or the phone app).
 *   2. Tag it with the collection's tag: gallery-colour, gallery-cuts, and so
 *      on — the tags are named in gallery.ts.
 *   3. Set its `alt` context field to a sentence saying what is in the picture.
 *
 * It appears on the site within the hour. No deploy, no developer.
 *
 * ── Why tag lists, and not the Admin API ─────────────────────────────────
 *
 * Cloudinary's Admin API needs an API secret. A secret in a website is a
 * secret on the internet — even server-side in Next, it ends up in a .env on
 * every host the site runs on, and it can delete every image in the account.
 * The tag-list endpoint below is unsigned, public, read-only, and returns
 * exactly the images the salon deliberately tagged.
 *
 * ONE THING TO SWITCH ON: Cloudinary disables this endpoint by default
 * (Settings → Security → "Resource list" under Restricted media types).
 * Until it is unchecked, the list URL returns 404 and this site quietly falls
 * back to whatever local photographs are named in gallery.ts. That is the
 * right failure: a gallery with four studio pictures beats an error page.
 */

export const CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME ?? '';

export const cloudinaryConfigured = Boolean(CLOUD_NAME);

export interface CloudinaryImage {
  publicId: string;
  format: string;
  width: number;
  height: number;
  /** From the image's `alt` context field in Cloudinary. */
  alt: string | null;
  /** From its `caption` context field. */
  caption: string | null;
}

interface ListResource {
  public_id?: string;
  format?: string;
  width?: number;
  height?: number;
  context?: { custom?: Record<string, string> } & Record<string, unknown>;
}

/**
 * A delivery URL, with the transformations that matter.
 *
 * `f_auto` serves AVIF or WebP to browsers that take them and JPEG to the
 * rest; `q_auto` picks a quality per image rather than one number for all of
 * them. Together they are usually the difference between a 2.4MB phone
 * photograph and 90KB — which on an Indian mobile connection is the
 * difference between a gallery somebody scrolls and one they leave.
 *
 * `dpr_auto` sends the retina version only to retina screens, so a phone is
 * not made to download a picture at twice the size it can show.
 */
export function cldUrl(
  publicId: string,
  options: { width?: number; height?: number; crop?: 'fill' | 'fit' } = {},
): string {
  const parts = ['f_auto', 'q_auto', 'dpr_auto'];
  if (options.width) parts.push(`w_${options.width}`);
  if (options.height) parts.push(`h_${options.height}`);
  parts.push(`c_${options.crop ?? 'fill'}`);
  // g_auto lets Cloudinary decide what to keep when it crops. On a photograph
  // of a finished cut, the alternative is a centre crop that removes the head.
  if ((options.crop ?? 'fill') === 'fill') parts.push('g_auto');

  return `https://res.cloudinary.com/${CLOUD_NAME}/image/upload/${parts.join(',')}/${publicId}`;
}

/**
 * Every image carrying one tag.
 *
 * Cached for an hour rather than fetched per request: a gallery does not
 * change between two people looking at it, and an upstream that is briefly
 * slow must not make the salon's website briefly slow.
 *
 * Returns an empty list on anything at all going wrong — the tag not existing
 * yet, list delivery still restricted, Cloudinary being down. The caller
 * treats an empty collection as "nothing to show here", which is already how
 * it treats a collection nobody has filled in.
 */
export async function imagesByTag(tag: string): Promise<CloudinaryImage[]> {
  if (!cloudinaryConfigured) return [];

  try {
    const response = await fetch(
      `https://res.cloudinary.com/${CLOUD_NAME}/image/list/${encodeURIComponent(tag)}.json`,
      { next: { revalidate: 3600 } },
    );
    if (!response.ok) return [];

    const data = (await response.json()) as { resources?: ListResource[] };

    return (data.resources ?? [])
      .filter((resource): resource is ListResource & { public_id: string } => Boolean(resource.public_id))
      .map((resource) => {
        const context = resource.context?.custom ?? {};
        return {
          publicId: resource.public_id,
          format: resource.format ?? 'jpg',
          width: resource.width ?? 0,
          height: resource.height ?? 0,
          alt: context.alt?.trim() || null,
          caption: context.caption?.trim() || null,
        };
      });
  } catch {
    return [];
  }
}
