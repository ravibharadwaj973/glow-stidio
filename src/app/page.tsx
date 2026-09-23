import { ArrowRight, Clock, MapPin, Phone, Quote, Star } from 'lucide-react';
import { Booking } from '@/components/booking';
import { SALON, TEAM, PHOTOS } from '@/lib/salon';
import { Photo } from '@/components/photo';

/**
 * The salon's own website.
 *
 * Nothing here mentions the software behind the counter, because a customer
 * booking a haircut should never have to think about it. The only trace of it
 * is that the Book button leads somewhere that genuinely knows which times are
 * free.
 *
 * Every `.photo-slot` is where the salon drops one of its own photographs.
 * They are warm gradient washes rather than stock images of somebody else's
 * salon — honest about being a placeholder, and presentable until replaced.
 */

const SERVICES = [
  { name: 'Cut & finish', from: '₹800', note: 'A consultation first, always. Wash, cut and a proper finish.' },
  { name: 'Colour', from: '₹2,500', note: 'Global, root touch-up, balayage and colour correction.' },
  { name: 'Hair treatments', from: '₹1,500', note: 'Keratin, botox and deep conditioning for tired hair.' },
  { name: 'Facials & skin', from: '₹1,200', note: 'Cleanups, hydrating facials, and honest advice about what you need.' },
  { name: 'Threading & waxing', from: '₹150', note: 'Quick, careful, and no queue if you book ahead.' },
  { name: 'Bridal & occasion', from: '₹6,000', note: 'A trial, then the day itself. Booked well in advance, please.' },
];

const REVIEWS = [
  {
    text: 'Priya spent twenty minutes talking me out of the colour I asked for, and she was right. First time a salon has ever done that.',
    name: 'Meera K.',
  },
  {
    text: 'Booked at midnight from my phone, got a reminder the next morning, walked in and they knew exactly what I wanted.',
    name: 'Arjun S.',
  },
  {
    text: 'Small place, no fuss, and my hair has never looked better. I have been going for two years now.',
    name: 'Divya R.',
  },
];

