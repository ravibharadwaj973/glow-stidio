import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, Camera } from 'lucide-react';
import { GalleryGrid } from '@/components/gallery-grid';
import { populatedCollections, totalPhotos } from '@/lib/gallery';
import { SALON } from '@/lib/salon';

export const metadata: Metadata = {
  title: 'Our work',
  description: `Colour, cuts and skin work from ${SALON.name}, ${SALON.tagline.toLowerCase()}.`,
};

/**
 * A page rather than a strip on the homepage, for two reasons.
 *
 * It is the page the salon sends people to. "Here is what we did this month"
 * with a link needs somewhere to land that is about the work and nothing else
 * — a homepage anchor drops somebody halfway down a page they then have to
 * orient themselves in.
 *
 * And it is the page worth measuring. A customer who opens the gallery after a
 * message has told the salon something specific, in a way that opening the
 * homepage does not.
 */
export default function GalleryPage() {
  const collections = populatedCollections();

  return (
    <main className="mx-auto max-w-6xl px-5 py-16 sm:py-20">
      <p className="eyebrow">Our work</p>
      <h1 className="display mt-3 text-4xl sm:text-5xl">What we have been doing</h1>
      <p className="mt-4 max-w-xl text-base leading-relaxed text-ink-muted">
        Every picture here was taken in this room, of work done by this team. Nothing bought in, nothing borrowed.
      </p>

      <div className="mt-10">
        {collections.length === 0 ? (
          /**
           * Said plainly, and once.
           *
           * The alternative — a grid of grey rectangles, or "coming soon"
           * repeated under six headings — tells a customer the salon does not
           * finish things. One honest line and a route onward does not.
           */
          <div className="card max-w-lg px-6 py-10 text-center">
            <Camera className="mx-auto h-6 w-6 text-glow-400" aria-hidden />
            <p className="mt-3 text-sm leading-relaxed text-ink-muted">
              We are photographing our recent work properly rather than putting up phone snaps. It will be here
              shortly.
            </p>
            <Link href="/#book" className="btn-primary mt-6 h-11">
              Book an appointment
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        ) : (
          <GalleryGrid collections={collections} />
        )}
      </div>

      {collections.length > 0 ? (
        <div className="mt-20 border-t border-stone-200 pt-10">
          <h2 className="display text-2xl">Like something you have seen?</h2>
          <p className="mt-1.5 max-w-lg text-sm leading-relaxed text-ink-muted">
            Bring the picture with you, or mention it when you book — it is far easier to work from than a
            description.
          </p>
          <Link href="/#book" className="btn-primary mt-5 h-11">
            Book an appointment
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      ) : null}

      <p className="sr-only">{totalPhotos()} photographs</p>
    </main>
  );
}
