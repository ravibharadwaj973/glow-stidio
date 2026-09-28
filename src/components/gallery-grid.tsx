'use client';

import { useEffect, useMemo, useState } from 'react';
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

  /**
   * ARRIVING FROM A MESSAGE, POINTED AT ONE THING.
   *
   * A follow-up can send somebody to /gallery?service=<id> — "you had a cut,
   * here is our hair spa work" — or ?category=<key> for a whole section. The
   * point is that the link means something specific: a message that promises
   * spa photographs and opens on the whole gallery has broken its promise
   * before the customer has scrolled.
   *
   * Read from location.search in an effect rather than with useSearchParams,
   * which would make this page render on demand and give up the caching the
   * whole gallery depends on. Same reason the booking form reads it this way.
   */
  const [onlyService, setOnlyService] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);

    const service = params.get('service');
    if (service) {
      setOnlyService(service);
      return;
    }

    const category = params.get('category');
    if (category && collections.some((collection) => collection.key === category)) {
      setActive(category);
    }
  }, [collections]);

  /**
   * The name of the service they were sent for, taken from the photographs
   * themselves rather than trusted from the URL — the id in a link is just a
   * string somebody could type.
   */
  const serviceName = useMemo(() => {
    if (!onlyService) return null;
    for (const collection of collections) {
      for (const photo of collection.photos) {
        if (photo.service?.id === onlyService) return photo.service.name;
      }
    }
    return null;
  }, [collections, onlyService]);

  /**
   * Reported once, on arrival, and only once the service is known to be real.
   *
   * This is the event that closes the loop the salon paid for: the follow-up
   * suggested a hair spa, and this says the customer opened it. Reported as
   * service_view because that is what it is — see lib/track.ts, and the note
   * in the backend's engagement module about which events record an interest.
   */
  useEffect(() => {
    if (!onlyService || !serviceName) return;
    track('service_view', { serviceId: onlyService }, serviceName);
  }, [onlyService, serviceName]);

  /**
   * What is on the page: the chosen section, narrowed to one service when the
   * customer arrived from a link that named one.
   *
   * If that service has no photographs, the narrowing is abandoned and the
   * whole gallery is shown. A page that answers "here is our hair spa work"
   * with nothing at all is worse than one that shows everything — and
   * serviceName comes back null in that case too, so the banner below never
   * claims a filter that is not applied.
   */
  const showing = useMemo(() => {
    const base = active === 'all' ? collections : collections.filter((c) => c.key === active);
    if (!onlyService) return base;

    const narrowed = base
      .map((collection) => ({
        ...collection,
        photos: collection.photos.filter((photo) => photo.service?.id === onlyService),
      }))
      .filter((collection) => collection.photos.length > 0);

    return narrowed.length > 0 ? narrowed : base;
  }, [collections, active, onlyService]);

  /**
   * Every photograph currently on the page, in the order it appears.
   *
   * The lightbox's arrows walk this, so they move through exactly what the
   * page is showing — flicking through "Hair" stays in Hair, and a visitor
   * sent to one service flicks through that service's work rather than
   * wandering into the rest of the gallery.
   */
  const flat = useMemo(() => showing.flatMap((c) => c.photos), [showing]);

  /** src is already this grid's React key, so it is unique per photograph. */
  const indexOf = useMemo(() => new Map(flat.map((photo, index) => [photo.src, index])), [flat]);

  const choose = (key: string, label: string) => {
    setActive(key);
    // Tapping a section clears a service narrowing. Without this, somebody
    // sent to one service taps "Hair" and the page appears not to respond,
    // because the service filter is still hiding everything they just asked for.
    setOnlyService(null);
    // The open photograph's index belongs to the old filter. Keeping it open
    // would show a different picture than the one they were looking at.
    setOpen(null);
    // Which work a visitor looked at is the single most useful thing this page
    // knows. See lib/track.ts for what is and is not sent.
    track('gallery_filter', { collection: key }, label);
  };

  return (
    <>
      {/**
        * SAY WHY THEY ARE SEEING A SUBSET, AND OFFER THE REST.
        *
        * Somebody arriving from "here is our hair spa work" should land on
        * hair spa work — but a gallery that silently hides four fifths of
        * itself looks like an empty salon. So the narrowing is stated, and
        * leaving it is one tap.
        */}
      {onlyService && serviceName ? (
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-glow-200 bg-glow-50 px-4 py-3">
          <p className="text-sm text-ink">
            Showing our <span className="font-medium">{serviceName}</span> work
          </p>
          <button
            type="button"
            onClick={() => {
              setOnlyService(null);
              setOpen(null);
              track('gallery_filter', { collection: 'all' }, 'Everything');
            }}
            className="text-xs font-medium text-glow-700 underline underline-offset-2"
          >
            See everything
          </button>
        </div>
      ) : null}

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