export default function HomePage() {
  return (
    <main>
      {/* ------------------------------------------------------------ hero */}
      <section className="mx-auto max-w-6xl px-5 pb-16 pt-12 sm:pt-20">
        <div className="grid items-center gap-12 lg:grid-cols-[1.05fr_1fr]">
          <div>
            <p className="eyebrow">Church Street · Bengaluru</p>

            <h1 className="display mt-4 text-5xl leading-[1.05] sm:text-6xl">
              A hair and skin studio
              <br />
              that takes its
              <span className="italic text-glow-700"> time</span>.
            </h1>

            <p className="mt-6 max-w-lg text-lg leading-relaxed text-ink-muted">{SALON.intro}</p>

            <div className="mt-9 flex flex-wrap items-center gap-3">
              <a href="#book" className="btn-primary h-12">
                Book an appointment
                <ArrowRight className="h-4 w-4" />
              </a>
              <a href={`tel:${SALON.phone.replace(/\s/g, '')}`} className="btn-ghost h-12">
                <Phone className="h-4 w-4" />
                {SALON.phone}
              </a>
            </div>

            <div className="mt-8 flex items-center gap-2.5">
              <span className="flex">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star key={star} className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                ))}
              </span>
              <span className="text-sm text-ink-muted">4.8 from 260 reviews on Google</span>
            </div>
          </div>

          {/* Hero photograph */}
          <div className="relative">
            <Photo
              src={PHOTOS.hero}
              alt={`Inside ${SALON.name}`}
              className="aspect-[4/5] rounded-[2rem] shadow-[0_24px_60px_-24px_rgba(76,29,149,0.35)]"
            />
            {/* A small card layered over the corner, the way a magazine would */}
            <div className="card absolute bottom-6 -left-4 w-52 p-4 sm:-left-10">
              <p className="display text-2xl">7 years</p>
              <p className="mt-0.5 text-xs leading-relaxed text-ink-muted">
                on Church Street, with most of the same faces behind the chairs.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* -------------------------------------------------------- services */}
      <section id="services" className="border-y border-stone-200 bg-white">
        <div className="mx-auto max-w-6xl px-5 py-20">
          <div className="max-w-xl">
            <p className="eyebrow">The menu</p>
            <h2 className="display mt-3 text-4xl">What we do</h2>
            <p className="mt-4 text-base leading-relaxed text-ink-muted">
              Prices start from these and depend on hair length and what the work actually needs. We will tell you
              before we begin, not after.
            </p>
          </div>

          <div className="mt-12 grid gap-x-10 gap-y-8 sm:grid-cols-2">
            {SERVICES.map((service) => (
              <div key={service.name} className="border-b border-stone-200 pb-6">
                <div className="flex items-baseline justify-between gap-4">
                  <h3 className="display text-xl">{service.name}</h3>
                  <span className="tnum shrink-0 text-sm text-glow-700">from {service.from}</span>
                </div>
                <p className="mt-2 text-sm leading-relaxed text-ink-muted">{service.note}</p>
              </div>
            ))}
          </div>

          <p className="mt-10 text-sm text-ink-muted">
            The full menu with exact prices is on the{' '}
            <a href="#book" className="font-medium text-glow-700 underline underline-offset-4">
              booking form below
            </a>
            .
          </p>
        </div>
      </section>

      {/* ------------------------------------------------------------ team */}
      <section id="team" className="mx-auto max-w-6xl px-5 py-20">
        <div className="max-w-xl">
          <p className="eyebrow">The people</p>
          <h2 className="display mt-3 text-4xl">Who you&rsquo;ll be sitting with</h2>
        </div>

        <div className="mt-12 grid gap-8 sm:grid-cols-3">
          {TEAM.map((person) => (
            <div key={person.name}>
              <Photo src={person.photo} alt={`${person.name}, ${person.role}`} className="aspect-[4/5] rounded-2xl" />
              <h3 className="display mt-4 text-xl">{person.name}</h3>
              <p className="eyebrow mt-1">{person.role}</p>
              <p className="mt-2 text-sm leading-relaxed text-ink-muted">{person.note}</p>
            </div>
          ))}
        </div>
      </section>

      {/* --------------------------------------------------------- reviews */}
      <section className="border-y border-stone-200 bg-white">
        <div className="mx-auto max-w-6xl px-5 py-20">
          <div className="grid gap-8 sm:grid-cols-3">
            {REVIEWS.map((review) => (
              <figure key={review.name}>
                <Quote className="h-5 w-5 text-glow-300" />
                <blockquote className="mt-3 text-base leading-relaxed text-ink">&ldquo;{review.text}&rdquo;</blockquote>
                <figcaption className="mt-3 text-sm text-ink-subtle">{review.name}</figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>

      {/* ----------------------------------------------------------- book */}
      {/* The form itself, on the page people actually land on. A "Book" button
          that only leads to another page loses someone at every hop; the times
          below are the real gaps in the diary, and confirming writes straight
          into it. */}
      <section id="book" className="scroll-mt-20 bg-gradient-to-b from-glow-50/60 to-transparent">
        <div className="mx-auto max-w-2xl px-5 py-20">
          <div className="text-center">
            <p className="eyebrow">No deposit, no card</p>
            <h2 className="display mt-3 text-4xl">Book an appointment</h2>
            <p className="mx-auto mt-4 max-w-lg text-base leading-relaxed text-ink-muted">
              Pick what you would like and we will show you the times genuinely free. You pay us at the salon
              afterwards, as always.
            </p>
          </div>

          <div className="mt-10">
            <Booking />
          </div>

          <p className="mt-6 text-center text-sm text-ink-muted">
            Would rather talk to someone?{' '}
            <a
              href={`tel:${SALON.phone.replace(/\s/g, '')}`}
              className="font-medium text-glow-700 underline underline-offset-4"
            >
              Call {SALON.phone}
            </a>
          </p>
        </div>
      </section>

      {/* ----------------------------------------------------------- visit */}
      <section id="visit" className="mx-auto max-w-6xl px-5 py-20">
        <div className="grid gap-12 lg:grid-cols-[1fr_1fr] lg:items-center">
          <div>
            <p className="eyebrow">Find us</p>
            <h2 className="display mt-3 text-4xl">Visit us</h2>

            <div className="mt-8 space-y-5">
              <p className="flex items-start gap-3 text-base text-ink-muted">
                <MapPin className="mt-1 h-4 w-4 shrink-0 text-glow-600" />
                {SALON.address}
              </p>
              <p className="flex items-start gap-3 text-base text-ink-muted">
                <Phone className="mt-1 h-4 w-4 shrink-0 text-glow-600" />
                <a href={`tel:${SALON.phone.replace(/\s/g, '')}`} className="hover:text-ink">
                  {SALON.phone}
                </a>
              </p>

              <div className="flex items-start gap-3">
                <Clock className="mt-1 h-4 w-4 shrink-0 text-glow-600" />
                <ul className="space-y-1 text-base text-ink-muted">
                  {SALON.hours.map((row) => (
                    <li key={row.days} className="flex gap-6">
                      <span className="w-44">{row.days}</span>
                      <span className="tnum">{row.time}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <a href="#book" className="btn-primary mt-9 h-12">
              Book an appointment
              <ArrowRight className="h-4 w-4" />
            </a>
          </div>

          <Photo
            src={PHOTOS.interior}
            alt={`The studio at ${SALON.name}`}
            className="aspect-[5/4] rounded-[2rem] shadow-[0_24px_60px_-24px_rgba(76,29,149,0.3)]"
          />
        </div>
      </section>
    </main>
  );
}
