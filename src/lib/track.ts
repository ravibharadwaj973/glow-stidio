import { API_URL, SALON_SLUG } from './salon';

/**
 * WHAT HAPPENED AFTER THEY TAPPED THE LINK.
 *
 * The salon's system already knows a message was delivered, and whether the
 * link in it was tapped. Then the trail stops. A campaign's funnel goes
 * "clicked → booked" with nothing in between, so a campaign where forty people
 * opened the gallery and none of them booked looks identical to one nobody
 * opened at all. Those are opposite problems: the first is a pricing or a
 * follow-up problem, the second is a message problem.
 *
 * This closes that gap, and it is deliberately the smallest thing that does.
 *
 * ── WHO IS TRACKED, AND WHO IS NOT ───────────────────────────────────────
 *
 * ONLY visitors who arrived by tapping a link the salon sent them.
 *
 * The redirect that counts the tap already knows which message the link was
 * in, so it hands that code on to this site as `?pv=`. No code, no report —
 * somebody who finds the salon on Google or types the address in is not
 * tracked at all, not anonymously, not with a cookie, not with a beacon. The
 * site simply says nothing about them.
 *
 * That line is drawn where it is on purpose. Tracking the message recipient is
 * measuring a conversation the salon and the customer are already having, and
 * one the customer opted into. Tracking everybody else is web analytics, which
 * is a different product with different obligations — under the DPDP Act it
 * needs its own notice and consent, and bolting it on quietly here because the
 * code was already open is exactly how that goes wrong.
 *
 * ── WHAT IS SENT ─────────────────────────────────────────────────────────
 *
 * The link code, the page path, and the name of the thing that happened. No
 * cookies, no localStorage that outlives the tab, no device fingerprint, no
 * third party, no scroll or mouse recording. The salon's own API is the only
 * host contacted.
 *
 * The code is taken out of the address bar as soon as it is read, so a
 * customer who copies the link to a friend does not hand over a token that
 * identifies them — it would otherwise credit their friend's browsing to their
 * own record, which is both wrong and a small privacy leak dressed as a
 * feature.
 */

const STORAGE_KEY = 'parlon.pv';
const SESSION_KEY = 'parlon.sid';

/** sessionStorage throws in some private modes. Nothing here is worth a crash. */
function readToken(): string | null {
  try {
    return window.sessionStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

function saveToken(code: string): void {
  try {
    window.sessionStorage.setItem(STORAGE_KEY, code);
  } catch {
    /* A visitor who blocks storage is simply not measured. */
  }
}

/**
 * Take the code out of the URL and remember it for this tab.
 *
 * Called once on arrival. The address bar is rewritten with replaceState so
 * there is no extra history entry — a customer pressing Back should get the
 * page before the salon's message, not the same page with a token on it.
 */
export function captureArrival(): string | null {
  if (typeof window === 'undefined') return null;

  const params = new URLSearchParams(window.location.search);
  const code = params.get('pv');

  if (code) {
    saveToken(code);
    params.delete('pv');
    const query = params.toString();
    window.history.replaceState(
      null,
      '',
      window.location.pathname + (query ? `?${query}` : '') + window.location.hash,
    );
    return code;
  }

  return readToken();
}

/**
 * ONE VISIT'S WORTH OF EVENTS, TIED TOGETHER.
 *
 * Without this, "opened the gallery, looked at hair, looked at hair spa,
 * started booking and stopped" is four unrelated rows and the journey — the
 * only interesting thing about them — cannot be reassembled.
 *
 * DELIBERATELY NOT A DEVICE IDENTIFIER. It is random, it lives in
 * sessionStorage, and it dies with the tab, so it cannot be used to recognise
 * anybody across visits or across sites. Who this is was already established by
 * the link the salon sent them; this only says which events belong to the same
 * sitting.
 */
function sessionId(): string | null {
  try {
    const existing = window.sessionStorage.getItem(SESSION_KEY);
    if (existing) return existing;

    // crypto.randomUUID is not in every browser a salon's customers use; the
    // fallback does not need to be cryptographic, only unlikely to collide
    // within one tab.
    const fresh =
      typeof crypto !== 'undefined' && 'randomUUID' in crypto
        ? crypto.randomUUID()
        : `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 10)}`;

    window.sessionStorage.setItem(SESSION_KEY, fresh);
    return fresh;
  } catch {
    // Storage blocked. The events still record, just without a journey.
    return null;
  }
}

/**
 * Report something that happened, if this visitor came from a message.
 *
 * Fire-and-forget by design. A failed report must never delay a page or show a
 * customer an error: the worst case of losing one is a slightly less complete
 * funnel, and the worst case of blocking on it is somebody giving up on
 * booking.
 */
export function track(event: string, metadata: Record<string, string> = {}, label?: string): void {
  if (typeof window === 'undefined') return;

  const code = readToken();
  if (!code) return;

  const sid = sessionId();

  const body = JSON.stringify({
    code,
    event,
    path: window.location.pathname,
    ...(label ? { label } : {}),
    ...(sid ? { sessionId: sid } : {}),
    /**
     * Nested rather than spread alongside the event, so a page cannot
     * accidentally overwrite `code` or `path` by naming a metadata key the same
     * thing. The API keeps its own allow-list of metadata keys as well.
     */
    ...(Object.keys(metadata).length > 0 ? { metadata } : {}),
  });

  try {
    /**
     * sendBeacon survives the page being closed, which matters for the last
     * thing somebody does before leaving — often the most interesting event on
     * the page. fetch with keepalive is the fallback; a plain fetch would be
     * cancelled by the navigation it is reporting.
     *
     * text/plain, NOT application/json, and it is load-bearing. The API is on
     * a different origin, and a Blob of application/json is not a
     * CORS-safelisted content type, so the browser must send a preflight
     * first. A preflight fired while the page is unloading frequently never
     * completes, which would lose exactly the events this uses sendBeacon to
     * catch. text/plain goes straight out, and the API parses it.
     */
    const url = `${API_URL}/public/${SALON_SLUG}/visit`;
    if (navigator.sendBeacon) {
      navigator.sendBeacon(url, new Blob([body], { type: 'text/plain;charset=UTF-8' }));
      return;
    }
    void fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=UTF-8' },
      body,
      keepalive: true,
    }).catch(() => {});
  } catch {
    /* Never a customer's problem. */
  }
}
