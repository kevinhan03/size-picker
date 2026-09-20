# User taste clusters: shadow-mode readiness

## Decisions locked for the first implementation

- The current all-saved-products average remains the production taste score.
- User clusters are computed only for analysis and evaluation; they do not alter ranking in the first release.
- Inputs are the effective, eight-axis product analyses. Human-reviewed axes take precedence.
- Start with `k=2`; do not create a cluster model below eight valid saved products.
- A cluster must contain at least three products, neither cluster may contain more than 85% of its model's products, and the two centroids must be sufficiently distinct. Otherwise the model is rejected and the current average remains the only taste representation.
- Source is `digbox` first. Wardrobe clusters are a separate model, never mixed into saved-product clusters.

## Read-only data audit — 2026-09-19

| Measure                                                |      Result |
| ------------------------------------------------------ | ----------: |
| Catalog products                                       |         375 |
| Products with a complete effective eight-axis analysis | 340 (90.7%) |
| Users with saved products                              |           7 |
| Users eligible at 8 valid saved products               |           3 |
| Users eligible at 12 valid saved products              |           3 |

The catalog axis coverage is adequate for a shadow-mode pilot. The user sample is not large enough to judge recommendation uplift statistically; cluster evaluation must use qualitative review plus accumulated feedback before any ranking rollout.

## Recalculation policy

Saving, removing, or modifying a product marks that source model `stale`; it does not recompute inline with a user request. A daily cron processes stale models that have been unchanged for at least six hours. It recomputes at most once per source/user per day. A model remains active while a replacement is evaluated; a rejected replacement leaves the prior active model untouched. Product style-axis changes mark every affected user's relevant model stale.

This policy avoids visible shifts after every save, keeps recommendation latency independent of clustering, and makes each model version reproducible. The future cluster job needs an authenticated cron endpoint and a small pending-work query; it should not reuse the cleanup cron endpoints.

## Shadow evaluation corpus

Evaluate each question with the current average and the selected-cluster candidate list. Reviewers score the top five independently on a 1–5 scale for taste fit and explanation fit, then record whether the cluster result is preferable.

| Theme                 | Questions                                                                                                                                                                           |
| --------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Default taste         | 내 취향에 맞는 아우터 추천해줘; 평소 저장한 옷과 비슷한 셔츠 찾아줘; 내가 좋아할 만한 신발 추천해줘; 저장한 상품 기준으로 가장 나다운 바지 찾아줘; 내 취향을 한 문장으로 설명해줘   |
| More formal / refined | 평소보다 조금 더 포멀한 아우터; 단정하지만 재미없는 느낌은 아닌 셔츠; 정돈된 인상의 검정 바지; 출근에도 입기 좋은 내 취향의 신발; 깔끔한데 너무 무난하지 않은 아우터                |
| Less technical        | 너무 기능적인 느낌은 아닌 아우터; 아웃도어 장비처럼 보이지 않는 바지; 테크니컬한 분위기는 빼고 검정 상의; 나일론 느낌이 과하지 않은 아우터; 평소 취향은 유지하면서 더 일상적인 신발 |
| Exploration           | 내 취향에서 조금만 벗어난 아우터; 저장한 옷과 너무 비슷하지 않은 상의; 평소보다 조금 더 독특한 바지; 과하지 않게 새로운 무드의 신발; 익숙한 취향 안에서 색다른 아우터               |
| Multiple-taste probes | 미니멀한 날 입을 아우터; 어둡고 실험적인 무드의 상의; 정돈된 룩에 쓸 바지; 존재감 있는 신발; 차갑고 구조적인 분위기의 아우터                                                        |
| Follow-up / pairing   | 첫 번째 추천보다 덜 기능적인 상품; 두 번째 상품보다 더 정돈된 아우터; 방금 결과와 겹치지 않는 바지; 첫 추천과 어울리는 신발; 평소 취향과 다른 흐름으로 다시 추천해줘                |

## Promotion gate

Shadow models become eligible for an 80:20 ranking experiment only when all are true:

- at least 30 scored questions spanning at least five eligible users;
- cluster top-five mean taste-fit is at least 0.4 points higher than the average baseline, or positive-feedback rate is at least 10 percentage points higher;
- category and explicit-condition compliance do not decline;
- at least 80% of reviewed cluster explanations are judged supported by representative products and axes;
- no active model changes cluster count or representative products after a single ordinary save/delete event without a material style change.

## Migration state

`20260918113000_fashion_agent_feedback` was applied to the linked Supabase project on 2026-09-19. RLS is enabled. Product feedback can now be stored and used by the existing bounded feedback adjustment.
