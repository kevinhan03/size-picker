# DIGBOX Fashion Agent MVP

The `에이전트` tab beside Profile opens `/fashion-agent`; mobile navigation includes the same destination. Signed-in users can search, request taste-based recommendations, compare two products, explore similar/compatible items, explain collection taste, resume conversations, and save product cards.

## Setup

1. Apply `supabase/migrations/20260917134806_fashion_agent.sql` to the target database through the normal migration workflow. This migration is already applied to the connected DIGBOX project; its timestamp matches remote migration history.
2. Set server-only `OPENAI_API_KEY` and optionally `OPENAI_FASHION_AGENT_MODEL` (default `gpt-4.1-mini`). Do not use a `NEXT_PUBLIC_` key.
3. Existing server `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are required.

The agent uses OpenAI Responses with strict JSON Schema and `store:false`. It does not change Gemini-based size-table/image extraction. Reference: https://developers.openai.com/api/docs/guides/structured-outputs

## Boundaries and flow

`POST /api/fashion-agent` authenticates the registered user, checks origin and request size, acquires a database request lease, and loads server-owned context. OpenAI interprets intent and returns complete filters. Server validation rejects invalid fields, fact values, reversed ranges and unknown product references. Explicit product links or previous displayed result IDs resolve references; clients cannot submit arbitrary history or user IDs.

The fixed orchestrator composes collection/profile reads, filtered candidate search, engine ranking, comparison, and evidence rendering. General fashion education gets a separate bounded OpenAI call and is explicitly labelled. Product statements/reasons are rendered from engine data so the LLM cannot invent warmth, price or recommendation evidence. Raw embeddings and full user collections are never sent to OpenAI. Recent text is limited to six messages; intent, complete filters and the last displayed product ID order are separate state.

When a message describes an owned or saved item rather than linking it (for example, “my DIVEIN khaki cargo pants”), the plan keeps that item as a separate collection reference and keeps the requested item as the search filter. DIGBOX then resolves the reference from the appropriate collection before invoking the compatibility engine. Exact catalog names are preferred, with a narrow Korean brand-spelling tolerance; a tie asks the user to identify the item rather than guessing.

`GET /api/fashion-agent` lists the latest 30 conversations; `?conversationId=` loads an owned conversation. Conversation state and turn pairs commit atomically. UUID request keys make transport retries idempotent. A 90-second lease rejects concurrent/stale writers, and an atomic per-user limit permits at most 30 attempts/hour. Conversations stop at 40 turns. The OpenAI call times out at 25 seconds; a request uses one call, or two for general education. No streaming is required for the MVP: UI shows pending state, then validated text/cards together.

Tables and RPCs are inaccessible to `anon` and `authenticated`; the server supplies the authenticated actor to service-role queries. Proxy matching strips forged verified-user headers. User deletion cascades to conversations and request records. No raw prompts or provider responses are logged. The UI clears private state when the account changes.

## Engine and limitations

- Search supports literal name/brand terms, categories, analysis facts, axis ranges, gender and preferred/avoided style prototypes. Facts use the reviewed object only when reviewed, otherwise AI analysis.
- Search filters before limiting to 200 candidates. Candidate ordering uses distance to a requested style center or collection average when available; otherwise newest first. Style exclusions and final ranking run in application code. A bounded candidate pool is not exhaustive catalog ranking.
- Taste ranking combines the existing eight-axis representation and Dig Match recommendation scores. Scores are relative heuristics, not purchase probabilities. Exploration excludes saved items, requires taste proximity and adds a small non-duplication bonus.
- Saved/wardrobe summaries reuse existing shared taste functions and up to 500 collection products. Empty profiles are disclosed. The graph itself is not serialized into the prompt.
- Similar products reuse the existing image/style recommendation service. Compatible products use existing category-pair and style-harmony functions; this is an estimated pairing, not a full outfit generator.
- Compare returns actual axis differences and available taste scores for two identified products.
- Price, stock, exact material composition, actual warmth, current trends, full historical evolution and wardrobe-utilization comparisons are unavailable. Complete outfits require the rollout flag below. Unsupported requirements produce a limitation message rather than silently loosening constraints. Future price support needs currency, source and observation timestamp, not a fabricated card field.
- Conversations are stored in DIGBOX until the user deletes an individual conversation or their account. Automated retention cleanup is not configured.

## Conversation lifecycle and outfit rollout

Apply `supabase/migrations/20260924140000_fashion_agent_lifecycle_events.sql` before deploying these API changes. Users can delete one owned conversation from the agent page. Active 90-second leases block deletion; dependent requests, feedback, and card events cascade. A separate per-user rate event keeps deleted conversations from resetting the hourly request limit; the daily cron removes entries older than one hour. Conversations have no automatic expiration.

Card impression, click, and successful DIGBOX save events are validated against the owned, completed response and stored once per request/product/action. The admin operations page shows per-request events and overall action counts. The browser forwards only event type, request ID, product ID, and rank to PostHog after server acceptance; analytics delivery cannot block the user action. No question text or user ID is included in that event payload.

Set server-only `FASHION_AGENT_OUTFITS=true` to enable the new `outfit` and `wardrobe` intents. The default is off. Each request proposes one top/bottom/outer/shoes combination. Wardrobe requests prefer owned products and fill missing slots from catalog; catalog outfit requests use catalog products. Slot selection and explanations are server-owned. The UI marks unavailable slots explicitly. The feature does not verify price, stock, weather, or material composition.

Local verification on 2026-09-24 used an authenticated browser session against the linked database: search cards, product navigation, DIGBOX save, conversation resume, and a numbered compatible-product follow-up succeeded after a server-side ordinal fix. The outfit-enabled local server returned one four-slot wardrobe combination and one four-slot catalog combination. One catalog attempt required a user retry after `invalid_model_response`; structured model output remains a reliability limit to monitor. The new migration was verified with PGlite tests but must be applied to the linked database before live delete and card-event verification.

## Verification

`npm run typecheck`, `npm run lint`, `npm test`.
Focused tests: `npx vitest run server/services/fashion-agent`.
PGlite tests execute the migration, verify client denial, ownership, idempotent atomic commits, stale leases, per-user budgets and search filtering. Provider tests cover strict output, refusals, incomplete/malformed responses and safe errors. Live OpenAI/DB smoke testing requires the configured key and migration on the chosen environment.

Validated during implementation:

- All 120 tests, TypeScript, changed-file ESLint, and `next build` passed. Repository-wide lint has seven pre-existing warnings and no errors.
- Live OpenAI routing covered a black wide-trouser search, an unsupported cheaper-price follow-up, and an ordinal reference with a new target category.
- A live OpenAI-to-catalog search returned four matching products, with color/silhouette reasons derived from stored facts.
- Browser checks covered desktop/mobile navigation, signed-out entry, and signed-in chat/cards using intercepted test responses. A real signed-in end-to-end conversation/save action was not exercised.
- A forged verified-user header still returned HTTP 401 on the running API.
- The connected database migration is applied. Security advisor INFO notices for the two new RLS tables without client policies are intentional: browser grants are revoked and access is server-only. Existing unrelated project warnings were not changed.
- The application itself has not been deployed. Configure the OpenAI environment variables on the deployment target before publishing.
