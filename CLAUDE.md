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

### Frontend

**Entry:** `src/App.tsx` (~438 lines) — single-page app with no router. View state toggles between `'search'`, `'grid'`, `'converter'`, `'login'`, `'mypage'` modes. Admin dashboard renders at `/admin` path.

**Structure:**
```
src/
├── api/index.ts              # Fetch-based API client (product CRUD, metadata, images)
├── components/
│   ├── add-product/          # AddProductFormFields, ProductImageSection, SizeTableSection
│   ├── admin/                # AdminLoginPanel, AdminProductEditor, AdminProductsList
│   ├── modals/               # DuplicateProductModal
│   ├── views/                # MyPageView, SearchView
│   ├── AddProductModal.tsx
│   ├── AdminPage.tsx
│   ├── AppHeader.tsx
│   ├── CategoryDropdown.tsx
│   ├── GoogleSignupCompleteModal.tsx
│   ├── GridView.tsx
│   ├── LoginPage.tsx
│   ├── NeedsUsernameModal.tsx
│   ├── ProductDetailModal.tsx
│   ├── ProgressiveImage.tsx
│   └── SizeConverterView.tsx
├── constants/index.ts        # Category options, storage bucket names
├── hooks/
│   ├── product-form/helpers.ts
│   ├── useAdminAuth.ts       # Admin authentication & product CRUD
│   ├── useAuth.ts            # Google OAuth + Supabase user auth
│   ├── useGridState.ts       # Grid filtering/search state
│   ├── useProductForm.ts     # Add/edit product form state & submission
│   ├── useProducts.ts        # Product list fetching & caching
│   ├── useProductSearch.ts   # Search with suggestions
│   └── useSizeConverterState.ts
├── lib/supabase.ts           # Supabase client initialization
├── types/index.ts            # TypeScript interfaces
└── utils/
    ├── image.ts              # Image resizing, cropping, data URL conversion
    ├── product.ts            # URL normalization, category helpers
    └── sizeTable.ts          # Size table lookup, recommendations, normalization
```

**Pattern:** Container/Presentational separation — logic lives in hooks (`hooks/`), UI in components (`components/`).

### Backend

**Entry:** `server/index.js` (~71 lines) — bootstrap + route registration only. Deployed as a Vercel serverless function via `api/index.js`.

**Structure:**
```
server/
├── index.js                  # Entry: createApp → createServices → register routes → listen
├── auth/admin-session.js     # Admin session token generation/verification
├── bootstrap/                # Service factory pattern (gemini, metadata, products, services)
├── config/                   # Express app setup, env loading, rate limits
├── middleware/requireAdminAuth.js
├── routes/
│   ├── admin.js              # Product CRUD, image upload, size table extraction
│   ├── ai.js                 # Gemini API routes (size table, metadata, image analysis)
│   ├── auth.js               # Auth cleanup (unregistered Google OAuth users)
│   ├── metadata.js           # Product metadata fetching from URL
│   └── products.js           # Public product listing
├── services/
│   ├── gemini.js             # Google Gemini API wrapper
│   ├── products.js           # Supabase product queries
│   ├── product-metadata.js   # Metadata extraction orchestration
│   └── product-metadata/     # Modular extraction (browser, html, images, ranking, search, url)
│       └── size-table/extraction.js
├── utils/size-table.js
└── lib/supabase.js           # Supabase client (server-side, service role key)
```

**Key Routes:**
- `GET /api/products` — list all products
- `POST /api/products` — create product
- `/api/admin/*` — admin CRUD, image upload (requires HMAC-SHA256 session cookie)
- `/api/auth/cleanup-unregistered` — remove unregistered Google OAuth user from auth
- `/api/metadata/*` — metadata extraction from URL
- `/api/ai/*` — Gemini AI endpoints

### Routing

**Vercel:** `vercel.json` rewrites `/api/*` → `api/index.js` (serverless), all other paths → `index.html` (SPA).

**Dev proxy:** Vite proxies `/api/*` to `http://localhost:8787` (configured in `vite.config.ts`).

## Key Architectural Rules

- **API keys must never be in the frontend.** Gemini API key and Supabase service role key are server-only.
- **Gemini must be called server-side only.** Use structured output (JSON Schema) for size-table extraction — never parse raw model text.
- **Frontend uses Supabase anon key** (`VITE_SUPABASE_*`); backend uses service role key (`SUPABASE_SERVICE_ROLE_KEY`).
- **Admin endpoints** (`/api/admin/*`) require HMAC-SHA256 session tokens via `HttpOnly` cookies.
- **Authentication:** Google OAuth via Supabase Auth. `useAuth.ts` manages user session; `useAdminAuth.ts` manages admin session separately.

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

Additional tables: `users` (stores usernames for Google OAuth users).

## Environment Variables

Server (`.env`): `GEMINI_API_KEY`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `ADMIN_PASSWORD`, `ADMIN_SESSION_SECRET`, `PORT` (default 8787), `SUPABASE_PRODUCTS_TABLE` (default `products`), `SUPABASE_STORAGE_BUCKET` (default `product-assets`), `ADMIN_SESSION_TTL_SECONDS` (default 28800), `ALLOWED_ORIGINS` (comma-separated list of allowed frontend origins; used for CORS and admin CSRF validation — **required in production**)

Client (`.env`): `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`

Use `.env.production.example` / `.env.preview.example` as templates for Vercel environment splits.

## Windows Path Note

Keep the project under an English-only path (e.g., `C:\dev\sizepicker`). Korean or non-ASCII folder names in the path can crash build toolchains.
