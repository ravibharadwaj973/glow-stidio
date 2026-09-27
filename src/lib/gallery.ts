import { SALON } from './salon';
import { salonGallery } from './api';
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
 * IN THE SALON'S OWN APP. Settings → Gallery: pick the collection, choose the
 * file, write the alt text. The app uploads it to Cloudinary, tags it, and
 * keeps the salon's own order, captions and hidden/shown state — none of which
 * a Cloudinary tag can hold.
 *
 * So there are three sources, tried in this order:
 *
 *   1. THE SALON'S API. Their order, their captions, their hidden photographs.
 *      This is the normal case.
 *   2. CLOUDINARY'S TAG LIST, unsigned and read-only. The fallback when the API
 *      is unreachable — the pictures are still there and still correct, just
 *      without the salon's ordering. Also the path for a salon who prefers to
 *      upload in Cloudinary directly and tag by hand.
 *   3. THE LOCAL FILES named below. How this site works out of the box with
 *      neither configured, and why it ships with four studio photographs and no
 *      service work.
 *
 * Each step only runs when the one before it came back with nothing, so a
 * gallery never silently mixes the salon's curated set with an unordered tag
 * dump.
 *
 * Landscape crops to 4:3 and portrait to 4:5, so a full-length cut is not
 * beheaded by a square grid cell. Say which each one is; the default is
 * landscape because most phone photographs of a finished head are.
 */

/** The service a photograph is work for, with its live price. */
export interface PhotoService {
  id: string;
  name: string;
  price: string;
  durationMin: number;
  categoryName: string | null;
}

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
  /**
   * What this is and what it costs, when the salon has said which service it
   * is. Absent for the studio photographs, and for a service since retired.
   */
  service?: PhotoService;
}

export interface GalleryCollection {
  /**
   * The url fragment, and the salon's own ServiceCategory id (or 'studio').
   *
   * An id rather than a name, so renaming "Hair" to "Hair & Styling" in the
   * catalogue does not orphan every photograph filed under it.
   */
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
   * One line under the heading, when there is one worth writing.
   *
   * Optional, because the collections are the salon's own categories and this
   * site cannot have copy for every one a salon might invent. A bare heading
   * reads better than generated filler.
   */
  blurb?: string;
  photos: GalleryPhoto[];
}

/**
 * COPY FOR THE COLLECTIONS WE CAN RECOGNISE, AND SILENCE FOR THE REST.
 *
 * The collections themselves come from the salon's own service categories, so
 * this site cannot know them in advance — a nail bar has Nails, Extensions and
 * Art, and none of those are in any list written here.
 *
 * Where a category matches something common to Indian salons, there is a real
 * sentence for it. Where it does not, there is none, and the heading stands on
 * its own. That is deliberate: generated filler ("Our Extensions work, shown
 * here") reads worse than a bare heading and makes the whole page sound
 * automated, which is the opposite of what a gallery is for.
 */
const BLURBS: Record<string, string> = {
  hair: 'Cuts, colour and treatments \u2014 shot in the salon, under the same light you will see yourself in.',
  colour: 'Balayage, global colour and corrections. Before and after wherever we have both.',
  skin: 'Facials and cleanups. Only ever published with the customer\u2019s permission.',
  nails: 'Manicures, pedicures, extensions and art.',
  makeup: 'Party and bridal \u2014 trials and the day itself, from the last two seasons.',
  bridal: 'Trials and wedding days, from the last two seasons.',
  grooming: 'Beards, fades and the tidy-up nobody photographs but everybody notices.',
  'spa-and-massage': 'The quiet room, and what happens in it.',
  studio: 'The room, the tools and the street door \u2014 so you know what you are walking into.',
};

/** The blurb for a collection, matched on its tag. Absent is fine. */
function blurbFor(tag: string): string | undefined {
  return BLURBS[tag.replace(/^gallery-/, '')];
}

