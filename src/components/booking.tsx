'use client';

import { forwardRef, useEffect, useMemo, useRef, useState } from 'react';
import { AlertTriangle, CalendarCheck, Check, CheckCircle2, Loader2, Phone, RefreshCw } from 'lucide-react';
import {
  BookingError,
  book,
  getMenu,
  getSalon,
  getSlots,
  type Branch,
  type MenuCategory,
  type MenuService,
  type Slot,
} from '@/lib/api';
import { API_URL, SALON, SALON_SLUG } from '@/lib/salon';

/**
 * Book an appointment.
 *
 * Three steps in one panel — what, when, who you are — and a confirm bar that
 * is on screen from the very first moment. Every step is visible from the
 * start, greyed until it can be answered, because a booking form that grows new
 * sections as you go gives no sense of how long the errand is, and a Confirm
 * button that only materialises once four other things are right reads as a
 * form with no way to submit.
 *
 * The bar names the one thing still missing rather than just sitting disabled.
 *
 * Everything shown is live from the salon's own system — the menu is what they
 * are actually offering online today, and the times are the gaps genuinely free
 * in the diary. Nothing here is a hard-coded list that drifts out of date.
 */

const rupees = (value: string | number) =>
  `₹${Number(value).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;

/**
 * The next fourteen days, with the salon's closed days greyed out.
 *
 * Which days those are comes from the branch's own opening hours, not from a
 * rule written into this website. A salon that starts opening on Mondays
 * changes it in their app and this page follows; hardcoding it here means being
 * quietly wrong from the day they change.
 */
function upcomingDays(
  openingHours?: Record<string, { open: string; close: string }[]>,
): { iso: string; weekday: string; day: string; closed: boolean }[] {
  const days = [];
  for (let offset = 0; offset < 14; offset += 1) {
    const date = new Date();
    date.setDate(date.getDate() + offset);
    const windows = openingHours?.[String(date.getDay())];

    days.push({
      // Local date parts, not toISOString(): that converts to UTC first, which
      // hands the API yesterday's date for anyone east of Greenwich after 5am.
      iso: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`,
      weekday: date.toLocaleDateString('en-IN', { weekday: 'short' }),
      day: date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }),
      // Only grey a day out when the salon has actually published hours and
      // this day is not among them. No hours at all means we do not know, so
      // we let them try rather than turning them away.
      closed: Boolean(openingHours) && (!windows || windows.length === 0),
    });
  }
  return days;
}

