'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { captureArrival, track } from '@/lib/track';

/**
 * Reads the arrival code once, then reports each page the visitor opens.
 *
 * Renders nothing. Sits in the layout so every route is covered without each
 * page having to remember — a page that forgets is a hole in the funnel that
 * looks exactly like a customer who did not go there.
 *
 * The first effect runs before the first report so the code is out of the
 * address bar and in session storage by the time anything is sent.
 */
export function Arrival() {
  const pathname = usePathname();

  useEffect(() => {
    captureArrival();
  }, []);

  useEffect(() => {
    captureArrival();
    track('page_view');
  }, [pathname]);

  return null;
}
