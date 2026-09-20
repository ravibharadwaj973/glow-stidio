/**
 * Who this website belongs to, and how it reaches its own diary.
 *
 * Aster is a worked example of a CUSTOMER's site — its own name, its own
 * colours, nothing of Parlon's on it. That is the point: a salon's website is
 * their brand, and the only trace of the software is that the booking form
 * knows which times are genuinely free.
 *
 * The slug is the one piece of configuration that matters: it is how the
 * booking API knows which salon this is. Change SALON_SLUG and this same site
 * books into a different salon's diary — which is exactly how a second salon
 * would use this as a starting point.
 */
export const SALON_SLUG = process.env.NEXT_PUBLIC_SALON_SLUG ?? 'parlon';

export const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'https://api.jharavi.in/api/v1';

/** Copy that belongs to the salon, not to the software. */
export const SALON = {
  name: 'Aster Hair & Skin',
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

export const TEAM = [
  { name: 'Priya Sharma', role: 'Founder & Colour Specialist', note: 'Fourteen years, most of them spent on balayage and colour correction.' },
  { name: 'Rahul Verma', role: 'Senior Stylist', note: 'Precision cuts, and the person to ask if you are changing your look entirely.' },
  { name: 'Ananya Rao', role: 'Skin Therapist', note: 'Facials and skin consultations. Will tell you honestly if you do not need a treatment.' },
] as const;