export function Booking() {
  const [branch, setBranch] = useState<Branch | null>(null);
  const [menu, setMenu] = useState<MenuCategory[] | null>(null);
  const [loadError, setLoadError] = useState<BookingError | null>(null);
  /** Bumped to retry the initial load. */
  const [attempt, setAttempt] = useState(0);

  const [chosen, setChosen] = useState<MenuService[]>([]);
  const [date, setDate] = useState<string>(() => upcomingDays()[0]!.iso);
  const [slots, setSlots] = useState<Slot[] | null>(null);
  const [slotsBusy, setSlotsBusy] = useState(false);
  /**
   * A failed request is NOT a full diary.
   *
   * These were the same thing before, and the result was a website telling
   * customers the salon had nothing free all week when really the API was
   * unreachable. Whatever else goes wrong, never invent a fully-booked salon.
   */
  const [slotsError, setSlotsError] = useState<string | null>(null);
  /** The first day in the next fortnight that does have room, once we look. */
  const [nextOpen, setNextOpen] = useState<string | null>(null);
  const [startAt, setStartAt] = useState<string | null>(null);

  const [form, setForm] = useState({ name: '', phone: '', email: '', notes: '', consent: true });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmed, setConfirmed] = useState<string | null>(null);

  const days = useMemo(() => upcomingDays(branch?.openingHours), [branch]);
  const panelRef = useRef<HTMLDivElement>(null);

  /**
   * Bring the confirmation into view.
   *
   * The panel shrinks to a few lines once booked, so on the homepage — where
   * the form sits between the reviews and the address — someone who was
   * scrolled to the bottom of a long form can end up looking at the footer,
   * with no idea whether it worked.
   */
  useEffect(() => {
    if (confirmed) panelRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, [confirmed]);

  // The salon and its menu, once — and again if the customer asks to retry.
  useEffect(() => {
    let cancelled = false;
    setLoadError(null);

    Promise.all([getSalon(), getMenu()])
      .then(([info, categories]) => {
        if (cancelled) return;
        setBranch(info.branches[0] ?? null);
        setMenu(categories);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setLoadError(err instanceof BookingError ? err : new BookingError(0, 'Could not load our booking page.', err));
      });

    return () => {
      cancelled = true;
    };
  }, [attempt]);

  // Free times, whenever the day or the chosen services change. A different
  // set of services takes a different length of time, so the gaps change too.
  useEffect(() => {
    if (!branch || chosen.length === 0) {
      setSlots(null);
      setSlotsError(null);
      setNextOpen(null);
      return;
    }

    let cancelled = false;
    const serviceIds = chosen.map((service) => service.id);

    setSlotsBusy(true);
    setSlotsError(null);
    setNextOpen(null);
    setStartAt(null);

    getSlots({ branchId: branch.id, date, serviceIds })
      .then(async (result) => {
        if (cancelled) return;
        setSlots(result);

        // Nothing today — go and find the first day that does have room, so the
        // answer is "Thursday works" rather than "try another day" and a
        // fortnight of buttons to guess at.
        if (result.length === 0) {
          const after = days.filter((day) => day.iso > date && !day.closed).slice(0, 8);
          for (const day of after) {
            if (cancelled) return;
            try {
              const found = await getSlots({ branchId: branch.id, date: day.iso, serviceIds });
              if (found.length > 0) {
                if (!cancelled) setNextOpen(day.iso);
                return;
              }
            } catch {
              return; // The diary is unreachable; the message below covers it.
            }
          }
        }
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setSlots(null);
        setSlotsError(
          err instanceof BookingError
            ? err.message
            : 'We could not reach the diary just now.',
        );
      })
      .finally(() => {
        if (!cancelled) setSlotsBusy(false);
      });

    return () => {
      cancelled = true;
    };
    // `days` is derived from the branch and is stable for a given branch.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [branch, date, chosen]);

  const toggle = (service: MenuService) =>
    setChosen((current) =>
      current.some((s) => s.id === service.id)
        ? current.filter((s) => s.id !== service.id)
        : [...current, service],
    );

  const total = chosen.reduce((sum, service) => sum + Number(service.price), 0);
  const minutes = chosen.reduce((sum, service) => sum + service.durationMin, 0);

  /**
   * The one thing still standing between them and a booking, in the order the
   * form asks for it. `null` means they can press Confirm.
   *
   * Naming it is the whole point: a disabled button with no explanation is the
   * most common reason someone gives up and rings instead — or does not.
   */
  const missing: string | null =
    chosen.length === 0
      ? 'Choose a service to get started'
      : !startAt
        ? 'Pick a time that suits you'
        : !form.name.trim()
          ? 'Add your name'
          : form.phone.trim().length < 10
            ? 'Add a phone number we can reach you on'
            : null;

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!branch || !startAt) return;

    setBusy(true);
    setError(null);
    try {
      await book({
        branchId: branch.id,
        name: form.name.trim(),
        phone: form.phone.trim(),
        email: form.email.trim() || undefined,
        startAt,
        services: chosen.map((service) => ({ serviceId: service.id })),
        notes: form.notes.trim() || undefined,
        marketingConsent: form.consent,
      });
      setConfirmed(startAt);
    } catch (err) {
      setError(
        err instanceof BookingError
          ? err.message
          : `Something went wrong. Please call us on ${SALON.phone}.`,
      );
    } finally {
      setBusy(false);
    }
  }

  // ------------------------------------------------------------- states ---

  if (loadError) {
    /*
     * A customer should never be left at a dead end that says only "could not
     * load". They get one honest sentence and a way forward — retry, or the
     * phone. What actually broke is a developer's problem, so it goes to the
     * console always, and on screen only when this is a development build.
     */
    const salonMissing = loadError.status === 404;

    return (
      <Panel>
        <span className="mb-4 flex h-11 w-11 items-center justify-center rounded-full bg-amber-50 ring-1 ring-amber-200">
          <AlertTriangle className="h-5 w-5 text-amber-600" />
        </span>

        <h3 className="display text-2xl">
          {salonMissing ? 'Online booking is not set up yet' : 'We cannot show our diary right now'}
        </h3>

        <p className="mt-2 text-sm leading-relaxed text-ink-muted">
          {salonMissing
            ? 'Our booking page has not been switched on. Give us a ring and we will put you straight in the book.'
            : 'This is a problem at our end, not a full diary — we are almost certainly free. Try again in a moment, or call and we will book you in by hand.'}
        </p>

        <div className="mt-6 flex flex-wrap items-center gap-3">
          {!salonMissing ? (
            <button type="button" onClick={() => setAttempt((n) => n + 1)} className="btn-primary h-12">
              <RefreshCw className="h-4 w-4" />
              Try again
            </button>
          ) : null}
          <a
            href={`tel:${SALON.phone.replace(/\s/g, '')}`}
            className={`${salonMissing ? 'btn-primary' : 'btn-ghost'} h-12`}
          >
            <Phone className="h-4 w-4" />
            Call {SALON.phone}
          </a>
        </div>

        {process.env.NODE_ENV === 'development' ? (
          <div className="mt-6 rounded-xl bg-stone-900 p-4 font-mono text-[11px] leading-relaxed text-stone-300">
            <p className="text-stone-500">Development only — customers never see this.</p>
            <p className="mt-2 text-stone-100">
              {loadError.unreachable
                ? 'The request never reached the API.'
                : `The API answered ${loadError.status}: ${loadError.message}`}
            </p>
            {loadError.unreachable ? (
              <ul className="mt-2 list-inside list-disc space-y-0.5">
                <li>Is the backend running?</li>
                <li>
                  Does NEXT_PUBLIC_API_URL point at it? Currently{' '}
                  <span className="text-stone-100">{API_URL}</span>
                </li>
                <li>
                  Is this origin allowed? /public answers any origin, but only once the API has been restarted with
                  that change.
                </li>
              </ul>
            ) : null}
            <p className="mt-2 text-stone-500">Slug: {SALON_SLUG} · see the browser console for the full error.</p>
          </div>
        ) : null}
      </Panel>
    );
  }

  if (confirmed) {
    const when = new Date(confirmed).toLocaleString('en-IN', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      hour: 'numeric',
      minute: '2-digit',
    });
    return (
      <Panel ref={panelRef}>
        <span className="mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-emerald-50 to-emerald-100 ring-1 ring-emerald-200">
          <CheckCircle2 className="h-6 w-6 text-emerald-600" />
        </span>
        <h3 className="display text-3xl">You&rsquo;re booked</h3>
        <p className="mt-2 text-sm leading-relaxed text-ink-muted">
          {when} — {chosen.map((service) => service.name).join(', ')}.
        </p>
        <p className="mt-3 text-sm leading-relaxed text-ink-muted">
          A confirmation is on its way to you, and we will send a reminder the day before. If anything changes, call us
          on {SALON.phone}.
        </p>
      </Panel>
    );
  }

  if (!menu) {
    return (
      <Panel>
        <p className="flex items-center gap-2 text-sm text-ink-muted">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading our menu…
        </p>
      </Panel>
    );
  }

  return (
    <Panel>
      <form onSubmit={submit}>
        {/* ---------------------------------------------------- 1. what --- */}
        <Step number="1" title="What would you like?" />

        <div className="mt-4 space-y-5">
          {menu.map((category) => (
            <div key={category.id}>
              <p className="eyebrow mb-2.5">{category.name}</p>
              <div className="space-y-1.5">
                {category.services.map((service) => {
                  const picked = chosen.some((s) => s.id === service.id);
                  return (
                    <button
                      key={service.id}
                      type="button"
                      onClick={() => toggle(service)}
                      className={`flex w-full items-center justify-between gap-3 rounded-xl border p-3.5 text-left transition-all ${
                        picked
                          ? 'border-glow-400 bg-gradient-to-br from-glow-50 to-glow-100/60 shadow-[0_2px_8px_-4px_rgba(109,40,217,0.5)]'
                          : 'border-stone-200 bg-white hover:border-glow-200 hover:bg-glow-50/40'
                      }`}
                    >
                      <span className="min-w-0">
                        <span className="block text-sm font-medium">{service.name}</span>
                        <span className="block text-xs text-ink-subtle">{service.durationMin} min</span>
                      </span>
                      <span className="tnum shrink-0 text-sm font-medium">{rupees(service.price)}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* ---------------------------------------------------- 2. when --- */}
        <div className="mt-8 border-t border-stone-200 pt-6">
          <Step number="2" title="When suits you?" done={Boolean(startAt)} waiting={chosen.length === 0} />

          {chosen.length === 0 ? (
            <p className="mt-3 text-xs leading-relaxed text-ink-subtle">
              Choose a service above and we will show you the times genuinely free in the diary — how long you need
              depends on what you are having.
            </p>
          ) : (
            <>

              {/* A fade on the right edge, so it is obvious the days scroll on. */}
              <div className="relative mt-4">
                <div className="flex gap-2 overflow-x-auto pb-1">
                {days.map((day) => (
                  <button
                    key={day.iso}
                    type="button"
                    disabled={day.closed}
                    onClick={() => setDate(day.iso)}
                    className={`shrink-0 rounded-xl border px-3.5 py-2.5 text-center transition-all ${
                      day.iso === date
                        ? 'border-transparent bg-gradient-to-b from-glow-500 to-glow-700 text-white shadow-[0_6px_16px_-8px_rgba(109,40,217,0.9)]'
                        : day.closed
                          ? 'border-stone-200 bg-stone-50 text-ink-subtle'
                          : 'border-stone-200 bg-white hover:border-glow-300'
                    }`}
                  >
                    <span className="block text-2xs uppercase tracking-wide">{day.weekday}</span>
                    <span className="block text-xs font-medium">{day.day}</span>
                  </button>
                  ))}
                </div>
                <div
                  className="pointer-events-none absolute inset-y-0 right-0 w-10 bg-gradient-to-l from-white to-transparent"
                  aria-hidden
                />
              </div>

              <div className="mt-4">
                {slotsBusy ? (
                  <p className="flex items-center gap-2 text-xs text-ink-muted">
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    Checking the diary…
                  </p>
                ) : slotsError ? (
                  /* The diary could not be reached. Say that, rather than
                     letting a network blip masquerade as a full salon. */
                  <div className="rounded-xl border border-amber-200 bg-amber-50 p-3.5">
                    <p className="text-xs leading-relaxed text-amber-900">
                      {slotsError} This is our problem, not a full diary — please call us on {SALON.phone} and we will
                      book you in by hand.
                    </p>
                    <button
                      type="button"
                      onClick={() => setDate((current) => current)}
                      className="mt-2 text-xs font-medium text-amber-900 underline underline-offset-2"
                    >
                      Try again
                    </button>
                  </div>
                ) : slots && slots.some((slot) => slot.available) ? (
                  <>
                    <div className="flex flex-wrap gap-1.5">
                      {slots.map((slot) => (
                        <button
                          key={slot.label}
                          type="button"
                          disabled={!slot.available}
                          onClick={() => setStartAt(slot.startAt)}
                          title={slot.available ? undefined : 'Already booked'}
                          className={`tnum rounded-full border px-3.5 py-2 text-xs font-medium transition-all ${
                            !slot.available
                              ? // Taken. Visibly there, visibly gone — struck
                                // through so it reads as "someone got there
                                // first" rather than as a loading state.
                                'cursor-not-allowed border-stone-200 bg-stone-100 text-ink-subtle line-through'
                              : startAt === slot.startAt
                                ? 'border-transparent bg-gradient-to-b from-glow-500 to-glow-700 text-white shadow-[0_6px_16px_-8px_rgba(109,40,217,0.9)]'
                                : 'border-stone-200 bg-white hover:border-glow-300 hover:bg-glow-50/60'
                          }`}
                        >
                          {/* The salon's own clock, worked out by the diary. Never
                              re-derived from the timestamp in the browser's. */}
                          {slot.label}
                        </button>
                      ))}
                    </div>

                    {slots.some((slot) => !slot.available) ? (
                      <p className="mt-2.5 text-2xs text-ink-subtle">
                        Crossed-out times are already booked.
                      </p>
                    ) : null}
                  </>
                ) : (
                  <div className="rounded-xl bg-stone-50 p-3.5">
                    <p className="text-xs leading-relaxed text-ink-muted">
                      Nothing free on {new Date(`${date}T00:00:00`).toLocaleDateString('en-IN', {
                        weekday: 'long',
                        day: 'numeric',
                        month: 'long',
                      })}{' '}
                      for {chosen.length === 1 ? 'that' : 'those'} — {minutes} minutes is a long gap to find.
                    </p>

                    {nextOpen ? (
                      <button
                        type="button"
                        onClick={() => setDate(nextOpen)}
                        className="mt-2 text-xs font-medium text-glow-700 underline underline-offset-2"
                      >
                        Our first opening is{' '}
                        {new Date(`${nextOpen}T00:00:00`).toLocaleDateString('en-IN', {
                          weekday: 'long',
                          day: 'numeric',
                          month: 'long',
                        })}{' '}
                        — show me
                      </button>
                    ) : (
                      <p className="mt-2 text-xs leading-relaxed text-ink-muted">
                        {chosen.length > 1
                          ? 'Nothing in the next fortnight either, and booking these together needs one person free for all of them. Try them separately, or '
                          : 'Nothing in the next fortnight either. '}
                        call us on{' '}
                        <a
                          href={`tel:${SALON.phone.replace(/\s/g, '')}`}
                          className="font-medium text-glow-700 underline underline-offset-2"
                        >
                          {SALON.phone}
                        </a>{' '}
                        and we will find you something.
                      </p>
                    )}
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* ----------------------------------------------------- 3. who --- */}
        <div className="mt-8 border-t border-stone-200 pt-6">
          <Step
            number="3"
            title="And you are?"
            done={Boolean(form.name.trim() && form.phone.trim().length >= 10)}
          />

          {/* Always fillable. Someone who types their name before picking a
              time has done nothing wrong, and making them wait for it is the
              sort of thing that loses a booking. */}
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <input
              required
              value={form.name}
              onChange={(event) => setForm((f) => ({ ...f, name: event.target.value }))}
              placeholder="Your name"
              className={inputClass}
            />
            <input
              required
              inputMode="tel"
              value={form.phone}
              onChange={(event) => setForm((f) => ({ ...f, phone: event.target.value }))}
              placeholder="Phone number"
              className={inputClass}
            />
            <input
              type="email"
              value={form.email}
              onChange={(event) => setForm((f) => ({ ...f, email: event.target.value }))}
              placeholder="Email (optional)"
              className={`${inputClass} sm:col-span-2`}
            />
            <textarea
              value={form.notes}
              onChange={(event) => setForm((f) => ({ ...f, notes: event.target.value }))}
              placeholder="Anything we should know? (optional)"
              rows={2}
              className={`${inputClass} h-auto py-2 sm:col-span-2`}
            />
          </div>

          <label className="mt-3 flex items-start gap-2 text-xs leading-relaxed text-ink-muted">
            <input
              type="checkbox"
              checked={form.consent}
              onChange={(event) => setForm((f) => ({ ...f, consent: event.target.checked }))}
              className="mt-0.5 h-3.5 w-3.5 rounded border-stone-300 text-glow-600"
            />
            Send me the occasional offer on WhatsApp. Your confirmation and reminder come either way.
          </label>
        </div>

        {error ? <p className="mt-6 rounded-lg bg-rose-50 p-3 text-xs text-rose-700">{error}</p> : null}

        {/* ------------------------------------------------------ confirm ---
            On screen from the first moment, sticking to the bottom of the
            viewport on a phone so the running total and the button never
            scroll away while someone is picking services. */}
        <div className="sticky bottom-0 z-10 -mx-6 mt-8 bg-gradient-to-t from-white via-white via-70% to-white/0 px-6 pb-1 pt-10 sm:-mx-8 sm:px-8">
          <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl bg-gradient-to-br from-glow-50 to-glow-100/70 p-5 ring-1 ring-glow-200/60">
            <div className="min-w-0">
              {chosen.length === 0 ? (
                <>
                  <p className="tnum display text-3xl text-ink-subtle">₹0</p>
                  <p className="text-xs text-ink-muted">Nothing chosen yet</p>
                </>
              ) : (
                <>
                  <p className="text-xs text-ink-muted">
                    {chosen.length} service{chosen.length === 1 ? '' : 's'} · about {minutes} min
                    {startAt
                      ? ` · ${new Date(startAt).toLocaleString('en-IN', {
                          weekday: 'short',
                          day: 'numeric',
                          month: 'short',
                          hour: 'numeric',
                          minute: '2-digit',
                        })}`
                      : ''}
                  </p>
                  <p className="tnum display text-3xl">{rupees(total)}</p>
                </>
              )}
              <p className="text-2xs text-ink-subtle">Pay at the salon — we take nothing online.</p>
            </div>

            <div className="flex flex-col items-stretch gap-1.5 sm:items-end">
              <button
                type="submit"
                disabled={busy || missing !== null}
                className="btn-primary h-12 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <CalendarCheck className="h-4 w-4" />}
                {busy ? 'Booking…' : 'Confirm booking'}
              </button>
              {missing ? (
                <p className="text-center text-2xs text-ink-subtle sm:text-right">{missing}</p>
              ) : (
                <p className="text-center text-2xs text-emerald-700 sm:text-right">Ready — no deposit needed</p>
              )}
            </div>
          </div>
        </div>
      </form>
    </Panel>
  );
}

const inputClass =
  'h-11 w-full rounded-xl border border-stone-300 bg-white px-3.5 text-sm shadow-sm outline-none transition-colors placeholder:text-ink-subtle focus:border-glow-400 focus:ring-4 focus:ring-glow-100/70';

const Panel = forwardRef<HTMLDivElement, { children: React.ReactNode }>(function Panel({ children }, ref) {
  return (
    <div ref={ref} className="card p-6 sm:p-8">
      {children}
    </div>
  );
});

/**
 * A step heading that shows where you are without being a progress bar: filled
 * and ticked once answered, faded while it is still waiting on the step above.
 */
function Step({
  number,
  title,
  done,
  waiting,
}: {
  number: string;
  title: string;
  done?: boolean;
  waiting?: boolean;
}) {
  return (
    <div className={`flex items-center gap-2.5 ${waiting ? 'opacity-50' : ''}`}>
      <span
        className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold ring-1 ${
          done
            ? 'bg-gradient-to-br from-emerald-100 to-emerald-200 text-emerald-800 ring-emerald-200'
            : 'bg-gradient-to-br from-glow-100 to-glow-200 text-glow-800 ring-glow-200'
        }`}
      >
        {done ? <Check className="h-3.5 w-3.5" /> : number}
      </span>
      <h3 className="text-base font-semibold">{title}</h3>
    </div>
  );
}
