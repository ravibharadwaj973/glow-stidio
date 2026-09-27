import { API_URL, SALON_SLUG } from './salon';

/**
 * THE ONLY CONNECTION BETWEEN THIS WEBSITE AND THE SALON'S SYSTEM.
 *
 * Everything here hits the public, unauthenticated part of the Parlon API,
 * scoped by the salon's slug. There is no key in this website and no login —
 * these four endpoints are the whole surface:
 *
 *   GET  /public/:slug            the salon and its branches
 *   GET  /public/:slug/services   the menu customers may book online
 *   GET  /public/:slug/slots      times actually free on a given day
 *   POST /public/:slug/book       make the appointment
 *
 * The booking is not an email to the salon. It writes into the same diary the
 * front desk is looking at, creates the customer record if they are new, and
 * fires the confirmation message — so it is on their screen before the
 * customer has closed the tab.
 *
 * Note what is absent: no payment, no deposit, no card. The customer reserves
 * a time; money changes hands at the counter afterwards.
 */

export class BookingError extends Error {
  constructor(
    /** HTTP status, or 0 when the request never reached the API at all. */
    readonly status: number,
    message: string,
    /** The underlying failure, kept for the console — never shown to a customer. */
    readonly detail?: unknown,
  ) {
    super(message);
    this.name = 'BookingError';
  }

  /**
   * True when the browser could not complete the request: the API is down, the
   * address is wrong, or CORS refused it.
   *
   * Worth its own flag. "The salon has nothing free" and "we never got an
   * answer" look identical to a customer, and telling someone a salon is fully
   * booked when really the network failed is the worse of the two lies.
   */
  get unreachable(): boolean {
    return this.status === 0;
  }
}

interface Envelope<T> {
  success: boolean;
  data?: T;
  error?: { code: string; message: string };
}

async function call<T>(path: string, init?: RequestInit): Promise<T> {
  const url = `${API_URL}/public/${SALON_SLUG}${path}`;

  let response: Response;
  try {
    response = await fetch(url, {
      ...init,
      headers: { 'Content-Type': 'application/json', ...(init?.headers ?? {}) },
      cache: 'no-store',
    });
  } catch (cause) {
    // fetch only rejects when the request never completed — the API is not
    // running, the address is wrong, or CORS refused it. The browser will not
    // tell us which, so log what we tried and let the page say so honestly.
    if (typeof console !== 'undefined') {
      console.error(
        `[booking] Could not reach ${url}.\n` +
          'Check the API is running, that NEXT_PUBLIC_API_URL points at it, and that ' +
          'this origin is allowed by CORS.',
        cause,
      );
    }
    throw new BookingError(0, 'We could not reach the booking system.', cause);
  }

  const payload = (await response.json().catch(() => null)) as Envelope<T> | null;

  if (!response.ok || !payload?.success) {
    throw new BookingError(
      response.status,
      payload?.error?.message ?? 'The booking system returned something unexpected.',
      { url, status: response.status },
    );
  }

  return payload.data as T;
}

// ------------------------------------------------------------------ types --

export interface Branch {
  id: string;
  name: string;
  addressLine: string | null;
  city: string | null;
  phone: string | null;
  /**
   * Opening hours keyed by day of week, 0 = Sunday, exactly as the salon set
   * them in their own app. A day with no entry is a day they are closed — so
   * the website never has to hardcode "closed Mondays" and then be wrong about
   * it the week they change their minds.
   */
  openingHours?: Record<string, { open: string; close: string }[]>;
  timezone?: string;
}

export interface SalonInfo {
  salon: { id: string; name: string; slug: string; phone: string; city: string | null };
  branches: Branch[];
}

export interface MenuService {
  id: string;
  name: string;
  description: string | null;
  durationMin: number;
  price: string | number;
}

export interface MenuCategory {
  id: string;
  name: string;
  services: MenuService[];
}

/**
 * WHAT /slots ACTUALLY RETURNS.
 *
 * Openings grouped by stylist, not a flat list of times — because the diary's
 * real answer to "when are you free?" is per person. `label` is "HH:mm" already
 * worked out in the SALON's timezone, which is why the website displays it
 * rather than re-formatting `start` in the browser's: a customer booking from
 * abroad must see the salon's clock, not their own.
 */
export interface StaffSlots {
  staffId: string;
  staffName: string;
  slots: { start: string; end: string; label: string; available: boolean }[];
}

/** One time in the salon's day, flattened for the page. */
export interface Slot {
  /** ISO instant, sent back when booking. */
  startAt: string;
  /** "14:30" in the salon's own timezone. What the customer reads. */
  label: string;
  staffId: string;
  /** False when everyone who could do it is already booked then. */
  available: boolean;
}

export interface BookingResult {
  id?: string;
  appointment?: { id: string; startAt: string };
  startAt?: string;
}

// -------------------------------------------------------------- the calls --

export const getSalon = () => call<SalonInfo>('');

export const getMenu = () => call<MenuCategory[]>('/services');

/**
 * Free times on one day, flattened across the team.
 *
 * The salon's diary answers per stylist; a customer who has not asked for a
 * particular person only wants the times themselves, so identical times offered
 * by two stylists collapse into one button. The stylist who was free first is
 * remembered, but not shown — picking a person is a different question, and
 * asking it here loses more bookings than it wins.
 */
