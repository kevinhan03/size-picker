# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

This repository is a **Next.js App Router** full-stack app. Vite and Express are no longer part of the runtime.

## Dev Commands

```bash
npm install
npm run dev                      # Next.js dev server (http://localhost:3000)
npm run build
npm run start
npm run lint
npm run backfill:brands          # Apply brand rules to all products
npm run backfill:brands:dry      # Dry run (no writes)
npm run backfill:brands:report   # Dry run with report
npm run backfill:slugs           # Generate URL slugs
npm run backfill:slugs:dry
```

## Pages

| Path | File | Notes |
|------|------|-------|
| `/` | `app/page.tsx` | Search page |
| `/grid` | `app/grid/page.tsx` | Product grid |
| `/login` | `app/login/page.tsx` | Login / signup |
| `/mypage` | `app/mypage/page.tsx` | My page |
| `/closet` | `app/closet/page.tsx` | My closet (auth required) |
| `/admin` | `app/admin/page.tsx` | Admin panel |
| `/product/[id]` | `app/product/[id]/page.tsx` | SSR product detail (revalidate=3600) |
| `/(.)product/[id]` | `app/@modal/(.)product/[id]/page.tsx` | Intercepted product modal |
| `/u/[username]` | `app/u/[username]/page.tsx` | Public user DIGBOX (revalidate=60) |

## API Routes (`app/api/`)

All routes return `{ ok: boolean, error?: string, data?: T }`.

| Method | Route | Auth | Purpose |
|--------|-------|------|---------|
| GET | `/api/products` | None | List all products |
| POST | `/api/products` | Bearer (registered) | Create product |
| GET/PATCH | `/api/products/[id]` | None / Bearer | Get or update product |
| POST | `/api/admin/login` | None | Admin login |
| POST | `/api/admin/logout` | Cookie | Admin logout |
| GET | `/api/admin/session` | Cookie | Check admin session |
| PATCH | `/api/admin/products/[id]` | Cookie | Admin product update |
| DELETE | `/api/admin/products/[id]` | Cookie | Admin product delete |
| GET/POST | `/api/admin/instagram-products` | Cookie | Instagram product management |
| GET/PUT | `/api/admin/brand-rules` | Cookie | Fetch / save brand rules |
| POST | `/api/admin/brand-rules/backfill` | Cookie | Apply rules to all products |
| GET | `/api/admin/brands` | Cookie | List all brand names |
| POST | `/api/product-metadata` | None | Extract metadata from URL |
| POST | `/api/product-metadata-from-image` | None | Extract metadata from screenshot |
| POST | `/api/size-table` | Bearer | Extract size table from image |
| POST | `/api/remove-bg` | Bearer | Remove background (Gemini) |
| GET/POST | `/api/closet` | Bearer | List / add closet items |
| DELETE | `/api/closet/[productId]` | Bearer | Remove closet item |
| GET/POST | `/api/digbox` | Bearer | List / add digbox items |
| DELETE | `/api/digbox/[productId]` | Bearer | Remove digbox item |
| GET/POST | `/api/my-sizes` | Bearer | List / create MySizeProfile |
| PATCH/DELETE | `/api/my-sizes/[id]` | Bearer | Update / delete MySizeProfile |
| PATCH | `/api/user/bio` | Bearer | Update user bio |
| POST | `/api/auth/complete-profile` | Bearer | Set username after OAuth signup |
| POST | `/api/auth/delete-account` | Bearer | Delete user account (data cleanup first, then auth delete) |
| POST | `/api/auth/cleanup-unregistered` | None | Remove unregistered OAuth users |
| GET | `/api/site-settings` | None | Public site settings |

## Frontend Structure (`src/`)

```
src/
├── api/
│   ├── index.ts        # Product, metadata, size-table, remove-bg, auth, closet, digbox, my-sizes API calls
│   ├── admin.ts        # Admin brand rules API calls
│   └── shared.ts       # parseApiJson, postJson helpers
├── components/
│   ├── pages/          # Page-level client components (SearchPageClient, GridPageClient, ClosetPageClient, DigboxPageClient, etc.)
│   ├── add-product/    # AddProductFormFields, ProductImageSection, SizeTableSection
│   ├── admin/          # AdminLoginPanel, AdminProductEditor, AdminProductsList, BrandRulesPanel
│   ├── modals/         # DuplicateProductModal
│   ├── views/          # SearchView, MyPageView
│   ├── AppShell.tsx    # Header + global modals wrapper
│   ├── ClientProviders.tsx  # Context providers + AppShell + PostHog
│   └── PostHogProvider.tsx  # Analytics wrapper (outermost provider)
├── contexts/
│   ├── AuthContext.tsx
│   ├── ProductsContext.tsx
│   ├── ClosetContext.tsx
│   ├── DigboxContext.tsx
│   ├── MySizesContext.tsx
│   ├── SearchContext.tsx
│   └── ProductFormContext.tsx
├── hooks/
│   ├── product-form/   # useProductFormState, useProductFormAutofill, useProductFormSubmit
│   ├── admin/          # useAdminSession, useBrandRules, useAdminProductEditor
│   ├── useAdminAuth.ts
│   ├── useAuth.ts
│   ├── useCloset.ts
│   ├── useDigbox.ts
│   ├── useMySizes.ts
│   ├── useProductForm.ts
│   ├── useProducts.ts
│   ├── useProductSearch.ts
│   ├── useGridState.ts
├── lib/
│   ├── supabase.ts     # Browser Supabase client (anon key)
│   └── api-error.ts
├── types/index.ts
├── constants/index.ts
└── utils/              # image, product, sizeTable, scroll helpers
```

## Backend Structure (`server/`)

API routes import from `server/` — never imported from client code.

