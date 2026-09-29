/**
 * Who this website belongs to, and how it reaches its own diary.
 *
 * Glow Studio is a worked example of a CUSTOMER's site — its own name, its own
 * colours, nothing of Parlon's on it. That is the point: a salon's website is
 * their brand, and the only trace of the software is that the booking form
 * knows which times are genuinely free.
 *
 * The slug is the one piece of configuration that matters: it is how the
 * booking API knows which salon this is. Change SALON_SLUG and this same site
 * books into a different salon's diary — which is exactly how a second salon
 * would use this as a starting point.
 */
/**
 * WHOSE SALON THIS SITE IS.
 *
 * No fallback, deliberately. This used to default to 'parlon' — a slug that
 * does not exist on the live system — which meant an unset variable produced a
 * site where every request returned "Salon not found" and nothing said why. The
 * worse version of the same mistake is a default that DOES exist: then the site
 * quietly reads and writes another salon's diary, creates customers on their
 * book, and fires their confirmation messages, with every request returning a
 * clean 200.
 *
 * So an unset variable gives an empty slug, and checkSalonConfig below says so
 * out loud the first time the site renders in development.
 */
export const SALON_SLUG = process.env.NEXT_PUBLIC_SALON_SLUG ?? '';

export const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'https://api.jharavi.in/api/v1';

/**
 * WHERE THIS SITE LIVES, absolutely.
 *
 * Needed in three places that cannot use a relative path: robots.txt, the
 * sitemap, and the og:image tag. A relative og:image is simply dropped by
 * WhatsApp and every other link preview, which is the whole reason the
 * preview was blank.
 *
 * Vercel sets VERCEL_PROJECT_PRODUCTION_URL on every deployment, so the
 * fallback is right even before anyone sets a variable — and the last resort
 * is the real domain rather than localhost, because a sitemap full of
 * localhost URLs is worse than no sitemap.
 */
export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ||
  (process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : 'https://glow-stidio.vercel.app')
).replace(/\/$/, '');

/** Copy that belongs to the salon, not to the software. */
export const SALON = {
  name: 'Glow Studio',
  tagline: 'A hair and skin studio in Bengaluru',
  intro:
    'We are a small team who would rather do a few things properly than everything at once. Colour, cuts and skin — and the time to actually talk about what you want before we start.',
  address: '2nd Floor, 14 Church Street, Bengaluru 560001',
  phone: '+91 98765 43210',
  hours: [
    { days: 'Tuesday – Friday', time: '10:00 – 20:00' },
    { days: 'Saturday – Sunday', time: '10:00 – 21:00' },
    { days: 'Monday', time: 'Closed' },
  ],
} as const;

/**
 * The menu.
 *
 * Lives here rather than on the homepage because the gallery groups its
 * pictures by service, and two lists of service names drift the moment
 * somebody renames one: a category called “Hair colour” above a menu item
 * called “Colour” reads as two different services to a customer choosing
 * between them.
 */
export const SERVICES = [
  { name: 'Cut & finish', from: '₹800', note: 'A consultation first, always. Wash, cut and a proper finish.' },
  { name: 'Colour', from: '₹2,500', note: 'Global, root touch-up, balayage and colour correction.' },
  { name: 'Hair treatments', from: '₹1,500', note: 'Keratin, botox and deep conditioning for tired hair.' },
  { name: 'Facials & skin', from: '₹1,200', note: 'Cleanups, hydrating facials, and honest advice about what you need.' },
  { name: 'Threading & waxing', from: '₹150', note: 'Quick, careful, and no queue if you book ahead.' },
  { name: 'Bridal & occasion', from: '₹6,000', note: 'A trial, then the day itself. Booked well in advance, please.' },
] as const;

/**
 * The salon's photographs.
 *
 * Put the files in `public/photos/` and name them here. A slot left null keeps
 * the gradient, which is why this ships with nothing set: an empty gradient
 * reads as a design choice, while a broken image reads as a broken website.
 *
 * Use the salon's own pictures. A stock photograph of somebody else's salon is
 * worse than no photograph — a customer who walks in and finds a different room
 * has been told something untrue before they sat down.
 */
export const PHOTOS = {
  /** Beside the headline. Portrait, about 4:5. */
  hero: '/photos/hero.jpg' as string | null,
  /** The room itself, near "Come and see us". Landscape, about 5:4. */
  interior: '/photos/interior.jpg' as string | null,
  /** A wide band under "The menu" — tools, product, the texture of the work. */
  tools: '/photos/tools.jpg' as string | null,
  /**
   * The people section.
   *
   * One wide photograph rather than three portraits, because there are no
   * headshots. Three empty gradients beside two real photographs reads as a
   * half-finished website; one good picture of somebody at work, with the names
   * as text beneath, reads as a choice. Add headshots to TEAM[].photo and the
   * three-portrait layout comes back on its own.
   */
  team: '/photos/team.jpg' as string | null,
  /** The shopfront, as a full-width strip before the booking form. */
  sign: '/photos/sign.jpg' as string | null,
};

export const TEAM = [
  {
    name: 'Priya Sharma',
    role: 'Founder & Colour Specialist',
    note: 'Fourteen years, most of them spent on balayage and colour correction.',
    photo: null as string | null,
  },
  {
    name: 'Rahul Verma',
    role: 'Senior Stylist',
    note: 'Precision cuts, and the person to ask if you are changing your look entirely.',
    photo: null as string | null,
  },
  {
    name: 'Ananya Rao',
    role: 'Skin Therapist',
    note: 'Facials and skin consultations. Will tell you honestly if you do not need a treatment.',
    photo: null as string | null,
  },
];
