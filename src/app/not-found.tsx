import Link from 'next/link';
import { SALON } from '@/lib/salon';

export const metadata = { title: 'Page not found' };

/**
 * A 404 that still books an appointment.
 *
 * The default Next error page is a dead end with the framework's name on it.
 * Somebody who mistyped a URL or followed an old link from a message is still
 * a customer standing at the door, so this says where they are, offers the two
 * things they were probably looking for, and gives the phone number — which is
 * what most people would rather use anyway.
 */
export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-[60vh] max-w-2xl flex-col items-center justify-center px-5 py-20 text-center">
      <p className="display text-6xl tracking-tight text-glow-700">404</p>
      <h1 className="mt-4 text-xl font-medium text-ink">That page is not here</h1>
      <p className="mt-2 text-sm leading-relaxed text-ink-muted">
        The link may be old, or there may be a typo in it. Nothing is broken at our end.
      </p>

      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <Link href="/" className="btn-primary h-11 px-6">
          Back to the studio
        </Link>
        <Link
          href="/#book"
          className="inline-flex h-11 items-center rounded-lg border border-stone-300 bg-white px-6 text-sm font-medium text-ink hover:bg-stone-50"
        >
          Book a visit
        </Link>
      </div>

      <p className="mt-8 text-xs text-ink-muted">
        Or just ring us —{' '}
        <a href={`tel:${SALON.phone.replace(/\s/g, '')}`} className="underline underline-offset-2">
          {SALON.phone}
        </a>
      </p>
    </main>
  );
}
