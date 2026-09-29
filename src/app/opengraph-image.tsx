import { ImageResponse } from 'next/og';
import { SALON } from '@/lib/salon';

/**
 * THE CARD THAT APPEARS WHEN THE SALON SENDS ITS OWN LINK.
 *
 * This site had no og:image and no og tags at all, which matters more here
 * than on most sites: essentially all of this salon's traffic arrives as a
 * link pasted into WhatsApp. A link with no preview renders as a bare blue
 * URL — the exact shape of every scam message anybody has ever been sent — so
 * the salon's own marketing was arriving looking untrustworthy.
 *
 * Generated rather than a designed file, because it has to stay correct when
 * the salon is renamed or the site is reused for a second salon: it reads the
 * same SALON constant the site does. No photograph, since the gallery changes
 * and a stale hero shot ages worse than type does.
 */
export const runtime = 'edge';
export const alt = `${SALON.name} — ${SALON.tagline}`;
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          height: '100%',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          background: '#faf6f1',
          padding: '80px',
          // A left rule in the brand colour, so the card is recognisable as
          // this salon's at thumbnail size where the words are unreadable.
          borderLeft: '24px solid #8a5a3b',
        }}
      >
        <div style={{ fontSize: 88, color: '#2b2118', letterSpacing: '-0.03em', display: 'flex' }}>
          {SALON.name}
        </div>
        <div style={{ fontSize: 36, color: '#6b5c4d', marginTop: 20, display: 'flex' }}>
          {SALON.tagline}
        </div>
        <div style={{ fontSize: 26, color: '#8a5a3b', marginTop: 48, display: 'flex' }}>
          {SALON.address}
        </div>
      </div>
    ),
    size,
  );
}
