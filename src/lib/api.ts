import { API_URL, SALON_SLUG } from './salon';

/**
 * THE ONLY CONNECTION BETWEEN THIS WEBSITE AND THE SALON'S SYSTEM.
 *
 * Everything here hits the public, unauthenticated part of the Salon Grow API,
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
