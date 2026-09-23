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
export function Photo({
  src,
  alt,
  className,
}: {
  src: string | null | undefined;
  /**
   * What is in the picture. Required rather than optional: these are the
   * salon's room and the salon's people, and a customer using a screen reader
   * is choosing where to spend an afternoon on the same information.
   */
  alt: string;
  className?: string;
}) {
  if (!src) return <div className={`photo-slot ${className ?? ''}`} aria-hidden />;

  return (
    <div className={`photo-slot ${className ?? ''}`}>
      {/* A plain img rather than next/image: these are a handful of static
          pictures on one page, and the config next/image needs for remote and
          local sources is more to get wrong than it saves here. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt={alt} className="h-full w-full object-cover" loading="lazy" />
    </div>
  );
}
