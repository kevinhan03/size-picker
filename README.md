# Size Picker (Next.js)

## Why this structure

- Frontend never stores Gemini API key.
- Frontend never stores database API keys.
- Frontend calls only `/api/*`.
- Express server holds `GEMINI_API_KEY` and Supabase service key in server `.env`.
- Size-table extraction uses Gemini structured output (JSON Schema).

## Windows path recommendation

To avoid crashes in toolchains under Korean/non-ASCII paths, keep the project in an English path:

- Recommended: `C:\dev\size-picker`
- Avoid: Desktop or user paths with Korean folder names

## Setup

1. Install dependencies
```bash
npm install
```

2. Create server `.env`
```env
GEMINI_API_KEY=your_gemini_api_key_here
PORT=8787
SUPABASE_URL=https://your-project-ref.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key_here
SUPABASE_PRODUCTS_TABLE=products
```

3. Add public Supabase env for the browser
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here
```

Legacy `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are still read as a fallback, but new setups should use `NEXT_PUBLIC_*`.

4. Run the app
```bash
npm run dev
```

## Brand rules

Manage brand canonicalization rules in the admin page.

- Open `/admin`
- Add or edit rules in the `브랜드 표준화 규칙` section
- Save the rules to apply them immediately

Supported rule types:

- `domain`: match by site hostname such as `afterpray.com`
- `url`: match when the product URL contains the given text
- `brand`: exact match against extracted brand text
- `brand_contains`: partial match against extracted brand text

Backfill existing Supabase rows:

```bash
npm run backfill:brands:dry
npm run backfill:brands:report
npm run backfill:brands
```

`npm run backfill:brands:report` writes only the pending changes to `tmp/brand-backfill-report.csv`.

## Vercel env split (Production / Preview)

Use separate values for each Vercel environment:

- Production: real service keys/database
- Preview: staging/test keys/database

Template files in this repo:

- `.env.production.example`
- `.env.preview.example`

In Vercel, register the same variable names with different values per environment.
Do not upload `.env` files directly to Vercel.

### Public env (client-exposed)

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### Private env (server-only)

- `GEMINI_API_KEY`
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `ADMIN_PASSWORD`
- `ADMIN_SESSION_SECRET`
- `SUPABASE_PRODUCTS_TABLE` (optional)
- `SUPABASE_STORAGE_BUCKET` (optional)
- `ADMIN_SESSION_TTL_SECONDS` (optional)

## Dev scripts

- `npm run dev:web`: Vite HTTPS dev server (via `scripts/dev-proxy.ps1`)
- `npm run dev:server`: Express API server (`server/index.js`)
- `npm run dev:server:only`: server only
- `npm run dev`: run web + server together with `concurrently`

## Health check

Check if backend is running:

- `http://localhost:8787/health`
- Expected response:
```json
{
  "ok": true,
  "port": 8787,
  "ts": "2026-02-14T00:00:00.000Z"
}
```

## API endpoints

- `GET /api/products`
  - Output: `{ "ok": true, "data": { "products": [] } }`
- `POST /api/products`
  - Input: `{ "brand": "...", "name": "...", "category": "...", "url": "...", "image": "...", "sizeTable": { "headers": [], "rows": [[]] } }`
  - Output: `{ "ok": true, "data": { "product": { ... } } }`
- `POST /api/size-table`
  - Input: `{ "imageBase64": "...", "mimeType": "image/png" }`
  - Output: `{ "ok": true, "data": { "headers": [], "rows": [[]] } }`
- `POST /api/remove-bg`
  - Input: `{ "imageBase64": "...", "mimeType": "image/png" }`
  - Output: `{ "ok": true, "data": { "imageBase64": "..." } }`
  - On failure: returns `ok: false` and original image in `data.imageBase64`

## Supabase table

Create a `products` table with at least these columns:

- `id` (text or uuid primary key)
- `brand` (text, required)
- `name` (text, required)
- `category` (text)
- `url` (text)
- `image` (text)
- `size_table` (jsonb) or `sizeTable` (text/jsonb)
- `created_at` (timestamptz) or `createdAt` (text/timestamptz)

## HTTPS (frontend)

This project already enables HTTPS in Vite using `@vitejs/plugin-basic-ssl`.

Optional mkcert method:

1. Generate `localhost.pem`, `localhost-key.pem`
2. Load them in `vite.config.ts` via `server.https`
3. Cert files are git-ignored:
   - `localhost.pem`
   - `localhost-key.pem`
