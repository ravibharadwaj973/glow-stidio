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

## The gallery, and where the photographs live

`/gallery` shows the salon's work grouped by service. The photographs live in
**Cloudinary**, not in this repository, because a salon's gallery changes weekly
and a workflow that needs a commit and a deploy to add three pictures of a
balayage is a workflow no owner uses twice.

How a salon adds one:

1. Upload it in Cloudinary (web or phone app).
2. Tag it with the collection's tag — `gallery-colour`, `gallery-cuts`, and so
   on; the tags are listed in `src/lib/gallery.ts`.
3. Fill in its `alt` context field with a sentence saying what is in the
   picture, and `caption` if there is something to say about it.

It appears within the hour. No deploy, no developer.

**One Cloudinary setting has to be changed.** Cloudinary restricts the tag-list
endpoint by default: Settings → Security → uncheck **Resource list** under
restricted media types. Until it is unchecked the endpoint returns 404 and the
site quietly falls back to the local photographs in `public/photos/`. That is
the intended failure — a gallery with four studio pictures beats an error page.

`f_auto,q_auto,dpr_auto` are applied to every delivery URL, which is usually the
difference between a 2.4MB phone photograph and 90KB. On an Indian mobile
connection that is the difference between a gallery somebody scrolls and one
they leave.

There is **no Cloudinary API secret in this site**. The tag-list endpoint is
unsigned and read-only; a secret would end up in a `.env` on every host the
site runs on, and it can delete every image in the account.

`PHOTOS` in `src/lib/salon.ts` takes either form: anything starting with `/` is
a file in `public/`, anything else is treated as a Cloudinary public_id. So
moving the fixed site photographs to Cloudinary is changing `/photos/hero.jpg`
to `glow/hero` and nothing else.

## Feedback, and who decides what appears

The feedback section is configured **in the salon's own app** (Settings →
Feedback on your website), not here: the heading, the line underneath, whether
a phone number is required, and whether approved reviews are shown. Every salon
using this site as a starting point wants different words, and some want no
form at all.

Two things it does not do:

- **It never publishes anything on its own.** Every review shown has been
  published one at a time by a person at the salon. A public form that put a
  stranger's sentence on the salon's page the moment they pressed send would be
  a defacement tool with a rating attached.
- **These ratings are not in the salon's average.** Anybody with the web
  address can leave one, so folding them in would make the number the salon
  judges itself by something a competitor can move. They are counted and shown
  separately in the app.

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
