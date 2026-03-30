# CLAUDE.md

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
| `/converter` | `app/converter/page.tsx` | Size converter |
| `/login` | `app/login/page.tsx` | Login |
| `/mypage` | `app/mypage/page.tsx` | My page |
| `/admin` | `app/admin/page.tsx` | Admin panel |
| `/product/[id]` | `app/product/[id]/page.tsx` | SSR product detail (revalidate=3600) |
| `/(.)product/[id]` | `app/@modal/(.)product/[id]/page.tsx` | Intercepted product modal |

## API Routes (`app/api/`)

All routes return `{ ok: boolean, error?: string, data?: T }`.

| Method | Route | Auth | Purpose |
|--------|-------|------|---------|
| GET | `/api/products` | None | List all products |
| POST | `/api/products` | None | Create product |
| GET/PATCH | `/api/products/[id]` | None | Get or update product |
| POST | `/api/admin/login` | None | Admin login |
| POST | `/api/admin/logout` | Cookie | Admin logout |
| GET | `/api/admin/session` | Cookie | Check admin session |
| PATCH | `/api/admin/products/[id]` | Cookie | Admin product update |
| DELETE | `/api/admin/products/[id]` | Cookie | Admin product delete |
| GET/PUT | `/api/admin/brand-rules` | Cookie | Fetch / save brand rules |
| POST | `/api/admin/brand-rules/backfill` | Cookie | Apply rules to all products |
| POST | `/api/product-metadata` | None | Extract metadata from URL |
| POST | `/api/product-metadata-from-image` | None | Extract metadata from screenshot |
| POST | `/api/size-table` | Bearer | Extract size table from image |
| POST | `/api/remove-bg` | Bearer | Remove background (Gemini) |
| POST | `/api/auth/delete-account` | Bearer | Delete user account |
| POST | `/api/auth/cleanup-unregistered` | None | Remove unregistered OAuth users |

## Frontend Structure (`src/`)

```
src/
├── api/
│   ├── index.ts        # Product, metadata, size-table, remove-bg, auth API calls
│   ├── admin.ts        # Admin brand rules API calls
│   └── shared.ts       # parseApiJson, postJson helpers
├── components/
│   ├── pages/          # Page-level client components (SearchPageClient, GridPageClient, etc.)
│   ├── add-product/    # AddProductFormFields, ProductImageSection, SizeTableSection
│   ├── admin/          # AdminLoginPanel, AdminProductEditor, AdminProductsList, BrandRulesPanel
│   ├── modals/         # DuplicateProductModal
│   ├── views/          # SearchView, MyPageView
│   ├── AppShell.tsx    # Header + global modals wrapper
│   └── ClientProviders.tsx  # Context providers + AppShell
├── contexts/
│   ├── AuthContext.tsx
│   ├── ProductsContext.tsx
│   └── ProductFormContext.tsx
├── hooks/
│   ├── product-form/   # useProductFormState, useProductFormAutofill, useProductFormSubmit
│   ├── admin/          # useAdminSession, useBrandRules, useAdminProductEditor
│   ├── useAdminAuth.ts
│   ├── useAuth.ts
│   ├── useProductForm.ts
│   ├── useProducts.ts
│   ├── useProductSearch.ts
│   ├── useGridState.ts
│   └── useSizeConverterState.ts
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
│   └── url.js              # Re-exports from services/product-metadata/url.js
├── auth/admin-session.js   # HMAC-SHA256 session tokens, HttpOnly cookies
├── config/
│   ├── env.js              # All environment variable definitions
│   └── brand-rules.csv     # Fallback brand rules
├── lib/supabase.js         # Server Supabase client (service role key)
└── middleware/requireAdminAuth.js
```

## Data Flow

- **Product list:** `app/layout.tsx` fetches via `server/utils/products-list.ts` at SSR time → passed as `initialProducts` to `ClientProviders` → `ProductsContext`. Client-side fetch only runs on retry.
- **Product detail page:** SSR via `server/utils/product-detail.ts` with ISR (revalidate=3600).
- **Product detail modal:** Intercepted route under `app/@modal/(.)product/[id]`.
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
  sizeTable: { headers: string[]; rows: string[][] } | null;
  createdAt?: string;
}
```

Supabase `products` table uses snake_case (`size_table`, `created_at`, `image_path`, `slug`). Frontend uses camelCase.

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
