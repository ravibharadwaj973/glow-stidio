'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { Photo } from './photo';
import { Lightbox } from './lightbox';
import { ShortlistBar } from './shortlist-bar';
import type { GalleryCollection } from '@/lib/gallery';
import { track } from '@/lib/track';

/**
 * THE WORK, WITH A WAY THROUGH IT.
 *
 * Two decisions, both about somebody deciding whether to book:
 *
 *  - FILTERED, NOT PAGED. A customer arrives wanting to know one thing — can
 *    they do balayage — and a single scroll of everything makes them hunt for
 *    the answer among haircuts. The chips are the question they came with.
 *  - "ALL" IS THE DEFAULT, because a customer who has not decided yet is the
 *    more common one, and the collections read as a tour in that order.
 *
 * A masonry-ish grid rather than uniform squares: a full-length cut cropped to
 * a square loses the length, which is the thing being shown. Portrait pictures
 * get a taller cell and the grid flows around them.
 */
export function GalleryGrid({ collections }: { collections: GalleryCollection[] }) {
  const [active, setActive] = useState<string>('all');
  /** Which photograph is open, as an index into `flat`. Null is closed. */
  const [open, setOpen] = useState<number | null>(null);

  const showing = active === 'all' ? collections : collections.filter((c) => c.key === active);

  /**
   * Every photograph currently on the page, in the order it appears.
   *
   * The lightbox's arrows walk this, so they move through exactly what the
   * filter is showing — flicking through "Hair" stays in Hair, and flicking
   * through "Everything" crosses from one collection into the next the same
   * way scrolling does. Anything else and the arrows disagree with the page.
   *
   * Keyed on `collections` and `active` rather than `showing`, which is a new
   * array on every render.
   */
  const flat = useMemo(
    () => (active === 'all' ? collections : collections.filter((c) => c.key === active)).flatMap((c) => c.photos),
    [collections, active],
  );

  /** src is already this grid's React key, so it is unique per photograph. */
  const indexOf = useMemo(() => new Map(flat.map((photo, index) => [photo.src, index])), [flat]);

  const choose = (key: string, label: string) => {
    setActive(key);
    // The open photograph's index belongs to the old filter. Keeping it open
    // would show a different picture than the one they were looking at.
    setOpen(null);
    // Which work a visitor looked at is the single most useful thing this page
    // knows. See lib/track.ts for what is and is not sent.
    track('gallery_filter', { collection: key }, label);
  };

  return (
    <>
      {collections.length > 1 ? (
        <div className="mb-10 flex flex-wrap gap-2" role="group" aria-label="Filter by service">
          <Chip label="Everything" active={active === 'all'} onClick={() => choose('all', 'Everything')} />
          {collections.map((collection) => (
            <Chip
              key={collection.key}
              label={collection.label}
              active={active === collection.key}
              onClick={() => choose(collection.key, collection.label)}
            />
          ))}
        </div>
      ) : null}

      <div className="space-y-16">
        {showing.map((collection) => (
          <section key={collection.key} id={collection.key} className="scroll-mt-24">
            <h2 className="display text-3xl">{collection.label}</h2>
            {/* Optional — the collections are the salon's own categories and
                this site has copy for the common ones only. A bare heading
                reads better than invented filler. */}
            {collection.blurb ? (
              <p className="mt-1.5 max-w-xl text-sm leading-relaxed text-ink-muted">{collection.blurb}</p>
            ) : null}

            <div className="mt-6 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3">
              {collection.photos.map((photo) => (
                <figure key={photo.src} className="group">
                  {/**
                    * The picture itself opens it.
                    *
                    * A button rather than a div with a click handler: this is
                    * the page's main action, and it has to be reachable by
                    * keyboard and announced as something that does something.
                    * The alt text is already a sentence about the picture, so
                    * the label reads properly when it is spoken aloud.
                    */}
                  <button
                    type="button"
                    onClick={() => setOpen(indexOf.get(photo.src) ?? 0)}
                    aria-label={`Open larger: ${photo.alt}`}
                    className="block w-full rounded-xl transition-opacity hover:opacity-95 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-glow-600"
                  >
                    <Photo
                      src={photo.src}
                      alt={photo.alt}
                      className={`w-full rounded-xl ${photo.shape === 'portrait' ? 'aspect-[4/5]' : 'aspect-[4/3]'}`}
                    />
                  </button>

                  {/**
                    * WHAT IT IS, AND HOW TO GET IT. Not what it costs.
                    *
                    * Naming the work is what a photograph cannot do on its own —
                    * somebody who likes a picture does not necessarily know
                    * whether they are looking at balayage or highlights, and
                    * cannot ask for it if they cannot name it.
                    *
                    * No price, deliberately. The work in a photograph almost
                    * never costs what the line item says: length, condition and
                    * how long it took all move it. A figure here starts the
                    * conversation at the counter with the customer feeling
                    * misled, and the gallery's job is to make them want to come
                    * in — the quote belongs to whoever can see their hair.
                    */}
                  {photo.service ? (
                    <p className="mt-2 text-xs font-medium text-ink">{photo.service.name}</p>
                  ) : null}

                  {/* The caption is the salon talking, not a filename. Left off
                      the picture itself so it stays legible on a phone. */}
                  {photo.caption ? (
                    <figcaption className="mt-1 text-xs leading-relaxed text-ink-subtle">{photo.caption}</figcaption>
                  ) : null}

                  {photo.service ? (
                    <Link
                      /* Query BEFORE the hash. "/#book?service=x" puts the query
                         inside the fragment, where location.search cannot see
                         it — the pre-select would silently never fire. */
                      href={`/?service=${photo.service.id}#book`}
                      onClick={() =>
                        /* The strongest signal on the page: not just that they
                           looked at colour, but that they looked at THIS and
                           went for it. */
                        track('service_view', { serviceId: photo.service!.id }, photo.service!.name)
                      }
                      className="mt-1.5 inline-flex items-center gap-1 text-xs font-medium text-glow-700 hover:underline"
                    >
                      Book this
                      <ArrowRight className="h-3 w-3" />
                    </Link>
                  ) : null}
                </figure>
              ))}
            </div>
          </section>
        ))}
      </div>

      {open !== null ? (
        <Lightbox photos={flat} index={open} onMove={setOpen} onClose={() => setOpen(null)} />
      ) : null}

      {/* Renders nothing until something is on the list, so the page is not
          carrying a bar around for a feature nobody has used yet. */}
      <ShortlistBar />
    </>
  );
}

function Chip({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      /* aria-pressed rather than colour alone: which chip is selected has to be
         available to somebody who cannot see the fill. */
      aria-pressed={active}
      className={`rounded-full border px-4 py-1.5 text-sm transition-colors ${
        active
          ? 'border-glow-600 bg-glow-600 text-white'
          : 'border-stone-300 bg-white/70 text-ink-muted hover:border-glow-300 hover:text-ink'
      }`}
    >
      {label}
    </button>
  );
}
