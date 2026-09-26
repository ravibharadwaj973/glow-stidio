import type { Metadata } from 'next';
import Link from 'next/link';
import { SALON } from '@/lib/salon';
import { Arrival } from '@/components/arrival';
import './globals.css';

export const metadata: Metadata = {
  title: { default: `${SALON.name} — ${SALON.tagline}`, template: `%s · ${SALON.name}` },
  description: SALON.intro,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        {/* Reads the arrival code once and reports each page opened. Renders
            nothing, and says nothing at all about a visitor who did not arrive
            from one of the salon's own messages — see lib/track.ts. */}
        <Arrival />

        <header className="sticky top-0 z-40 border-b border-stone-200/70 bg-sand/70 backdrop-blur-md">
          <div className="mx-auto flex max-w-6xl items-center gap-6 px-5 py-4">
            <Link href="/" className="display text-2xl tracking-tight">
              {SALON.name}
            </Link>
            <nav className="ml-auto hidden items-center gap-7 text-sm text-ink-muted sm:flex">
              <Link href="/#services" className="hover:text-ink">Services</Link>
              <Link href="/gallery" className="hover:text-ink">Our work</Link>
              <Link href="/#team" className="hover:text-ink">Our team</Link>
              <Link href="/#visit" className="hover:text-ink">Visit us</Link>
            </nav>
            <Link
              href="/#book"
              className="btn-primary ml-auto h-10 px-6 sm:ml-0"
            >
              Book
            </Link>
          </div>
        </header>

        {children}

        <footer className="mt-20 border-t border-stone-200 bg-white">
          <div className="mx-auto grid max-w-6xl gap-8 px-5 py-12 text-sm sm:grid-cols-3">
            <div>
              <p className="display text-2xl">{SALON.name}</p>
              <p className="mt-1 text-ink-muted">{SALON.address}</p>
              <a href={`tel:${SALON.phone.replace(/\s/g, '')}`} className="mt-2 block text-ink-muted hover:text-ink">
                {SALON.phone}
              </a>
            </div>
            <div>
              <p className="font-medium">Opening hours</p>
              <ul className="mt-1 space-y-0.5 text-ink-muted">
                {SALON.hours.map((row) => (
                  <li key={row.days}>
                    {row.days} · {row.time}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <Link href="/gallery" className="mb-4 block text-ink-muted hover:text-ink">
                See our work
              </Link>
              <Link href="/#book" className="btn-primary h-11">
                Book an appointment
              </Link>
              <p className="mt-3 text-xs text-ink-subtle">
                Booking takes no payment. You pay us at the salon.
              </p>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
