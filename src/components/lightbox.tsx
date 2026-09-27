'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, Check, ChevronLeft, ChevronRight, Plus, X } from 'lucide-react';
import type { GalleryPhoto } from '@/lib/gallery';
import { MAX_SHORTLIST, isShortlisted, toggleShortlist, useShortlist } from '@/lib/shortlist';
import { track } from '@/lib/track';

/**
 * ONE PHOTOGRAPH, BIG, WITH THE TWO THINGS SOMEBODY WANTS NEXT.
 *
 * A gallery grid is for scanning; this is for the moment the scanning stops.
 * The picture gets the whole screen, and directly under it are the only two
 * things a person who likes it ever wants: book this now, or keep it and carry
 * on looking. Anything else here is in the way.
 *
 * ── Why the arrows matter more than they look ─────────────────────────────
 *
 * Somebody who opens a photograph almost never wants only that one. Without
 * arrows they close, find their place in the grid, open the next, close it
 * again — and stop after three. The arrows turn the gallery into the thing it
 * is meant to be, which is a flick through the salon's work.
 */
export function Lightbox({
  photos,
  index,
  onMove,
  onClose,
}: {
  /** Exactly what the grid is showing, in its order, so the arrows agree with the page. */
  photos: GalleryPhoto[];
  index: number;
  onMove: (next: number) => void;
  onClose: () => void;
}) {
  const dialogRef = useRef<HTMLDivElement>(null);
  /** Where focus came from, so it can go back when this closes. */
  const openerRef = useRef<Element | null>(null);
  const [note, setNote] = useState<string | null>(null);

  // Subscribing here is what re-renders the button between "Add" and "Added".
  useShortlist();

  const photo = photos[index];

  const move = useCallback(
    (delta: number) => {
      if (photos.length < 2) return;
      // Wraps: at the last picture the next one is the first. Somebody flicking
      // through does not want to be stopped by an invisible edge.
      onMove((index + delta + photos.length) % photos.length);
    },
    [index, onMove, photos.length],
  );

  /**
   * Escape closes, arrows move, and Tab stays inside.
   *
   * The focus trap is not decoration. Without it, tabbing from a dialog that
   * covers the page walks into the gallery underneath it, and a keyboard user
   * is left tabbing through a page they cannot see.
   */
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        event.preventDefault();
        onClose();
        return;
      }
      if (event.key === 'ArrowLeft') {
        event.preventDefault();
        move(-1);
        return;
      }
      if (event.key === 'ArrowRight') {
        event.preventDefault();
        move(1);
        return;
      }
      if (event.key !== 'Tab') return;

      const dialog = dialogRef.current;
      if (!dialog) return;

      const focusable = Array.from(
        dialog.querySelectorAll<HTMLElement>('a[href], button:not([disabled])'),
      ).filter((element) => element.offsetParent !== null);
      if (focusable.length === 0) return;

      const first = focusable[0]!;
      const last = focusable[focusable.length - 1]!;
      const active = document.activeElement;

      if (event.shiftKey && (active === first || active === dialog)) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && active === last) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [move, onClose]);

  /** The page behind must not scroll under the picture on a phone. */
  useEffect(() => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previous;
    };
  }, []);

  /** Focus in on open, and back to the photograph that was clicked on close. */
  useEffect(() => {
    openerRef.current = document.activeElement;
    dialogRef.current?.focus();

    return () => {
      const opener = openerRef.current;
      if (opener instanceof HTMLElement && document.contains(opener)) opener.focus();
    };
  }, []);

  /**
   * Opening a photograph of a service is the strongest thing this page learns.
   *
   * Reported per picture rather than once per session: which work somebody
   * stopped on is the signal, and it is what the salon's automations read as
   * an interest. See lib/track.ts for what does and does not leave the browser.
   */
  useEffect(() => {
    if (!photo?.service) return;
    track('service_view', { serviceId: photo.service.id }, photo.service.name);
  }, [photo?.service]);

  /** A message ("Added", "That is six") clears itself rather than piling up. */
  useEffect(() => {
    if (!note) return;
    const timer = window.setTimeout(() => setNote(null), 2600);
    return () => window.clearTimeout(timer);
  }, [note]);

  if (!photo) return null;

  const service = photo.service;
  const listed = service ? isShortlisted(service.id) : false;

  function add() {
    if (!service) return;
    const outcome = toggleShortlist({ id: service.id, name: service.name });
    setNote(
      outcome === 'added'
        ? `Added ${service.name} to your list.`
        : outcome === 'removed'
          ? `Removed ${service.name}.`
          : `Your list holds ${MAX_SHORTLIST} services. Book these first, or take one off.`,
    );
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink/80 p-4 backdrop-blur-sm sm:p-8"
      /* The backdrop closes, the panel does not — so a mis-click beside the
         picture does what everybody expects, and a click ON it does nothing. */
      onClick={onClose}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label={photo.alt}
        tabIndex={-1}
        onClick={(event) => event.stopPropagation()}
        className="relative flex max-h-full w-full max-w-5xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl outline-none"
      >
        <div className="relative flex min-h-0 flex-1 items-center justify-center bg-ink">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            /* The grid asked Cloudinary for a 900px crop, which is right for a
               tile and soft blown up. srcLarge is the same picture at 1600. */
            src={photo.srcLarge ?? photo.src}
            alt={photo.alt}
            className="max-h-[68vh] w-auto max-w-full object-contain"
          />

          {photos.length > 1 ? (
            <>
              <Arrow side="left" onClick={() => move(-1)} label="Previous photograph" />
              <Arrow side="right" onClick={() => move(1)} label="Next photograph" />
            </>
          ) : null}

          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="absolute right-3 top-3 rounded-full bg-white/90 p-2 text-ink shadow-sm transition-colors hover:bg-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
          <div className="min-w-0">
            {service ? (
              <p className="truncate text-sm font-medium text-ink">{service.name}</p>
            ) : (
              <p className="truncate text-sm font-medium text-ink">{photo.alt}</p>
            )}

            {photo.caption ? (
              <p className="mt-0.5 truncate text-xs text-ink-subtle">{photo.caption}</p>
            ) : null}

            {photos.length > 1 ? (
              <p className="mt-0.5 text-2xs text-ink-subtle">
                {index + 1} of {photos.length}
              </p>
            ) : null}
          </div>

          {service ? (
            <div className="flex shrink-0 items-center gap-2">
              <button
                type="button"
                onClick={add}
                aria-pressed={listed}
                className="btn-ghost h-10 !px-4 text-xs"
              >
                {listed ? <Check className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />}
                {listed ? 'On your list' : 'Add to list'}
              </button>

              <Link href={`/?service=${service.id}#book`} className="btn-primary h-10 !px-5 text-xs">
                Book this
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          ) : (
            /* A studio photograph, not work. Saying so is better than a Book
               button that lands on a form with nothing chosen. */
            <p className="shrink-0 text-xs text-ink-subtle">Our room, not a service.</p>
          )}
        </div>

        {/* Announced, not just shown: the button's own label changes too, but
            somebody who cannot see the bar deserves to be told it worked. */}
        <p aria-live="polite" className="sr-only">
          {note ?? ''}
        </p>
        {note ? (
          <p className="border-t border-stone-200 bg-glow-50 px-4 py-2 text-xs text-glow-800 sm:px-5">
            {note}
          </p>
        ) : null}
      </div>
    </div>
  );
}

function Arrow({
  side,
  onClick,
  label,
}: {
  side: 'left' | 'right';
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      /* Big enough to hit with a thumb on a phone, which is where most of these
         pictures are looked at. */
      className={`absolute top-1/2 -translate-y-1/2 rounded-full bg-white/90 p-2.5 text-ink shadow-sm transition-colors hover:bg-white ${
        side === 'left' ? 'left-3' : 'right-3'
      }`}
    >
      {side === 'left' ? <ChevronLeft className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
    </button>
  );
}
