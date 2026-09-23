# Photographs

Drop the salon's own pictures in here, then name them in `src/lib/salon.ts`.
Nothing else needs changing — a slot with no photograph named falls back to the
gradient, so the page never shows a broken image or an empty grey box.

    public/photos/hero.jpg        the picture beside the headline   4:5
    public/photos/interior.jpg    the room, near "Come and see us"  5:4
    public/photos/priya.jpg       one per stylist                   4:5

Use the salon's real photographs. Stock images of a different salon are worse
than the gradient: a customer who walks in and finds another room has been told
something untrue before they sat down.

Around 1600px on the long edge is plenty. JPEG, and run them through any
compressor — a 4MB photograph is the slowest thing on the page by an order of
magnitude, on the phone connections most people will open this with.
