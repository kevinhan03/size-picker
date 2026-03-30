# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Dev Commands

```bash
npm install          # Install dependencies (required after switching from Vite to Next.js)
npm run dev          # Next.js dev server (http://localhost:3000)
npm run build        # Next.js production build
npm run start        # Start production server
npm run lint         # ESLint (flat config)
npm run backfill:brands      # Apply brand rules to all products in DB
npm run backfill:brands:dry  # Dry run (no writes)
```

## Architecture

This is a **Next.js App Router** full-stack app. The backend no longer runs as a separate Express server — all API routes are Next.js Route Handlers inside `app/api/`.

### Pages

| Path | File | Notes |
|------|------|-------|
| `/` | `app/page.tsx` | Renders `src/App.tsx` (client component) |
| `/admin` | `app/admin/page.tsx` | Renders `src/App.tsx` with admin path |
| Layout | `app/layout.tsx` | Sets `<html lang="ko">`, favicon, metadata |

### Frontend (src/)

The UI is a React SPA mounted via `"use client"` Next.js pages. No router — view state is managed in `src/App.tsx`.

**Entry:** `src/App.tsx` — view state toggles between `'search'`, `'grid'`, `'converter'`, `'login'`, `'mypage'` modes.

**Structure:**
```
src/
├── api/index.ts              # Fetch-based API client (products, metadata, images, brand rules)
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
├── constants/index.ts        # Category options, size conversion tables, storage bucket names
├── hooks/
│   ├── product-form/helpers.ts
│   ├── useAdminAuth.ts       # Admin authentication & product CRUD
│   ├── useAuth.ts            # Google OAuth + Supabase user auth
│   ├── useGridState.ts       # Grid filtering/search state
│   ├── useProductForm.ts     # Add/edit product form state & submission
│   ├── useProducts.ts        # Product list fetching & caching
│   ├── useProductSearch.ts   # Search with suggestions
│   └── useSizeConverterState.ts
├── lib/supabase.ts           # Supabase client (anon key, client-side only)
├── types/index.ts            # TypeScript interfaces
└── utils/
    ├── image.ts              # Image resizing, cropping, data URL conversion
    ├── product.ts            # URL normalization, category helpers
    └── sizeTable.ts          # Size table lookup, recommendations, normalization
```

**Pattern:** Container/Presentational — logic lives in hooks (`hooks/`), UI in components (`components/`).

### API Routes (app/api/)

All routes return `{ ok: boolean, error?: string, data?: T }`.

| Method | Route | Auth | Purpose |
|--------|-------|------|---------|
| GET | `/api/products` | None | List all products |
| POST | `/api/products` | None | Create product |
| GET | `/api/admin/session` | Cookie | Check admin session |
| POST | `/api/admin/login` | None | Login with password |
| POST | `/api/admin/logout` | Cookie | Logout |
| GET | `/api/admin/brand-rules` | Cookie | Fetch brand rules |
| PUT | `/api/admin/brand-rules` | Cookie | Save brand rules |
| POST | `/api/admin/brand-rules/backfill` | Cookie | Apply rules to all products |
| PATCH | `/api/admin/products/[id]` | Cookie | Update product |
| DELETE | `/api/admin/products/[id]` | Cookie | Delete product |
| POST | `/api/product-metadata` | None | Extract metadata from URL |
| POST | `/api/product-metadata-from-image` | None | Extract metadata from screenshot |
| POST | `/api/size-table` | None | Extract size table from image (Gemini) |
| POST | `/api/remove-bg` | None | Remove background (Gemini) |
| POST | `/api/auth/delete-account` | Bearer | Delete user account |
| POST | `/api/auth/cleanup-unregistered` | None | Remove unregistered OAuth users |

### Backend Business Logic (server/)

API routes import from `server/` — this is **server-side only code**, never bundled to the client.

```
server/
├── shared.js                 # Core: Supabase client, HMAC session, brand rules, size table logic (~4000+ lines)
├── auth/admin-session.js     # Re-exports session helpers from shared.js
├── bootstrap/
│   ├── products.js           # createProductStack() — product CRUD, brand normalization
│   ├── gemini.js             # createGeminiStack() — Gemini API calls, size table extraction
│   ├── metadata.js           # createMetadataStack() — metadata extraction orchestration
│   └── services.js           # Composes all stacks
├── config/
│   ├── brand-rules.csv       # Fallback brand canonicalization rules (if Supabase storage unavailable)
│   └── env.js                # Environment variable validation
└── lib/supabase.js           # Server-side Supabase client (service role key)
```

`server/shared.js` is a monolithic module — all constants, Supabase client, HMAC auth, brand rules cache, size table normalization, and product metadata extraction live here. Bootstrap factories (`createProductStack()`, `createGeminiStack()`, etc.) wrap exports from `shared.js` for dependency injection.

## Key Architectural Rules

- **API keys must never be in the frontend.** `GEMINI_API_KEY` and `SUPABASE_SERVICE_ROLE_KEY` are server-only.
- **Gemini must be called server-side only.** Use structured output (JSON Schema) for size-table extraction — never parse raw model text.
- **Frontend uses Supabase anon key** (`NEXT_PUBLIC_SUPABASE_*`); backend uses service role key (`SUPABASE_SERVICE_ROLE_KEY`).
- **Admin endpoints** (`/api/admin/*`) require HMAC-SHA256 session tokens via `HttpOnly` cookies.
- **Authentication:** Google OAuth via Supabase Auth. `useAuth.ts` manages user session; `useAdminAuth.ts` manages admin session separately.
- **`server/` is server-only.** Never import from `server/` in `src/` components or hooks.
- **`next.config.ts`** marks `@google/genai` as `serverExternalPackages` to prevent it from being bundled client-side.

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

Supabase `products` table uses snake_case columns (`size_table`, `created_at`, `image_path`); the frontend/API maps to camelCase.

Additional tables: `users` (stores usernames for Google OAuth users).

## Environment Variables

Single `.env` file (used by Next.js for both client and server):

```
# Server-only (no NEXT_PUBLIC_ prefix — never exposed to client)
GEMINI_API_KEY
SUPABASE_URL
SUPABASE_SERVICE_ROLE_KEY
ADMIN_PASSWORD
ADMIN_SESSION_SECRET
SUPABASE_PRODUCTS_TABLE          # default: products
SUPABASE_STORAGE_BUCKET          # default: product-assets
ADMIN_SESSION_TTL_SECONDS        # default: 28800 (8h)
ALLOWED_ORIGINS                  # comma-separated CORS origins — required in production

# Client-accessible (NEXT_PUBLIC_ prefix)
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
```

Note: `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` are legacy names from the old Vite setup. Use `NEXT_PUBLIC_*` going forward.

Use `.env.production.example` / `.env.preview.example` as templates for Vercel environment splits.

## Windows Path Note

Keep the project under an English-only path (e.g., `C:\dev\sizepicker`). Korean or non-ASCII folder names in the path can crash build toolchains.
