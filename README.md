# DIGDA

Next.js App Router application for product search, grid browsing, size conversion, product detail pages, and admin tooling.

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
- `/converter`
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