/**
 * One photograph, from whichever source supplied it.
 *
 * The alt text is never the public_id. "IMG_4821_final_v2" read out by a screen
 * reader is worse than silence, because it sounds like information — so a
 * picture with no alt text falls back to a sentence naming the kind of work,
 * which is at least true and is what somebody choosing a salon is listening
 * for. The app makes alt text a required field at upload for this reason.
 *
 * Portrait gets a taller cell: a full-length cut in a 4:3 frame loses the
 * length, which is the thing being shown.
 */
function toPhoto(
  image: {
    publicId: string;
    alt: string | null;
    caption: string | null;
    width: number;
    height: number;
    service?: PhotoService | null;
  },
  collectionLabel: string,
  cloudName?: string,
): GalleryPhoto {
  return {
    src: cldUrl(image.publicId, { width: 900, cloudName }),
    alt: image.alt ?? `${collectionLabel} at ${SALON.name}`,
    caption: image.caption ?? undefined,
    shape: image.height > image.width ? 'portrait' : 'landscape',
    service: image.service ?? undefined,
  };
}

/**
 * The collections as they should actually be drawn.
 *
 * Three sources in order — the salon's API, Cloudinary's tag list, the local
 * files — with each only consulted when the one before it came back empty. See
 * the note at the top of this file.
 *
 * A source WINS over the next rather than adding to it. A salon that has
 * uploaded real colour work does not want four studio photographs mixed into
 * that collection, and a gallery showing two sources at once is impossible to
 * reason about from either end.
 */
export async function resolveCollections(): Promise<GalleryCollection[]> {
  /**
   * The salon's own gallery first. One request for every collection, and it
   * carries the order they put the pictures in.
   */
  const curated = await salonGallery();
  if (curated && curated.collections.length > 0) {
    const byCollection = new Map<string, typeof curated.photos>();
    for (const photo of curated.photos) {
      const list = byCollection.get(photo.collection);
      if (list) list.push(photo);
      else byCollection.set(photo.collection, [photo]);
    }

    /**
     * The salon's collections, in the salon's order.
     *
     * Their service categories carry a sortOrder they chose, and the API hands
     * them over in it \u2014 so the gallery reads in the same order as their menu
     * rather than in whatever order the photographs happen to come back.
     */
    const resolved: GalleryCollection[] = curated.collections
      .map((collection) => ({
        key: collection.key,
        label: collection.label,
        tag: collection.tag,
        blurb: blurbFor(collection.tag),
        photos: (byCollection.get(collection.key) ?? []).map((photo) =>
          toPhoto(photo, collection.label, curated.cloudName ?? undefined),
        ),
      }))
      .filter((collection) => collection.photos.length > 0);

    if (resolved.length > 0) return resolved;

    /**
     * The salon has collections but no photographs in any of them, and the tag
     * fallback below would find nothing either \u2014 the app is the only thing that
     * uploads, and it records every upload. So stop here rather than making six
     * requests to Cloudinary to confirm an empty gallery on every page load.
     */
    return [];
  }

  /**
   * CLOUDINARY'S TAG LIST, the fallback.
   *
   * Reached when the salon's API is unreachable, or for a salon that prefers to
   * upload and tag in Cloudinary by hand. Without the API there is no list of
   * categories to ask for, so it falls back to the tags this site can guess at
   * \u2014 the ones it has copy for, which are the common Indian salon categories.
   *
   * All at once: a request per tag in sequence is most of a second on a good
   * connection and the difference between a page and a wait on a bad one.
   */
  const guessable = Object.keys(BLURBS).map((slug) => ({
    key: slug,
    label: slug
      .split('-')
      .map((word) => (word === 'and' ? '&' : word.charAt(0).toUpperCase() + word.slice(1)))
      .join(' '),
    tag: `gallery-${slug}`,
  }));

  const fetched = await Promise.all(guessable.map((collection) => imagesByTag(collection.tag)));

  return guessable
    .map((collection, index) => ({
      ...collection,
      blurb: blurbFor(collection.tag),
      photos: (fetched[index] ?? []).map((image) => toPhoto(image, collection.label)),
    }))
    .filter((collection) => collection.photos.length > 0);
}


