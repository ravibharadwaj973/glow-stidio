import { cldUrl, cloudinaryConfigured } from '@/lib/cloudinary';

/**
 * A photograph, or the gradient that stands in for one.
 *
 * Every picture on this site goes through here so that a salon setting up can
 * add photographs by dropping files in `public/photos/` and naming them in
 * salon.ts — no component to edit, and no half-built state where one slot has a
 * picture and another has a broken image icon.
 *
 * The gradient is not a placeholder in the apologetic sense. A new salon may
 * have no photographs worth publishing for weeks, and a page that looks
 * deliberate without them is worth more than one that looks unfinished until
 * somebody books a photographer.
 */
/**
 * A local path, a full URL, or a Cloudinary public_id.
 *
 * The rule is deliberately something you can apply by eye: anything starting
 * with `/` is a file in `public/`, anything starting with `http` is already a
 * URL, and anything else is a Cloudinary public_id. So a salon moving its
 * photographs to Cloudinary changes `/photos/hero.jpg` to `glow/hero` in
 * salon.ts and nothing else — no component, no second field, no flag.
 *
 * A public_id with no cloud name configured resolves to nothing rather than to
 * a broken image: the gradient comes back, which is a design, and the salon is
 * looking at a missing environment variable rather than a missing photograph.
 */
function resolve(src: string, width: number): string | null {
  if (src.startsWith('/') || src.startsWith('http')) return src;
  return cloudinaryConfigured ? cldUrl(src, { width }) : null;
}

export function Photo({
  src,
  alt,
  className,
  /**
   * The widest this will ever be drawn, so Cloudinary can send that size
   * rather than the original. Only used for Cloudinary sources.
   */
  width = 1200,
}: {
  src: string | null | undefined;
  width?: number;
  /**
   * What is in the picture. Required rather than optional: these are the
   * salon's room and the salon's people, and a customer using a screen reader
   * is choosing where to spend an afternoon on the same information.
   */
  alt: string;
  className?: string;
}) {
  const url = src ? resolve(src, width) : null;
  if (!url) return <div className={`photo-slot ${className ?? ''}`} aria-hidden />;

  return (
    <div className={`photo-slot ${className ?? ''}`}>
      {/* A plain img rather than next/image: these are a handful of static
          pictures on one page, and the config next/image needs for remote and
          local sources is more to get wrong than it saves here. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={url} alt={alt} className="h-full w-full object-cover" loading="lazy" />
    </div>
  );
}
