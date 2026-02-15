# Size Picker (Vite + Express Proxy)

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

3. Run web + server together
```bash
npm run dev
```

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
