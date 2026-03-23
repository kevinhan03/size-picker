# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Dev Commands

```bash
npm run dev          # Run frontend (Vite HTTPS, port 5173) + backend (Express, port 8787) together
npm run dev:web      # Frontend only
npm run dev:server   # Backend only
npm run build        # tsc -b + Vite bundle
npm run lint         # ESLint (flat config)
```

Backend health check: `http://localhost:8787/health`

## Architecture

**Frontend:** `src/App.tsx` (monolithic ~2800 lines) — single-page app with no router. View state toggles between `'search'`, `'grid'`, and `'converter'` modes. Nearly all logic lives in this one file; `src/components/CategoryDropdown.tsx` is the only extracted component.

**Backend:** `server/index.js` (~4800 lines) — single Express file handling all routes. Deployed as a Vercel serverless function via `api/index.js`.

**Routing (Vercel):** `vercel.json` rewrites `/api/*` → `api/index.js` and all other paths → `index.html`.

**Dev proxy:** Vite proxies `/api/*` to `http://localhost:8787` (configured in `vite.config.ts`).

## Key Architectural Rules

- **API keys must never be in the frontend.** Gemini API key and Supabase service role key are server-only.
- **Gemini must be called server-side only.** Use structured output (JSON Schema) for size-table extraction — never parse raw model text.
- **Frontend uses Supabase anon key** (`VITE_SUPABASE_*`); backend uses service role key (`SUPABASE_SERVICE_ROLE_KEY`).
- Admin endpoints (`/api/admin/*`) require HMAC-SHA256 session tokens via `HttpOnly` cookies.

## Data Model

```typescript
interface Product {
  id: string;
  brand: string;
  name: string;
  category: 'Outer' | 'Top' | 'Bottom' | 'Shoes' | 'Acc' | '단종된 상품(빈티지)';
  url: string;
  image: string;
  thumbnailImage?: string;
  imagePath?: string | null;
  sizeTable: { headers: string[]; rows: string[][] } | null;
  createdAt?: string;
}
```

Supabase `products` table uses snake_case columns (`size_table`, `created_at`); the frontend/API maps to camelCase.

## Environment Variables

Server (`.env`): `GEMINI_API_KEY`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `ADMIN_PASSWORD`, `ADMIN_SESSION_SECRET`, `PORT` (default 8787), `SUPABASE_PRODUCTS_TABLE` (default `products`), `SUPABASE_STORAGE_BUCKET` (default `product-assets`), `ADMIN_SESSION_TTL_SECONDS` (default 28800)

Client (`.env`): `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`

Use `.env.production.example` / `.env.preview.example` as templates for Vercel environment splits.

## Windows Path Note

Keep the project under an English-only path (e.g., `C:\dev\sizepicker`). Korean or non-ASCII folder names in the path can crash build toolchains.
