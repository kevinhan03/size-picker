# Post photo processing

- Select one JPEG, PNG, WebP or HEIC/HEIF source up to 20 MiB.
- JPEG/PNG/WebP sources stay on the device without selection-time recompression.
- HEIC uses native decoding first, then a lazy-loaded `heic-to` worker when needed. A bounded, lossless PNG is used for editing. Raw HEIC files are not sent to the preparation API.
- Confirming a portrait crop produces at most 1500 x 2000 pixels, never enlarges the cropped source, and preserves the exact 3:4 ratio. WebP encoding falls back to JPEG when the browser returns PNG instead. Output must fit the existing 3 MiB upload limit.
- The authenticated upload endpoint validates and normalizes the display image and stores a separate thumbnail of at most 600 x 800 pixels.
- New media uses `id.display.webp` and `id.thumb.webp`. Existing media paths remain readable without a migration or backfill. Feed reads sign thumbnail paths; detail reads sign display paths. Both files use the existing private bucket and signed URL expiration.
- Immediate deletion and queued cleanup remove both variants. The display path remains the database cleanup record, including failed or abandoned uploads.
- Decode, source-size, format, compression, timeout and upload-network errors have separate user messages.

## Verification

Run the photo tests and existing social lifecycle tests with Vitest; also run lint, typecheck and a production build after changing workers or CSP.

On 2026-09-21 the local browser check passed for a generated JPEG, simulated Safari PNG fallback, no-upscale output, and the public `strukturag/libheif/examples/example.heic` fixture through HEIC conversion and portrait cropping. This is not a physical iPhone Safari test or a production upload test.

HEIC fallback requires browser support for workers, ImageBitmap and OffscreenCanvas. Unsupported or resource-constrained devices receive a conversion error with a JPG workaround. Test the user's failing original on an iPhone before claiming device-specific resolution.

## Codec attribution

The lazy-loaded HEIC decoder uses [heic-to 1.5.2](https://github.com/hoppergee/heic-to), licensed under LGPL-3.0, with libheif. Retain applicable dependency license notices when distributing bundled code.
