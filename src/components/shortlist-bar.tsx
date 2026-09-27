'use client';

import Link from 'next/link';
import { ArrowRight, X } from 'lucide-react';
import { bookingHref, clearShortlist, removeFromShortlist, useShortlist } from '@/lib/shortlist';
import { track } from '@/lib/track';

/**
 * WHAT THEY HAVE PICKED, AND THE WAY OUT OF THE GALLERY.
 *
 * A list nobody can see is a list nobody trusts. This sits at the bottom of
 * the page from the moment the first service goes on it, so the count is
 * always visible and the way to book is never more than one tap away —
 * including on a phone, where the booking form is a long way down.
 *
 * It shows the service NAMES, not just a number. "3 services" asks somebody to
 * remember what they chose ten photographs ago; the names mean they can check
 * without going back, and take one off if it is not what they meant.
 */
export function ShortlistBar() {
  const items = useShortlist();
  if (items.length === 0) return null;

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-40 flex justify-center p-3 sm:p-4">
      <div className="card pointer-events-auto flex w-full max-w-2xl flex-col gap-3 p-3 sm:flex-row sm:items-center sm:justify-between sm:p-3.5">
        <div className="min-w-0">
          <p className="text-2xs font-semibold uppercase tracking-[0.18em] text-glow-700">
            {items.length === 1 ? 'One service' : `${items.length} services`}
          </p>

          <ul className="mt-1 flex flex-wrap gap-1.5">
            {items.map((item) => (
              <li key={item.id}>
                <span className="inline-flex max-w-[15rem] items-center gap-1 rounded-full bg-stone-100 py-1 pl-2.5 pr-1 text-xs text-ink">
                  <span className="truncate">{item.name}</span>
                  <button
                    type="button"
                    onClick={() => removeFromShortlist(item.id)}
                    aria-label={`Remove ${item.name}`}
                    className="rounded-full p-0.5 text-ink-subtle transition-colors hover:bg-stone-200 hover:text-ink"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              </li>
            ))}
          </ul>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            onClick={clearShortlist}
            className="rounded-full px-3 py-2 text-xs text-ink-muted transition-colors hover:text-ink"
          >
            Clear
          </button>

          <Link
            href={bookingHref(items.map((item) => item.id))}
            onClick={() =>
              /* The step between looking and booking. Reported here rather than
                 on arrival at the form, because this is the click that means
                 they decided — the form may still be scrolling into view. */
              track('booking_started', {}, items.map((item) => item.name).join(', ').slice(0, 120))
            }
            className="btn-primary h-10 !px-5 text-xs"
          >
            Book together
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
}
