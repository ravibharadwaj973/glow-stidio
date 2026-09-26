'use client';

import { useState } from 'react';
import { Check, Quote, Star } from 'lucide-react';
import { leaveFeedback, type FeedbackSection } from '@/lib/api';
import { track } from '@/lib/track';

/**
 * WHAT CUSTOMERS SAY, AND A WAY TO SAY IT.
 *
 * ── Two things this is careful about ─────────────────────────────────────
 *
 * IT DOES NOT PRETEND TO BE A REVIEW WALL. The reviews shown here are ones the
 * salon chose to publish, and the form below writes something only the salon
 * will read. Saying so plainly is not modesty: a customer who believes their
 * words go up instantly and then cannot find them assumes they were censored,
 * which is worse than telling them.
 *
 * A LOW RATING DOES NOT GET A DIFFERENT FORM. Some systems route one to
 * three stars somewhere quieter and four or five to a public review site. That
 * split belongs to the salon's own post-visit flow, where the customer is
 * known and a complaint can be acted on by name. Doing it on a public form
 * means anybody can trigger it, and it teaches the salon to collect only the
 * praise — which is how a business stops hearing anything useful.
 */
export function FeedbackBlock({ section }: { section: FeedbackSection }) {
  const { config, reviews } = section;

  return (
    <section id="feedback" className="scroll-mt-20 border-y border-stone-200 bg-white">
      <div className="mx-auto max-w-6xl px-5 py-20">
        <div className="grid gap-12 lg:grid-cols-[1fr_1fr] lg:gap-16">
          {reviews.length > 0 ? (
            <div>
              <p className="eyebrow">In their words</p>
              <h2 className="display mt-3 text-4xl">What people say</h2>
              <ul className="mt-8 space-y-7">
                {reviews.map((review) => (
                  <li key={review.id}>
                    <Quote className="h-4 w-4 text-glow-300" aria-hidden />
                    <Stars value={review.rating} />
                    {review.comment ? (
                      <blockquote className="mt-2 text-base leading-relaxed text-ink">{review.comment}</blockquote>
                    ) : null}
                    <p className="mt-2 text-sm text-ink-subtle">{review.name}</p>
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <div>
              <p className="eyebrow">In their words</p>
              <h2 className="display mt-3 text-4xl">Be the first to say something</h2>
              <p className="mt-4 max-w-md text-base leading-relaxed text-ink-muted">
                We would rather show a handful of real ones than a page of five stars, so this fills up slowly.
              </p>
            </div>
          )}

          {config.enabled ? <FeedbackForm config={config} /> : null}
        </div>
      </div>
    </section>
  );
}

function Stars({ value }: { value: number }) {
  return (
    <p className="mt-1.5 flex items-center gap-0.5" aria-label={`${value} out of 5`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          className={`h-3.5 w-3.5 ${n <= value ? 'fill-glow-500 text-glow-500' : 'text-stone-300'}`}
          aria-hidden
        />
      ))}
    </p>
  );
}

function FeedbackForm({ config }: { config: FeedbackSection['config'] }) {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  /** The honeypot's state. Never rendered visibly, never touched by a person. */
  const [website, setWebsite] = useState('');
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const phoneNeeded = config.phone === 'required';
  const ready = rating > 0 && name.trim().length > 0 && (!phoneNeeded || phone.trim().length > 0);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!ready || busy) return;

    setBusy(true);
    setError(null);
    try {
      await leaveFeedback({
        rating,
        comment: comment.trim() || undefined,
        name: name.trim(),
        phone: phone.trim() || undefined,
        website: website || undefined,
      });
      setDone(true);
      // The rating is the label; metadata keys are an allow-list on the API
      // side and `rating` is not one of them, so it would be dropped.
      track('feedback_left', {}, `${rating} stars`);
    } catch {
      /**
       * One sentence, and their words are still in the box.
       *
       * Somebody who has just typed three paragraphs about their colour must
       * not lose them to a failed request — clearing the form on error is how
       * a salon never hears that particular thing again.
       */
      setError('That did not go through. Please try once more in a moment.');
    } finally {
      setBusy(false);
    }
  }

  if (done) {
    return (
      <div className="card flex flex-col items-start gap-3 px-6 py-8">
        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-glow-100">
          <Check className="h-4 w-4 text-glow-700" />
        </span>
        <h3 className="display text-2xl">Thank you</h3>
        <p className="text-sm leading-relaxed text-ink-muted">
          This goes to the owner, who reads them herself. If you left your number and something needs putting right,
          expect a call rather than an automated reply.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="card px-6 py-7">
      <h3 className="display text-2xl">{config.heading}</h3>
      <p className="mt-1.5 text-sm leading-relaxed text-ink-muted">{config.prompt}</p>

      <fieldset className="mt-6">
        <legend className="text-sm font-medium text-ink">How was it?</legend>
        {/* Real buttons, not a hover trick: this has to work by keyboard and be
            announced by a screen reader, and a five-way choice is five
            controls however it looks. */}
        <div className="mt-2 flex items-center gap-1">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => setRating(n)}
              aria-label={`${n} star${n === 1 ? '' : 's'}`}
              aria-pressed={rating === n}
              className="rounded p-1 transition-transform hover:scale-110"
            >
              <Star className={`h-7 w-7 ${n <= rating ? 'fill-glow-500 text-glow-500' : 'text-stone-300'}`} />
            </button>
          ))}
        </div>
      </fieldset>

      <label className="mt-5 block">
        <span className="text-sm font-medium text-ink">Anything you want to tell us?</span>
        <textarea
          value={comment}
          onChange={(event) => setComment(event.target.value)}
          rows={4}
          maxLength={2000}
          placeholder="What went well, or what did not."
          className="mt-1.5 w-full rounded-xl border border-stone-300 bg-white px-3 py-2 text-sm text-ink placeholder:text-ink-subtle focus:border-glow-400 focus:outline-none focus:ring-2 focus:ring-glow-200"
        />
      </label>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="text-sm font-medium text-ink">Your name</span>
          <input
            value={name}
            onChange={(event) => setName(event.target.value)}
            maxLength={80}
            required
            autoComplete="name"
            className="mt-1.5 w-full rounded-xl border border-stone-300 bg-white px-3 py-2 text-sm text-ink focus:border-glow-400 focus:outline-none focus:ring-2 focus:ring-glow-200"
          />
        </label>

        {config.phone !== 'off' ? (
          <label className="block">
            <span className="text-sm font-medium text-ink">
              Phone{config.phone === 'optional' ? <span className="text-ink-subtle"> (optional)</span> : null}
            </span>
            <input
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
              type="tel"
              inputMode="tel"
              maxLength={20}
              required={phoneNeeded}
              autoComplete="tel"
              className="mt-1.5 w-full rounded-xl border border-stone-300 bg-white px-3 py-2 text-sm text-ink focus:border-glow-400 focus:outline-none focus:ring-2 focus:ring-glow-200"
            />
          </label>
        ) : null}
      </div>

      {/* The honeypot. Hidden from sight AND from assistive technology, so no
          real visitor can fill it in by accident and be silently dropped. */}
      <div aria-hidden className="absolute left-[-9999px] h-0 w-0 overflow-hidden">
        <label>
          Website
          <input
            tabIndex={-1}
            autoComplete="off"
            value={website}
            onChange={(event) => setWebsite(event.target.value)}
          />
        </label>
      </div>

      {error ? <p className="mt-4 text-sm text-rose-700">{error}</p> : null}

      <button type="submit" disabled={!ready || busy} className="btn-primary mt-6 h-11 disabled:opacity-50">
        {busy ? 'Sending…' : 'Send'}
      </button>

      {/* Said before they type, not after they press send. What happens to
          somebody's name and number is their decision to make, and it cannot
          be made once the form is already submitted. */}
      <p className="mt-3 text-2xs leading-relaxed text-ink-subtle">
        This goes to the salon, not to a public review site. Your name and number are used to reply to you.
        {config.showReviews
          ? ' If your words are ever shown on this page, only your first name appears — and only if the salon publishes it.'
          : ''}
      </p>
    </form>
  );
}
