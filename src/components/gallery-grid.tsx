'use client';

import { useState } from 'react';
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
export function GalleryGrid({ collections }: { collections: GalleryCollection[] }) {
  const [active, setActive] = useState<string>('all');

  const showing = active === 'all' ? collections : collections.filter((c) => c.key === active);

  const choose = (key: string, label: string) => {
    setActive(key);
    // Which work a visitor looked at is the single most useful thing this page
    // knows. See lib/track.ts for what is and is not sent.
    track('gallery_filter', { collection: key, label });
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
            <p className="mt-1.5 max-w-xl text-sm leading-relaxed text-ink-muted">{collection.blurb}</p>

            <div className="mt-6 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3">
              {collection.photos.map((photo) => (
                <figure key={photo.src} className="group">
                  <Photo
                    src={photo.src}
                    alt={photo.alt}
                    className={`w-full rounded-xl ${photo.shape === 'portrait' ? 'aspect-[4/5]' : 'aspect-[4/3]'}`}
                  />
                  {/* The caption is the salon talking, not a filename. Left off
                      the picture itself so it stays legible on a phone. */}
                  {photo.caption ? (
                    <figcaption className="mt-2 text-xs leading-relaxed text-ink-subtle">{photo.caption}</figcaption>
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