export async function getSlots(params: {
  branchId: string;
  date: string;
  serviceIds: string[];
}): Promise<Slot[]> {
  const query = new URLSearchParams({
    branchId: params.branchId,
    date: params.date,
    serviceIds: params.serviceIds.join(','),
  });

  const groups = await call<StaffSlots[]>(`/slots?${query.toString()}`);

  const byTime = new Map<string, Slot>();
  for (const group of groups ?? []) {
    for (const slot of group.slots ?? []) {
      const seen = byTime.get(slot.label);

      // A time is free if ANY stylist is free then, so an existing entry is
      // only replaced when this stylist turns a taken time into a free one.
      // Getting this backwards would grey out times the salon can actually
      // sell, purely because the first stylist in the list was busy.
      if (!seen) {
        byTime.set(slot.label, {
          startAt: slot.start,
          label: slot.label,
          staffId: group.staffId,
          available: slot.available,
        });
      } else if (!seen.available && slot.available) {
        byTime.set(slot.label, { ...seen, startAt: slot.start, staffId: group.staffId, available: true });
      }
    }
  }

  return [...byTime.values()].sort((a, b) => a.label.localeCompare(b.label));
}

export interface BookingRequest {
  branchId: string;
  name: string;
  phone: string;
  email?: string;
  startAt: string;
  services: { serviceId: string }[];
  notes?: string;
  marketingConsent: boolean;
}

export const book = (request: BookingRequest) =>
  call<BookingResult>('/book', {
    method: 'POST',
    // `source: 'ONLINE'` is what makes these show up in the salon's reports as
    // bookings that came from their own website, and `ref` is what lets them
    // tell this site apart from their Instagram bio in the same report.
    body: JSON.stringify({ ...request, source: 'ONLINE', ref: 'website' }),
  });

// ------------------------------------------------------------- feedback ---

/**
 * The feedback section is configured IN THE SALON'S OWN APP, not here.
 *
 * Every salon using this site as a starting point wants different wording, and
 * some want no form at all. Putting the heading in this repository means a
 * developer for every change of mind; putting it behind the API means the owner
 * edits it on their phone between clients.
 */
export interface FeedbackSection {
  config: {
    enabled: boolean;
    heading: string;
    prompt: string;
    phone: 'required' | 'optional' | 'off';
    showReviews: boolean;
  };
  /**
   * Only what the salon has approved. Nothing anybody types appears here
   * until a person at the salon publishes it, so this is never a live feed of
   * whatever the last stranger wrote.
   */
  reviews: { id: string; rating: number; comment: string | null; at: string; name: string }[];
}

/**
 * Cached for a few minutes rather than read fresh.
 *
 * The section's wording changes a handful of times a year; a new approved
 * review appears a handful of times a month. Neither is worth a round trip on
 * every page load, and the homepage should not go slow because the API is
 * having a bad minute.
 */
export async function feedbackSection(): Promise<FeedbackSection | null> {
  try {
    const response = await fetch(`${API_URL}/public/${SALON_SLUG}/feedback-section`, {
      next: { revalidate: 300 },
    });
    if (!response.ok) return null;
    const payload = (await response.json()) as Envelope<FeedbackSection>;
    return payload.success ? (payload.data ?? null) : null;
  } catch {
    // A salon's website must not fail to render because feedback could not be
    // loaded. The section simply does not appear.
    return null;
  }
}

export interface FeedbackRequest {
  rating: number;
  comment?: string;
  name: string;
  phone?: string;
  /** The honeypot. Left empty by every human, because none of them see it. */
  website?: string;
}

export const leaveFeedback = (request: FeedbackRequest) =>
  call<{ received: boolean }>('/feedback', { method: 'POST', body: JSON.stringify(request) });

// -------------------------------------------------------------- gallery ---

export interface SalonGallery {
  /**
   * The cloud name the salon's own app is configured with.
   *
   * Reported so the two cannot silently disagree: if this site is pointed at
   * one Cloudinary account and the app uploads to another, every picture is a
   * 404 and the cause is invisible from either side.
   */
  cloudName: string | null;
  /**
   * The salon's own service categories, in the order they chose, plus one
   * built-in bucket for the studio photographs. Not a list this site can know
   * in advance: a nail bar's categories are not a hair salon's.
   */
  collections: { key: string; label: string; tag: string }[];
  photos: {
    publicId: string;
    collection: string;
    alt: string | null;
    caption: string | null;
    width: number;
    height: number;
    /**
     * The service this photograph is work for: its name, and no price.
     *
     * The gallery names the work and offers to book it; it does not quote. The
     * work in a photograph almost never costs what the line item says — length,
     * condition and how long it took all move it — so a figure under the picture
     * sets up a conversation at the counter that starts with the customer
     * feeling misled.
     *
     * Null when the photograph is not work for anything (the room, the tools),
     * or when the service has since been retired or taken off online booking.
     * The picture stays and the "Book this" disappears: a button with nothing
     * behind it is worse than no button.
     */
    service: { id: string; name: string } | null;
  }[];
}

/**
 * The gallery as the salon curated it — their order, their captions, without
 * the ones they have hidden.
 *
 * Cached for a minute. Ten minutes was the obvious number — a gallery changes
 * a few times a month, and reading it fresh on every page view would make the
 * site's speed depend on the API's. It was still wrong, for a reason unrelated
 * to how often a gallery changes: this interval is how long an owner waits to
 * find out whether their upload worked. They add photographs in Parlon, open
 * their website, see the same empty page and conclude the gallery is broken.
 * A minute still serves one request per minute per server rather than one per
 * visitor, and is short enough to wait out.
 *
 * Returns null rather than throwing, so the caller can fall through to
 * Cloudinary's tag list. See resolveCollections in lib/gallery.ts.
 */
export async function salonGallery(): Promise<SalonGallery | null> {
  try {
    const response = await fetch(`${API_URL}/public/${SALON_SLUG}/gallery`, { next: { revalidate: 60 } });
    if (!response.ok) return null;
    const payload = (await response.json()) as Envelope<SalonGallery>;
    return payload.success ? (payload.data ?? null) : null;
  } catch {
    return null;
  }
}
