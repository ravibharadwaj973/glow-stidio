'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, Phone, X } from 'lucide-react';

/**
 * THE NAVIGATION, ON A PHONE — WHICH IS HOW NEARLY EVERYONE ARRIVES HERE.
 *
 * The header had `hidden sm:flex` on its links, so below 640px this site had a
 * salon name, a Book button, and no navigation whatsoever. Services, the gallery,
 * the team, the address and the opening hours were all unreachable except by
 * scrolling the home page and hoping. For a salon's own website that is close to
 * the worst thing the layout could do: the visitors it fails are the ones
 * standing outside with a phone in their hand.
 *
 * ── One list, two renderings ──────────────────────────────────────────────
 *
 * The links live in the layout and are handed to both the desktop row and this
 * button, so the two cannot drift. The one that goes stale otherwise is always
 * the mobile one, because it is the one nobody on the team looks at.
 *
 * ── The phone number is in the menu, and that is the point ───────────────
 *
 * Every link here answers a question. "What do you charge", "where are you",
 * "who will cut my hair" — and, more often than all of them, "can I just ring
 * you". The number is already in the footer, which is a long scroll away on a
 * phone. Here it is one tap from anywhere on the site.
 *
 * ── SHORT screens, not just narrow ones ──────────────────────────────────
 *
 * Five rows is taller than a small phone held sideways, and taller again with a
 * keyboard open. So the panel is capped at the viewport minus the header and
 * scrolls inside itself rather than running off the bottom. `dvh` rather than
 * `vh`, because on mobile Safari `vh` is the height with the browser chrome
 * hidden — which is not the height this panel actually gets.
 */

export interface NavLink {
  href: string;
  label: string;
}

/**
 * The width at which the desktop row appears, as a query rather than a class.
 * It has to be said twice — Tailwind cannot hand its `sm` to JavaScript — so it
 * is named here, and the class it must agree with is `sm:hidden` below.
 */
const DESKTOP = '(min-width: 640px)';

export function SiteNav({ links, phone }: { links: NavLink[]; phone?: string }) {
  const [open, setOpen] = useState(false);
  const trigger = useRef<HTMLButtonElement>(null);
  const panel = useRef<HTMLDivElement>(null);
  const pathname = usePathname();

  /**
   * Closing returns focus to the button that opened it. Without it, dismissing
   * with Escape leaves focus on an element that has just been removed, and the
   * next Tab starts again from the top of the page — so somebody navigating by
   * keyboard is thrown back to the salon name every time they change their mind.
   */
  const close = useCallback((restoreFocus = true) => {
    setOpen(false);
    if (restoreFocus) trigger.current?.focus();
  }, []);

  /** Escape, from anywhere. The one shortcut every menu is expected to have. */
  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') close();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, close]);

  /**
   * A menu left open across a page change covers the page somebody has just
   * asked for. Each row closes it on the way out, which handles the in-page
   * `#anchor` links where the path never changes; this handles going Back, and
   * any navigation begun somewhere else.
   */
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  /**
   * Turn the phone sideways and the button this belongs to disappears at 640px.
   * Hiding the panel with a class alone would leave it open behind the scenes,
   * to reappear on the way back to portrait.
   */
  useEffect(() => {
    const desktop = window.matchMedia(DESKTOP);
    const onChange = () => {
      if (desktop.matches) setOpen(false);
    };
    desktop.addEventListener('change', onChange);
    return () => desktop.removeEventListener('change', onChange);
  }, []);

  /** Opening moves focus into the menu, so the first Tab lands inside it. */
  useEffect(() => {
    if (open) panel.current?.querySelector<HTMLAnchorElement>('a')?.focus();
  }, [open]);

  return (
    <>
      <button
        ref={trigger}
        type="button"
        onClick={() => (open ? close() : setOpen(true))}
        aria-expanded={open}
        aria-controls="site-menu"
        aria-label={open ? 'Close menu' : 'Menu'}
        /**
         * 44px square — the smallest target a thumb hits reliably — and `-mr-2`
         * so the icon sits on the page's 20px gutter rather than the button's
         * edge. Optical alignment, not mathematical.
         */
        className="-mr-2 inline-flex h-11 w-11 items-center justify-center rounded-full text-ink-muted transition-colors hover:bg-stone-200/60 hover:text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-glow-500 sm:hidden"
      >
        {open ? <X className="h-5 w-5" aria-hidden /> : <Menu className="h-5 w-5" aria-hidden />}
      </button>

      {open ? (
        <>
          {/**
           * Tap anywhere else to dismiss — the gesture people try first, and
           * without it the only way out is finding the same small button again.
           *
           * `absolute … top-full h-[100dvh]` rather than `fixed`, so it begins
           * exactly under the header whatever height the header turns out to be,
           * and stays with it while the page scrolls beneath.
           */}
          <div
            className="absolute inset-x-0 top-full h-[100dvh] bg-ink/20 sm:hidden"
            onClick={() => close(false)}
            aria-hidden
          />

          <div
            id="site-menu"
            ref={panel}
            /**
             * Opaque, not the header's frosted glass. The header is a thin strip
             * and the page reads through it as texture; a panel deep enough for
             * five rows reads through it as the headline sitting behind the
             * links, which is simply hard to read.
             */
            className="nav-drop absolute inset-x-0 top-full max-h-[calc(100dvh-5rem)] overflow-y-auto border-b border-stone-200 bg-sand shadow-[0_16px_40px_-24px_rgba(76,29,149,0.4)] sm:hidden"
          >
            {/* px-2 here plus px-3 on each row lands the text on the page's own
                20px gutter, so the links line up under the salon name. */}
            <nav aria-label="Site" className="mx-auto max-w-6xl px-2 py-2">
              {links.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => close(false)}
                  /**
                   * Full-width rows rather than a centred stack: the whole row is
                   * the target, which is what a thumb is aiming at, and a column
                   * of left-aligned labels is read faster than a centred one.
                   */
                  className="block rounded-xl px-3 py-3 text-[0.9375rem] font-medium text-ink transition-colors hover:bg-glow-50 focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-glow-500 active:bg-glow-100/70"
                >
                  {link.label}
                </Link>
              ))}

              {phone ? (
                <>
                  <div className="mx-3 my-1 h-px bg-stone-200" />
                  {/**
                   * A plain `tel:` anchor rather than a button, so it is
                   * long-pressable, copyable, and offered to whatever the phone
                   * uses to make calls. The number is shown as well as linked:
                   * somebody on a desktop needs to read it, and somebody on a
                   * phone likes to see what they are about to dial.
                   */}
                  <a
                    href={`tel:${phone.replace(/[^+\d]/g, '')}`}
                    onClick={() => close(false)}
                    className="flex items-center gap-2.5 rounded-xl px-3 py-3 text-[0.9375rem] font-medium text-glow-700 transition-colors hover:bg-glow-50 focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-glow-500 active:bg-glow-100/70"
                  >
                    <Phone className="h-4 w-4 shrink-0" aria-hidden />
                    {phone}
                  </a>
                </>
              ) : null}
            </nav>
          </div>
        </>
      ) : null}
    </>
  );
}
