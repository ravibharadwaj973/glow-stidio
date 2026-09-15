import type { Metadata } from 'next';
import { Booking } from '@/components/booking';
import { SALON } from '@/lib/salon';

export const metadata: Metadata = { title: 'Book an appointment' };
export const dynamic = 'force-dynamic';

export default function BookPage() {
  return (
    <main className="mx-auto max-w-2xl px-5 py-12 sm:py-16">
      <h1 className="font-display text-4xl tracking-tight">Book an appointment</h1>
      <p className="mt-3 text-base leading-relaxed text-ink-muted">
        Pick what you would like and we will show you the times actually free in the diary. No deposit — you pay us at
        the salon.
      </p>
      <p className="mt-2 text-sm text-ink-subtle">
        Would rather talk to someone? Call {SALON.phone}.
      </p>

      <div className="mt-8">
        <Booking />
      </div>
    </main>
  );
}
