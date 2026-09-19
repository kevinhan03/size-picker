# Product card thumbnails

Original uploads remain untouched. Card derivatives are stored in the existing
product-assets bucket under `card-thumbnails/v1/<product-id>/<source-path-hash>.webp`.
The configured storage bucket is used when it differs from the default.

- Product registration, admin registration and admin image replacement schedule
  preparation using Next.js `after`, without blocking the registration response.
- Catalog responses contain `cardThumbnailImage`, a public storage URL. The grid
  loads that file directly. If it is missing, the grid tries the recovery API and
  then falls back to the original image without cropping.
- Background failures are logged. This is not a durable queue; the recovery API
  and rerunnable backfill provide retries. No database schema changes are needed.
- Replacing an original with a new storage path produces a new thumbnail key.
  Do not overwrite originals in place: the key is based on their path, not bytes.
- Change `CARD_THUMBNAIL_VERSION` in `server/utils/card-thumbnail-path.js` when
  changing the image treatment, then run the backfill again.

With the app running locally:

```sh
node scripts/backfill-card-thumbnails.mjs --dry-run
node scripts/backfill-card-thumbnails.mjs
```

Use `--base-url http://localhost:3001` for another app port. The script scans all
catalog pages, processes two images at a time, preserves existing derivatives,
reports failed IDs and exits nonzero if any fail. It uses the running app's
server-side credentials and does not expose them to the browser or script output.
