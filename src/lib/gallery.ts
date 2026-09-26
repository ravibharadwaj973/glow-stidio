import { SERVICES } from './salon';
import { cldUrl, imagesByTag } from './cloudinary';

/**
 * THE SALON'S WORK, ORGANISED BY WHAT IT IS.
 *
 * A gallery is the one page that changes somebody's mind. The menu tells them
 * a balayage costs ₹2,500; the gallery tells them whether this salon can do
 * balayage. Nobody books colour from a price list.
 *
 * ── The one rule ──────────────────────────────────────────────────────────
 *
 * EVERY PHOTOGRAPH HERE IS THE SALON'S OWN WORK. Not a stock library, not a
 * screenshot from somewhere else's Instagram. A customer who books a cut
 * because of a picture the salon did not take has been told something untrue
 * before they sat down, and they find out in the chair. salon.ts makes the
 * same argument about the room; it matters more here, because these pictures
 * are a claim about ability rather than about décor.
 *
 * Which is why this ships with the studio photographs only and no service
 * work. Empty is honest. The moment there are real pictures of real colour,
 * they go in COLLECTIONS below and the category appears on its own.
 *
 * ── Adding photographs ────────────────────────────────────────────────────
 *
 * Through CLOUDINARY, so that adding three pictures of a balayage does not
 * mean a developer, a commit and a deploy — the workflow that leaves galleries
 * eighteen months out of date:
 *
 *   1. Upload in Cloudinary.
 *   2. Tag it with the collection's `tag` below (gallery-colour, gallery-cuts…).
 *   3. Fill in its `alt` context field, and `caption` if there is something to
 *      say. See lib/cloudinary.ts for the one Cloudinary setting this needs.
 *
 * The `photos` array on each collection is the FALLBACK, used when Cloudinary
 * is not configured or has nothing under that tag. It is how this site ships
 * with its four studio photographs and no service work, and how it keeps
 * working if Cloudinary is unreachable.
 *
 * Landscape crops to 4:3 and portrait to 4:5, so a full-length cut is not
 * beheaded by a square grid cell. Say which each one is; the default is
 * landscape because most phone photographs of a finished head are.
 */

export interface GalleryPhoto {
  src: string;
  /**
   * What is in the picture, in a sentence.
   *
   * Required, as it is on every other picture on this site. Somebody choosing
   * a salon with a screen reader is making the same decision on the same
   * information, and "gallery image 4" is not information.
   */
  alt: string;
  /** A line under the picture. The service, the stylist, how long it took. */
  caption?: string;
  shape?: 'landscape' | 'portrait';
}

export interface GalleryCollection {
  /** The url fragment: /gallery#colour. */
  key: string;
  /**
   * The Cloudinary tag the salon puts on photographs for this collection.
   *
   * Named after the collection rather than generated from it, so renaming a
   * heading on the website never silently empties a category that has fifty
   * pictures in Cloudinary under the old tag.
   */
  tag: string;
  /** The filter chip, and the heading. */
  label: string;
  /**
   * Which entry on the menu this is work FOR.
   *
   * Kept as the service's own name rather than a free-text label so the two
   * lists cannot drift: a gallery category called "Hair colour" sitting above
   * a menu item called "Colour" reads as two different services to a customer
   * deciding between them.
   */
  service: (typeof SERVICES)[number]['name'] | null;
  /** One line under the heading. What somebody is looking at. */
  blurb: string;
  photos: GalleryPhoto[];
}

