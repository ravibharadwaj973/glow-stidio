'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { Photo } from './photo';
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
/**
 * Rupees, the way a price list writes them.
 *
 * Kept here rather than pulled from a formatting library: this site renders
 * exactly one kind of number, and Intl gives "₹2,500.00" where a salon's menu
 * says "₹2,500" — the paise are noise on a price nobody pays in paise.
 */
function money(value: string | number): string {
  const amount = Math.round(Number(value));
  return Number.isFinite(amount) ? `₹${amount.toLocaleString('en-IN')}` : '';
}

/** The cheapest bookable thing in a collection, or nothing if none are priced. */
function priceFrom(collection: GalleryCollection): string | null {
  const prices = collection.photos
    .map((photo) => Number(photo.service?.price))
    .filter((price) => Number.isFinite(price) && price > 0);

  return prices.length > 0 ? String(Math.min(...prices)) : null;
}

export function GalleryGrid({ collections }: { collections: GalleryCollection[] }) {
  const [active, setActive] = useState<string>('all');

  const showing = active === 'all' ? collections : collections.filter((c) => c.key === active);

  const choose = (key: string, label: string) => {
    setActive(key);
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
            <p className="mt-1.5 max-w-xl text-sm leading-relaxed text-ink-muted">
              {collection.blurb}
              {/**
                * "from ₹2,500" on the heading, worked out from the cheapest
                * service in the collection rather than typed into the copy.
                * A price written into a sentence is a price that goes stale the
                * next time the salon changes it, on the one page it is quoted on.
                */}
              {priceFrom(collection) ? (
                <span className="text-ink"> From {money(priceFrom(collection)!)}.</span>
              ) : null}
            </p>

            <div className="mt-6 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3">
              {collection.photos.map((photo) => (
                <figure key={photo.src} className="group">
                  <Photo
                    src={photo.src}
                    alt={photo.alt}
                    className={`w-full rounded-xl ${photo.shape === 'portrait' ? 'aspect-[4/5]' : 'aspect-[4/3]'}`}
                  />

                  {/**
                    * WHAT IT IS, WHAT IT COSTS, AND HOW TO GET IT.
                    *
                    * The three things somebody standing in front of a photograph
                    * wants, in that order. A gallery that shows only pictures
                    * leaves them to guess the price and go looking for it, and
                    * most of them do not bother — so this is the shortest path
                    * there is from wanting something to having an appointment.
                    *
                    * The price comes live from the salon's catalogue, so it
                    * cannot quote a figure they stopped charging months ago.
                    */}
                  {photo.service ? (
                    <div className="mt-2 flex items-baseline justify-between gap-2">
                      <span className="text-xs font-medium text-ink">{photo.service.name}</span>
                      <span className="tnum shrink-0 text-xs text-glow-700">
                        from {money(photo.service.price)}
                      </span>
                    </div>
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
