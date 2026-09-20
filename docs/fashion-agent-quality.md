# Fashion agent quality MVP

## Implemented scope

Existing attributes cover category-specific color, material appearance, silhouette, fit, details and eight visual style axes. Human-reviewed facts already override automatic facts. Reuse this vocabulary rather than adding duplicate fields. `auditProducts` reports category-aware validity and missingness on normalized catalog products; it does not mutate data. No production completeness measurements were taken in this iteration.

Session schema adds candidateScope (catalog/collection), novelty (none/medium/high) and soft axisPreferences. Collection source remains independent. Old persisted plans receive defaults. Explicit constraints remain hard filters; missing analysis cannot satisfy them. Selecting owned items disables exploration exclusion.

Retrieval unions up to three bounded searches with identical hard filters: existing style/reference/taste target, session target, and taste target where distinct. Each channel retains the existing 200 candidate cap. This is structured + style-axis retrieval, not text semantic embedding retrieval. Similar-item search retains the existing recommendation engine. Collection selection loads collection IDs directly so catalog caps do not hide owned products.

Reranking combines existing relevance (60%) and session axis affinity (40%) when available; otherwise existing relevance is retained. Novelty bonuses are 0/0.15/0.30, with the existing 0.65 taste floor for exploration. Ties use stable product IDs. Weights are initial heuristics, not learned or calibrated probabilities. The model cannot change product order. Reasons refer to measured axis preferences.

## Evaluation

Run `npx vitest run server/services/fashion-agent` and `npm run typecheck`.

`evaluation.ts` includes 100 synthetic color/category/question variants and eight conversation review cases. Automated tests exercise downstream constraint enforcement using expected plans, not live LLM interpretation. They are not 100 independent real user questions and do not establish recommendation relevance or a model quality baseline. Conversation cases should be run against the deployed model, scoring scope, references, constraints, explanation evidence and unsupported requirements. Record model/prompt version, latency and candidate IDs with each evaluation; use a fixed catalog snapshot for before/after relevance comparisons.

## Remaining work

- Run catalog audit on a read-only production snapshot and prioritize missing fields for existing extraction/review workflows.
- Human-label real questions and top-five relevance; automate live model evaluation with a controlled API budget.
- Add text embedding retrieval after verifying embedding model/dimensions and compatible query embeddings.
- Dependent two-stage plans are implemented: first search/recommend, then compatible search anchored to the first newly returned product. Each stage contributes up to four cards; displayed order is persisted for follow-up references. Larger workflows still require clarification. Second-stage filters and collection scope are independent. No second search runs if the first returns nothing.
- Add multiple taste clusters and feedback storage/learning in the next iteration.
- Price, stock, actual warmth and verified material composition remain unsupported. Visual attributes do not establish these facts.

## Live routing checks

`FASHION_AGENT_LIVE_EVAL=1 npx vitest run server/services/fashion-agent/live-evaluation.test.ts` makes five sequential OpenAI calls using synthetic questions (wardrobe scope, catalog exploration, soft preference, dependent pairing, unsupported price). It reads local server environment files without printing secrets. Ordinary test runs skip these billable calls. These checks measure structured intent interpretation, not live personalized retrieval or human-rated recommendation quality.

# 상품 사실값 충돌 관리

상품명에 하나의 명시적 색상 표기가 있고 AI `primary_color`와 다를 때만 충돌 후보를 기록한다. `블루종`처럼 색상이 아닌 단어와 `CREAM/NAVY`처럼 여러 색상이 함께 있는 이름은 자동 판정에서 제외한다. 충돌은 검색 결과의 속성값을 자동으로 바꾸지 않는다. 관리자 상품 목록의 `사실값 충돌 확인` 큐에서 상품 이미지와 판매 페이지를 확인하고, 사실값을 수정한 뒤 승인한다. 승인된 사람 값은 검색과 추천에서 AI 값보다 우선한다.

`scripts/detect-style-attribute-conflicts.mjs`는 기본적으로 읽기 전용이다. `--apply`는 발견한 충돌만 기록하며 상품의 AI 속성이나 사람 확정값은 바꾸지 않는다.
