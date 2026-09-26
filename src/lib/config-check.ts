import { API_URL, SALON, SALON_SLUG } from './salon';

/**
 * IS THIS SITE POINTED AT THE RIGHT SALON?
 *
 * The bug this exists for was live on a production deployment: the slug was set
 * to `parlon`, which is the fallback that used to be written into salon.ts and
 * is not a salon that exists. Every request returned "Salon not found" and
 * nothing anywhere named the cause — not the build, not the console, not the
 * page.
 *
 * The slug is the single most consequential value in this repository. It decides
 * which business's diary gets written to, whose customers are created, and whose
 * confirmation messages go out. Getting it wrong has no visible symptom when the
 * wrong slug happens to exist: every request returns 200 and the bookings land
 * on somebody else's book.
 *
 * ── Development only, and that is not laziness ────────────────────────────
 *
 * A misconfiguration is for whoever is deploying the site, not for the customer
 * reading it. In production this returns immediately: a warning banner or a
 * console error on a salon's public page would be the app airing its own
 * problems to the people least able to fix them. The place to catch this is
 * `npm run dev`, before it ships.
 */
export async function checkSalonConfig(): Promise<void> {
  if (process.env.NODE_ENV === 'production') return;

  const complain = (...lines: string[]) => {
    // eslint-disable-next-line no-console
    console.error(['', '  ── Parlon configuration ──', ...lines.map((l) => `  ${l}`), ''].join('\n'));
  };

  if (!SALON_SLUG) {
    complain(
      'NEXT_PUBLIC_SALON_SLUG is not set, so this site does not know whose salon it is.',
      'Every request will come back "Salon not found".',
      'Set it in .env.local — it is the slug from the salon’s own Parlon account.',
    );
    return;
  }

  try {
    const response = await fetch(`${API_URL}/public/${SALON_SLUG}`, { cache: 'no-store' });
    const payload = (await response.json().catch(() => null)) as
      | { success?: boolean; data?: { salon?: { name?: string; slug?: string } }; error?: { message?: string } }
      | null;

    if (!response.ok || !payload?.success) {
      complain(
        `NEXT_PUBLIC_SALON_SLUG is "${SALON_SLUG}" and the API does not recognise it.`,
        `The API said: ${payload?.error?.message ?? `HTTP ${response.status}`}`,
        `Checked: ${API_URL}/public/${SALON_SLUG}`,
      );
      return;
    }

    const apiName = payload.data?.salon?.name ?? '';

    /**
     * A LENIENT name comparison, on purpose.
     *
     * The account is "Glow Studio Salon & Spa" and this site's own copy says
     * "Glow Studio" — a deliberately shorter brand name, not a mistake. An exact
     * match would cry wolf on every salon that trades under a shorter name than
     * it registered, and a check that is usually wrong is a check people learn
     * to ignore. So it only complains when neither name contains the other,
     * which is what a genuinely different salon looks like.
     */
    const a = apiName.toLowerCase();
    const b = SALON.name.toLowerCase();
    if (a && b && !a.includes(b) && !b.includes(a)) {
      complain(
        `This site’s copy says "${SALON.name}" but slug "${SALON_SLUG}" belongs to "${apiName}".`,
        'One of the two is wrong. Bookings, customers and confirmations all go to the slug.',
      );
    }
  } catch {
    /**
     * Unreachable is not misconfigured.
     *
     * A developer working offline, or with the API not started yet, does not
     * need to be told their slug is wrong — it probably is not, and a false
     * alarm here is how this whole check gets ignored.
     */
  }
}
