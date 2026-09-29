import type { Metadata } from 'next';
import Link from 'next/link';
import { SALON, SITE_URL } from '@/lib/salon';
import { Arrival } from '@/components/arrival';
import './globals.css';

export const metadata: Metadata = {
  /**
   * Absolute, so og:image and canonical resolve. Without metadataBase, Next
   * emits a RELATIVE og:image, which every link preview silently drops — the
   * reason a shared link showed no card at all.
   */
  metadataBase: new URL(SITE_URL),
  title: { default: `${SALON.name} — ${SALON.tagline}`, template: `%s · ${SALON.name}` },
  description: SALON.intro,
  alternates: { canonical: '/' },
  openGraph: {
    type: 'website',
    siteName: SALON.name,
    title: `${SALON.name} — ${SALON.tagline}`,
    description: SALON.intro,
    locale: 'en_IN',
    url: '/',
  },
  twitter: { card: 'summary_large_image' },
  // The site is meant to be found. Said explicitly so a stray noindex from a
  // preview deployment cannot be inherited.
  robots: { index: true, follow: true },
};

/**
 * WHAT GOOGLE NEEDS TO PUT A SALON ON THE MAP.
 *
 * For a local business this is worth more than every other SEO change here
 * combined: it is what produces the panel with the address, the hours and the
 * "Open now" line, rather than a plain blue link. There was none of it before.
 *
 * Every field is read from the SALON constant the visible page uses, so the
 * structured data cannot drift from what a human reads — the failure mode that
 * gets structured data ignored, or penalised. There is deliberately NO
 * aggregateRating: inventing one is the kind of thing Google strips a profile
 * for, and the honest version reads the salon's own approved reviews, which is
 * a separate piece of work.
 */
function openingHours() {
  const DAYS: Record<string, string> = {
    Monday: 'Mo', Tuesday: 'Tu', Wednesday: 'We', Thursday: 'Th',
    Friday: 'Fr', Saturday: 'Sa', Sunday: 'Su',
  };
  const out: { '@type': 'OpeningHoursSpecification'; dayOfWeek: string[]; opens: string; closes: string }[] = [];
  for (const row of SALON.hours) {
    if (/closed/i.test(row.time)) continue;
    const [opens, closes] = row.time.split('–').map((s) => s.trim());
    if (!opens || !closes) continue;
    const days = row.days.split('–').map((s) => s.trim());
    const names = Object.keys(DAYS);
    const start = names.indexOf(days[0] ?? '');
    const end = days[1] ? names.indexOf(days[1]) : start;
    if (start < 0 || end < 0) continue;
    const span: string[] = [];
    for (let i = start; ; i = (i + 1) % 7) {
      span.push(names[i]!);
      if (i === end) break;
    }
    out.push({ '@type': 'OpeningHoursSpecification', dayOfWeek: span, opens, closes });
  }
  return out;
}

const STRUCTURED_DATA = {
  '@context': 'https://schema.org',
  '@type': 'HairSalon',
  name: SALON.name,
  description: SALON.intro,
  url: SITE_URL,
  telephone: SALON.phone,
  address: { '@type': 'PostalAddress', streetAddress: SALON.address, addressCountry: 'IN' },
  openingHoursSpecification: openingHours(),
  priceRange: '₹₹',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        {/* The salon's details in the shape Google reads. Rendered as data, not
            behaviour: it is a script tag of JSON that executes nothing. */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(STRUCTURED_DATA) }}
        />

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