```
server/
├── bootstrap/
│   ├── products.js     # Re-exports product CRUD utilities
│   ├── gemini.js       # Gemini service + image download service
│   └── metadata.js     # Composes and exports createProductMetadataService
├── services/
│   ├── product-metadata.js         # Main metadata extraction orchestrator
│   ├── product-metadata/           # Sub-services: html, images, browser, stores, search, etc.
│   ├── size-table/                 # extraction, parsers, validation
│   ├── gemini.js                   # Gemini API calls
│   └── gemini-config.js            # Prompts, schemas, model candidates
├── utils/
│   ├── product-detail.ts   # fetchProduct, buildProductMetadata for SSR pages
│   ├── products-list.ts    # fetchInitialProducts for server-side initial load
│   ├── product.js          # Product normalization, slug, insert, backfill
│   ├── brand-rules.js      # Brand canonicalization (CSV + Supabase cache)
│   ├── size-table.js       # Size table utilities
│   ├── verify-auth.js      # verifyBearerToken, verifyRegisteredBearerToken
│   └── url.js              # Re-exports from services/product-metadata/url.js
├── auth/admin-session.js   # HMAC-SHA256 session tokens, HttpOnly cookies
├── config/
│   ├── env.js              # All environment variable definitions
│   └── brand-rules.csv     # Fallback brand rules
├── lib/supabase.js         # Server Supabase client (service role key)
└── middleware/requireAdminAuth.js
```

## Auth Model

Two-tier authentication:

1. **Supabase Auth** — handles identity (Google OAuth, email/password). All users who sign in exist in `auth.users`.
2. **`users` table** — registered app users with a `username`. A user who has authenticated but not completed signup (chosen username) exists in `auth.users` but not in the `users` table.

- `verifyBearerToken(token)` — validates Supabase JWT, returns auth user or null
- `verifyRegisteredBearerToken(token)` — additionally checks `users` table, returns `{ ...authUser, appUsername }` or null. Required for product creation and user-data endpoints.

Google OAuth intent (`login` vs `signup`) is stored in `sessionStorage` under `google_oauth_intent` and consumed in `useAuth` after the OAuth redirect.

## Data Flow

- **Product list:** `app/layout.tsx` fetches via `server/utils/products-list.ts` at SSR time → passed as `initialProducts` to `ClientProviders` → `ProductsContext`. Client-side fetch only runs on retry.
- **Product detail page:** SSR via `server/utils/product-detail.ts` with ISR (revalidate=3600).
- **Product detail modal:** Intercepted route under `app/@modal/(.)product/[id]`.
- **Closet / Digbox / MySizes:** Loaded client-side via their respective contexts after auth resolves.
- **Admin API:** `src/api/admin.ts` (brand rules). Other admin actions via `src/api/index.ts`.
- **Metadata extraction:** `POST /api/product-metadata` → `server/bootstrap/metadata.js` → `createProductMetadataService`.

## Architecture Rules

- Frontend must never contain API keys (`GEMINI_API_KEY`, `SUPABASE_SERVICE_ROLE_KEY`).
- Gemini must be called server-side only.
- Size-table extraction must use structured output (JSON Schema), never raw text parsing.
- `server/` must never be imported from `src/` components or hooks.
- Admin endpoints require HMAC-SHA256 session tokens via HttpOnly cookies.

## Data Model

```typescript
interface SizeTable {
  headers: string[];
  rows: string[][];
  extra?: { headers: string[]; rows: string[][] } | null; // 추가 실측 정보 (접을 수 있는 섹션으로 표시)
}

interface Product {
  id: string;
  brand: string;
  name: string;
  slug?: string;
  category: 'Outer' | 'Top' | 'Bottom' | 'Shoes' | 'Acc' | '단종된 상품(빈티지)';
  url: string;
  image: string;
  thumbnailImage?: string;
  imagePath?: string | null;
  sizeTable: SizeTable | null;
  normalizedSizeTable?: SizeTable | null;
  registeredBy?: string | null;
  isInstagram?: boolean;
  instagramOrder?: number | null;
  createdAt?: string;
  // Closet-specific (populated when fetching from closet)
  closetSelectedSizeLabel?: string | null;
  closetSelectedSizeRowIndex?: number | null;
  closetSelectedSizeSnapshot?: { headers: string[]; row: string[] } | null;
}

interface MySizeProfile {
  id: string;
  sourceProductId: string | null;
  brand: string | null;
  category: string;
  title: string;
  sizeLabel: string | null;
  measurementSnapshot: { headers: string[]; row: string[] };
  fitNote: string | null;
}
```

Supabase `products` table uses snake_case (`size_table`, `created_at`, `image_path`, `slug`). Frontend uses camelCase. `normalizeProductRow` in `server/utils/product.js` handles the conversion.

## Environment Variables

```bash
# Server-only
GEMINI_API_KEY
SUPABASE_URL
SUPABASE_SERVICE_ROLE_KEY
ADMIN_PASSWORD
ADMIN_SESSION_SECRET
SUPABASE_PRODUCTS_TABLE          # default: products
SUPABASE_STORAGE_BUCKET          # default: product-assets
ADMIN_SESSION_TTL_SECONDS        # default: 28800 (8h)

# Client-accessible
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
NEXT_PUBLIC_SITE_URL             # used for OG metadataBase
```

## Notes

- Keep the project under an English-only filesystem path on Windows.
- `next.config.ts` sets `serverExternalPackages: ["@google/genai"]` to prevent client bundling.
- Product URL slug format: `/product/[id]-[slug]` (e.g. `/product/123-nike-air-force-1`).
- `next-env.d.ts` is tracked in git but modified by Next.js automatically; ignore its diff.