export const COLLECTIONS: GalleryCollection[] = [
  {
    key: 'studio',
    tag: 'gallery-studio',
    label: 'The studio',
    service: null,
    blurb: 'The room, the tools and the street door — so you know what you are walking into.',
    photos: [
      {
        src: '/photos/interior.jpg',
        alt: 'The main room, with three styling chairs facing a mirrored wall',
        caption: 'Three chairs, and never more than three appointments at once.',
      },
      {
        src: '/photos/tools.jpg',
        alt: 'Scissors, combs and colour bowls laid out on a counter',
        caption: 'Colour is mixed fresh for each head.',
      },
      {
        src: '/photos/team.jpg',
        alt: 'Two stylists at work in the studio',
        caption: 'Priya and Rahul, mid-afternoon.',
      },
      {
        src: '/photos/sign.jpg',
        alt: 'The Glow Studio sign above the entrance on Church Street',
        caption: 'Second floor, above the bookshop.',
      },
    ],
  },

  /**
   * The service collections, waiting for real photographs.
   *
   * Left in place with empty arrays deliberately: the structure is the
   * instruction. A salon owner opening this file sees exactly where their
   * colour pictures go, and until they add any, the category is simply not
   * rendered — no "coming soon", no empty grid, no apology on a page a
   * customer is reading.
   */
  {
    key: 'colour',
    tag: 'gallery-colour',
    label: 'Colour',
    service: 'Colour',
    blurb: 'Balayage, global colour and corrections. Before and after, wherever we have both.',
    photos: [],
  },
  {
    key: 'cuts',
    tag: 'gallery-cuts',
    label: 'Cuts',
    service: 'Cut & finish',
    blurb: 'Finished cuts, shot in the salon under the same light you will see yourself in.',
    photos: [],
  },
  {
    key: 'treatments',
    tag: 'gallery-treatments',
    label: 'Treatments',
    service: 'Hair treatments',
    blurb: 'Keratin, botox and deep conditioning — the difference is easier to show than to describe.',
    photos: [],
  },
  {
    key: 'skin',
    tag: 'gallery-skin',
    label: 'Skin',
    service: 'Facials & skin',
    blurb: 'Facials and cleanups. Only ever with the customer’s permission to publish.',
    photos: [],
  },
  {
    key: 'bridal',
    tag: 'gallery-bridal',
    label: 'Bridal & occasion',
    service: 'Bridal & occasion',
    blurb: 'Trials and wedding days, from the last two seasons.',
    photos: [],
  },
];

/**
 * The collections as they should actually be drawn: Cloudinary's pictures where
 * there are any, the local fallback where there are not, and nothing at all
 * for a collection that is empty both ways.
 *
 * Cloudinary WINS over the fallback rather than adding to it. A salon that has
 * uploaded real colour work does not want the four studio photographs mixed
 * into that collection, and a collection showing both would be impossible to
 * reason about from the Cloudinary side.
 *
 * All the tags are fetched at once. Six sequential round trips to build one
 * page is most of a second on a good connection and the difference between a
 * page and a wait on a bad one.
 */
export async function resolveCollections(): Promise<GalleryCollection[]> {
  const fetched = await Promise.all(COLLECTIONS.map((collection) => imagesByTag(collection.tag)));

  return COLLECTIONS.map((collection, index) => {
    const images = fetched[index] ?? [];
    if (images.length === 0) return collection;

    return {
      ...collection,
      photos: images.map((image) => ({
        src: cldUrl(image.publicId, { width: 900 }),
        /**
         * Cloudinary's alt context, or a sentence naming the collection.
         *
         * Never the public_id: "IMG_4821_final_v2" read out by a screen reader
         * is worse than nothing, because it sounds like information. The
         * fallback at least says which kind of work the picture is of, which is
         * true and is what somebody choosing a salon is listening for.
         */
        alt: image.alt ?? `${collection.label} at Glow Studio`,
        caption: image.caption ?? undefined,
        // Portrait when Cloudinary says so. A full-length cut in a 4:3 cell
        // loses the length, which is the thing being shown.
        shape: image.height > image.width ? ('portrait' as const) : ('landscape' as const),
      })),
    };
  }).filter((collection) => collection.photos.length > 0);
}

/** The local fallback only — used where an async call is not available. */
export function populatedCollections(): GalleryCollection[] {
  return COLLECTIONS.filter((collection) => collection.photos.length > 0);
}
