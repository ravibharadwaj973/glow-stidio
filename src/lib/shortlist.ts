'use client';

import { useSyncExternalStore } from 'react';

/**
 * THE SERVICES SOMEBODY HAS PICKED OUT WHILE LOOKING AT PHOTOGRAPHS.
 *
 * ── Why this is a list and not a cart ─────────────────────────────────────
 *
 * A cart implies a checkout, and this salon takes no card online — the
 * customer pays at the counter, which is a deliberate decision and not a
 * missing feature. So this keeps a shortlist of SERVICES, hands them to the
 * booking form all at once, and never mentions money. Nothing here is a
 * purchase; it is a customer saying "these are the three things I want doing".
 *
 * ── Why it exists at all ──────────────────────────────────────────────────
 *
 * The gallery is browsed in one mood and booked in another. Somebody works
 * through the pictures, likes a cut, then a colour, then a facial — and
 * without somewhere to put them, the first two are gone by the time they
 * reach the form. The booking form already accepts several services in one
 * appointment; this is the missing half of that.
 *
 * ── Why localStorage ──────────────────────────────────────────────────────
 *
 * The list has to survive the walk from /gallery to /#book, which is a real
 * navigation. Every read and write is wrapped, because localStorage throws
 * rather than returning null in a locked-down browser, and a gallery that
 * cannot be browsed in private mode is a worse failure than a list that does
 * not persist.
 */
export interface ShortlistItem {
  /** The salon's own service id — the same one the booking form matches on. */
  id: string;
  /** Shown in the bar, so somebody can see what they picked without going back. */
  name: string;
}

const KEY = 'glow.shortlist.v1';

/**
 * Six is not a UI limit, it is an appointment limit.
 *
 * The slot finder looks for a gap as long as the sum of the chosen services,
 * so a list of twenty finds no free time on any day and the customer is told
 * the salon is fully booked for a fortnight. Six is already the better part of
 * an afternoon and past what anyone books in one sitting.
 */
export const MAX_SHORTLIST = 6;

/**
 * The cached snapshot. useSyncExternalStore compares snapshots by reference and
 * loops forever if a new array comes back each time, so this is replaced only
 * when the contents actually change.
 */
let items: ShortlistItem[] = [];

/** The server renders an empty list, and so does the first client render. */
const EMPTY: ShortlistItem[] = [];

let loaded = false;
const listeners = new Set<() => void>();

function emit(): void {
  for (const listener of listeners) listener();
}

function read(): ShortlistItem[] {
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    /**
     * Validated on the way in, not trusted.
     *
     * This survives deploys, so it can hold a shape written by a version of
     * this site that no longer exists — and it is user-writable storage. A bad
     * row is dropped rather than rendered.
     */
    return parsed
      .filter(
        (row): row is ShortlistItem =>
          typeof row === 'object' &&
          row !== null &&
          typeof (row as ShortlistItem).id === 'string' &&
          typeof (row as ShortlistItem).name === 'string',
      )
      .slice(0, MAX_SHORTLIST);
  } catch {
    return [];
  }
}

function persist(): void {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(items));
  } catch {
    /* Private mode, or storage full. The list still works for this page. */
  }
}

function subscribe(listener: () => void): () => void {
  /**
   * Loaded on first subscribe rather than at import time, for two reasons:
   * this module is imported by a server component's tree and `window` does not
   * exist there, and the first client render must match the server's empty one
   * or React replaces the markup and logs a hydration error.
   */
  if (!loaded) {
    loaded = true;
    const stored = read();
    if (stored.length > 0) {
      items = stored;
      // Not synchronously: this runs inside React's subscribe, which is not a
      // moment at which React will accept being told the store changed.
      queueMicrotask(emit);
    }
  }

  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function snapshot(): ShortlistItem[] {
  return items;
}

function serverSnapshot(): ShortlistItem[] {
  return EMPTY;
}

/** Already on the list? Compared by service id, never by name. */
export function isShortlisted(id: string): boolean {
  return items.some((item) => item.id === id);
}

/**
 * Add, or remove if it is already there.
 *
 * One button that toggles rather than an add button and a separate remove:
 * the picture somebody is looking at is where they change their mind about it.
 *
 * Returns what happened, so the caller can say so out loud.
 */
export function toggleShortlist(item: ShortlistItem): 'added' | 'removed' | 'full' {
  if (isShortlisted(item.id)) {
    items = items.filter((existing) => existing.id !== item.id);
    persist();
    emit();
    return 'removed';
  }

  if (items.length >= MAX_SHORTLIST) return 'full';

  items = [...items, { id: item.id, name: item.name }];
  persist();
  emit();
  return 'added';
}

export function removeFromShortlist(id: string): void {
  if (!isShortlisted(id)) return;
  items = items.filter((item) => item.id !== id);
  persist();
  emit();
}

export function clearShortlist(): void {
  if (items.length === 0) return;
  items = EMPTY;
  persist();
  emit();
}

/** The current list, re-rendering whatever component asked for it. */
export function useShortlist(): ShortlistItem[] {
  return useSyncExternalStore(subscribe, snapshot, serverSnapshot);
}

/**
 * Where "book these together" goes.
 *
 * The query comes BEFORE the hash. `/#book?services=a,b` puts the query inside
 * the fragment, where `location.search` cannot see it and the pre-select
 * silently never fires — the same trap the single-service link fell into.
 */
export function bookingHref(ids: string[]): string {
  return `/?services=${ids.join(',')}#book`;
}
