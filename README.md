# DIGBOX

Next.js App Router application for product search, grid browsing, product detail pages, and admin tooling.

## Architecture

- UI pages live under `app/`
- API handlers live under `app/api/*`
- Shared client state is provided by `src/contexts/*`
- Server-only product metadata, Gemini, and brand-rule logic live under `server/*`
- Gemini is called only on the server
- Size-table extraction uses structured JSON output

## Routes

- `/`
- `/grid`
- `/login`
- `/mypage`
- `/product/[id]`
- `/admin`

## Setup

1. Install dependencies

```bash
npm install
```

2. Create `.env.local`

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here
SUPABASE_URL=https://your-project-ref.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key_here
SUPABASE_PRODUCTS_TABLE=products
GEMINI_API_KEY=your_gemini_api_key_here
ADMIN_PASSWORD=your_admin_password
ADMIN_SESSION_SECRET=your_admin_session_secret
```

3. Run the app

```bash
npm run dev
```

4. Production build

```bash
npm run build
npm run start
```

## Optional browser scraping

Some dynamic product pages need a real browser session for metadata extraction. `playwright` is installed as a dev dependency for that path.

## Automatic image embeddings

Product registration starts style tagging and image embedding after the product has been saved, so the registration response is never blocked by model inference. Image embeddings use the existing `Marqo/marqo-fashionSigLIP` model and retain its 768-dimension vector format.

Run the private Python worker in an environment that can keep the Torch model warm (not a Vercel function):

```bash
pip install -r requirements.txt
uvicorn scripts.image_embedding_worker:app --host 127.0.0.1 --port 8001
```

Set these server-only variables in both the Next.js app and the worker. The secret must match; the worker also needs the Supabase service-role variables already listed above.

```env
IMAGE_EMBEDDING_WORKER_URL=http://127.0.0.1:8001
IMAGE_EMBEDDING_WORKER_SECRET=a_long_random_shared_secret
```

For production, deploy the worker behind a private HTTPS URL and set the same values in the production environment. Do not use `NEXT_PUBLIC_` for either value.

## Brand rules

Brand canonicalization rules are managed in `/admin`.

Supported rule types:

- `domain`
- `url`
- `brand`
- `brand_contains`

Backfill commands:

```bash
npm run backfill:brands:dry
npm run backfill:brands:report
npm run backfill:brands
```

## Deployment env split

Use different values for production and preview deployments.

Public env:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

Server-only env:

- `GEMINI_API_KEY`
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `SUPABASE_PRODUCTS_TABLE`
- `SUPABASE_STORAGE_BUCKET`
- `ADMIN_PASSWORD`
- `ADMIN_SESSION_SECRET`
- `ADMIN_SESSION_TTL_SECONDS`

## Notes

- Frontend must not contain API keys.
- Direct product detail entry should use `/product/[id]`.
- Login, mypage, and admin pages can be set to `noindex` if search indexing is not desired.
