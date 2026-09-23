# Aster Hair & Skin — a worked example of a salon website that books into Parlon

An example of what a salon running on Parlon puts in front of its own
customers: their brand, their words, and a booking form that writes straight
into their diary. Port **3003**.

```
npm install
npm run dev
```

## What makes the booking real

`src/lib/api.ts` is the entire connection — four public endpoints, scoped by
the salon's slug:

```
GET  /public/:slug            the salon and its branches
GET  /public/:slug/services   the menu they offer online
GET  /public/:slug/slots      times genuinely free on a given day
POST /public/:slug/book       make the appointment
```

A booking is **not** an email to the salon. It creates the appointment in the
same diary the front desk is looking at, creates the customer record if they
are new, and fires the confirmation — so it is on their screen before the
customer has closed the tab, and the reminder goes out the day before on its
own.

The menu and the times are live, so they cannot drift out of date the way a
hand-written price list on a website always does.

No payment is taken. The customer reserves a time; money changes hands at the
counter, and the salon records it there.

## Making this a different salon's site

Change `NEXT_PUBLIC_SALON_SLUG` and the copy in `src/lib/salon.ts`. Nothing
else is salon-specific — the menu, the staff and the free times all come from
whichever salon the slug points at.

## Configuration

| Variable | Default | What it is |
|---|---|---|
| `NEXT_PUBLIC_SALON_SLUG` | `parlon` | Which salon's diary this books into |
| `NEXT_PUBLIC_API_URL` | `http://localhost:4000/api/v1` | The Parlon API |

## CORS

Add this origin to `CORS_ORIGINS` in the backend's `.env`, or the browser will
block the booking calls.
