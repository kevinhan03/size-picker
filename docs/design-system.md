# DIGBOX 디자인 시스템

코드베이스(Tailwind 클래스 사용 빈도, styled-jsx, `app/globals.css`)에서 역추출한 현행 디자인 시스템 문서.
새 UI를 만들 때 이 문서의 토큰과 레시피를 기준으로 삼는다.

## 1. 디자인 원칙

- **다크 온리.** 라이트 모드 없음. 캔버스는 순수 블랙(`#000`), 표면은 저채도 다크 그레이.
- **이중 액센트.** 오렌지(`#f97316`)는 브랜드·CTA·활성 상태, 네온 그린(`#00FF00`)은 데이터(실측값)·상품 추가 액션. 그 외 표면은 무채색을 유지한다.
- **글래스 표면.** 떠 있는 UI(헤더 pill, 토글, 토스트)는 반투명 화이트 + `backdrop-blur` + 헤어라인 보더.
- **작고 두꺼운 타이포.** 본문은 12–14px, 대신 굵은 웨이트(bold/black)로 위계를 만든다.
- **한국어 UI, ~해요체.** 브랜드 용어는 영문 대문자(DIGBOX, CLOSET, INSIGHT).

## 2. 타이포그래피

**폰트:** Pretendard Variable (가변, weight 45–920, CDN woff2) → Pretendard → 시스템 폰트 순.
`tailwind.config.js`의 `fontFamily.sans`와 `--font-sans`로 정의. 취향 그래프 일부는 Inter를 선두로 지정.

| 용도 | 크기 | 웨이트 | 비고 |
|---|---|---|---|
| Hero 타이틀 | `--hero-title-size` 3.75rem / 2.375rem(모바일) | black | 검색 홈 |
| 페이지 헤딩 | `--grid-heading-size` 1.875rem / 1.35rem | black | |
| 카드/패널 헤드라인 | 18–20px (`text-lg`~`xl`) | 750–800 | |
| 본문 기본 | **`text-sm` (14px)** — 최다 사용 | semibold~bold | |
| 보조 텍스트 | **`text-xs` (12px)** — 2위 | semibold | `text-gray-400/500` |
| 마이크로 라벨 | 10–11px (`text-[10px]`, `text-[11px]`) | 800–850 | uppercase + `tracking(0.08em)` eyebrow 패턴 |
| 숫자 카운트 | 11px | 650–700 | `font-variant-numeric: tabular-nums` |

웨이트 사용 빈도: `font-bold`(188) > `font-black`(119) > `font-semibold`(77) > `font-medium`(21). 400은 거의 안 씀.

## 3. 컬러

### 캔버스 & 표면 (어두운 순)

| 토큰 | 값 | 용도 |
|---|---|---|
| canvas | `#000000` | `html/body` 배경 |
| surface-1 | `#0d0d10` ~ `#111114` | **기본 표면.** 헤더 pill, 툴팁, 토스트(`/95` + blur), 모달 |
| surface-2 | `#111217`, `#121214` | 사이드 패널 (취향 요약 카드) |
| surface-3 | `#151518`, `#17171a`, `#1a1a1a` | 살짝 뜬 표면, hover 배경 |
| overlay | `bg-black/70~90` | 모달 딤 |
| glass | `rgba(255,255,255,0.05~0.12)` + `backdrop-blur` | 세그먼트 컨트롤, 칩 |

### 텍스트 위계

| 위계 | Tailwind | styled-jsx hex |
|---|---|---|
| 주 텍스트 | `text-white` | `#f3f4f6`, `#e5e7eb` |
| 부 텍스트 | `text-gray-300/400` | `#a5acb8`, `#9ca3af` |
| 3차/자리표시 | `text-gray-500` (최다) | `#6b7280`, `#697283` |
| 비활성 | `text-gray-600` | `#4b5563` |
| 오렌지 위 텍스트 | **`text-black`** | 오렌지 버튼 위는 항상 검정 |

### 브랜드 & 시맨틱

| 역할 | 값 |
|---|---|
| Primary (CTA) | `orange-500` `#f97316`, hover `orange-400` `#fb923c` |
| Primary 텍스트 틴트 | `text-orange-300/400`, 라벨 액센트 `#f2a56c` |
| Primary 활성 배경 | `bg-orange-500/10~15` + `text-orange-300` |
| Primary 보더 | `border-orange-500/20~70` (강도별) |
| Secondary (네온 그린) | `#00FF00` — 상품 추가 버튼, 사이즈 테이블 실측값 강조. `border-[#00FF00]/40` + 그린 그라디언트 배경 + `shadow rgba(0,255,0,0.15)` 글로우 조합 |
| 에러/삭제 | `red-300/400` 텍스트, `bg-red-500/10`, `border-red-500/30` |
| 성공 | `green-400`, Spotify 계열 `#1ed760` |
| 정보/빈 상태 | `sky-300/400` (`#7dd3fc`, `#38bdf8`) — 아이콘 배지 |
| 경고 | `amber-300` |

### 보더

기본 헤어라인: **`border-white/10`** (121회, 압도적). 강조 시 `/15`, `/20`.
styled-jsx에서는 `rgba(255,255,255,0.08)`. 레거시로 `border-gray-700/800`도 잔존.

### 데이터 시각화 (취향 그래프 태그 10색)

`src/utils/tasteGraph.ts`의 `TAG_COLORS` — 다크 모드·색각이상(CVD) 검증 완료(전체쌍 ΔE 8.5). 각 태그는 `base`/`bright` 쌍.
casual `#3987e5` · minimal `#199e70` · street `#c98500` · classic `#008300` · vintage `#8f3fe0` · lovely_romantic `#e66767` · sporty `#c94f9e` · workwear_gorpcore `#d95926` · chic_modern `#2a9fb0` · glam_sexy `#e0629c` · 기본값 `#f59e0b`

## 4. 라디우스

| 토큰 | 값 | 용도 |
|---|---|---|
| `rounded-md` | 6px | 툴팁, 아주 작은 요소 |
| `rounded-lg` | 8px | 소형 버튼, 인라인 액션 |
| `rounded-xl` | 12px | **기본값.** 버튼, 아이콘 버튼, 인풋 (129회 최다) |
| `rounded-2xl` | 16px | 카드, 토스트, 컴팩트 헤더 pill, 아이콘 배지 |
| `rounded-3xl`~`[28px]` | 24–28px | 모달, 대형 카드 |
| `rounded-full` | pill | 게이지 바, 배지, 아바타 |

## 5. 그림자 & 깊이

- **`--ui-depth-shadow`**: `0 2px 1px rgba(255,255,255,0.1), 0 -2px 1px rgba(255,255,255,0.3)` — `button/select/textarea` 전역 기본. 흰 하이라이트로 양각 느낌을 주는 시그니처 효과.
- **부양 그림자** (블랙 앰비언트, 높이별):
  - 툴팁/소형: `0 8px 24px rgba(0,0,0,0.5)`
  - 컴팩트 헤더: `0 8px 32px rgba(0,0,0,0.5)`
  - 토스트: `0 18px 48px rgba(0,0,0,0.55)`
  - 모달: `0 24px 64px rgba(0,0,0,0.68)`
- **오렌지 글로우**: `0 8px 20px rgba(249,115,22,0.12~0.22)` — 강조 CTA에만.
- **인셋 하이라이트**: `inset 0 1px 0 rgba(255,255,255,0.08~0.16)` — 글래스 표면 상단 모서리.

## 6. 글래스 레시피

**적용 규칙: 글래스는 콘텐츠/캔버스 위에 떠 있는 컨트롤에만 쓴다.** 불투명한 패널·카드 안에 놓이는 세그먼트 컨트롤은 플랫 컨테이너(`bg-white/5` + `border-white/10`, blur 없음)를 쓴다 (Closet 뷰 토글, 취향 패널 토글이 기준).

떠 있는 컨트롤(플로팅 세그먼트 토글 등)의 표준 조합:

```css
background: rgba(255, 255, 255, 0.08);
border: 1px solid rgba(255, 255, 255, 0.16);
border-radius: 12px;
box-shadow: 0 10px 26px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.16), inset 0 -1px 0 rgba(0,0,0,0.16);
backdrop-filter: blur(18px) saturate(135%);
/* 활성 세그먼트: background rgba(255,255,255,0.82), color #171719 */
```

blur 스케일: `backdrop-blur-sm`(칩) → `blur`/`blur-xl`(패널) → `blur-2xl`(토스트·모달).

## 7. 모션

- 기본: `transition` (기본값) + `duration-200`, 강조 전환 `duration-300 ease-out`.
- 마이크로 인터랙션(토글·hover): 140–150ms ease.
- 시그니처 이징: `cubic-bezier(0.2, 0.8, 0.2, 1)` 380ms — 셔플 스핀, 그리드 페이드팝.
- 토스트 등장: `translate-y-3 opacity-0` → `translate-y-0 opacity-100` (200ms ease-out).
- 툴팁: hover 시 `delay-300` 후 `scale-95→100 + opacity` (150ms).
- 헤더: 스크롤 시 전체폭 → 플로팅 pill 로 `transition-all duration-300 ease-out`.

## 8. 레이아웃

- **브레이크포인트: 1024px(lg)가 모바일/데스크톱 경계.** 640px(sm)은 보조.
- 페이지 여백: CSS 변수 (`globals.css`)
  - 데스크톱: `--app-main-pt: 8rem`, `--app-main-px: 1rem`
  - 모바일: `--app-main-pt: 5.5rem + safe-area`, `--app-main-px: 1.5rem`, 하단 내비 `4rem` + safe-area
- 헤더: 기본 `h-16` 투명 → 스크롤 시 `h-12` 플로팅 pill (`rounded-2xl border-white/10 bg-[#111114]`). 모바일은 블랙 고정바.
- 상품 그리드: 모바일 2열 `gap 0.75rem` → 데스크톱 4열 `gap 1.25rem`.
- 풀스크린 캔버스 페이지(취향 그래프): `position: fixed; inset: 4rem 0 0` + 좌측 380px 스크롤 패널 / 우측 캔버스.

## 9. 컴포넌트 레시피

### Primary CTA
```
rounded-xl bg-orange-500 px-4 text-sm font-black text-black transition hover:bg-orange-400
```
높이 `h-10`, 아이콘 동반 시 `gap-2`. **오렌지 위 텍스트는 반드시 검정.**

### 소형 액션 버튼 (토스트 내부 등)
```
rounded-lg bg-orange-500 px-3 py-1.5 text-xs font-bold text-black hover:bg-orange-400
```

### 고스트/아이콘 버튼
```
rounded-lg text-gray-400/500 transition hover:bg-white/10 hover:text-white
```

### 내비 활성 상태
```
bg-orange-500/15 text-orange-300  (비활성: text-gray-400 hover:bg-white/[0.06])
```

### 세그먼트 컨트롤 활성 상태 규칙
- **흰색 채움**(`bg-white`~`/82` + 검정 텍스트): "무슨 데이터를 보는가" — 스코프/컬렉션 전환 (Outfits 탭, 취향 소스 토글, 카테고리 칩)
- **오렌지 틴트**(`bg-orange-500/15` + `text-orange-300`): "어떻게 보는가" — 뷰·도구 상태 (헤더 내비, Closet 그리드/리스트, 취향 뷰 토글)

### 아이콘 배지 (빈 상태 등)
```
rounded-2xl border border-{color}-400/20 bg-{color}-400/10 text-{color}-300
```
크기 `h-14 w-14`, 아이콘 `h-7 w-7`.

### 토스트
```
rounded-2xl border border-orange-500/25 bg-[#111114]/95 px-4 py-3 text-sm
shadow-[0_18px_48px_rgba(0,0,0,0.55)] backdrop-blur-2xl
```
하단 중앙 고정, `max-w-sm`, 좌측 아이콘 배지(`rounded-xl bg-orange-500/15 text-orange-400`).

### 툴팁
```
rounded-md bg-[#111114] px-2.5 py-1 text-xs font-semibold text-white
shadow-[0_8px_24px_rgba(0,0,0,0.5)]  + 상단 화살표(border trick), hover delay-300
```

### 인풋 (다크)
배경 surface-2, `border-white/10`, `rounded-xl`, placeholder `text-gray-500`, 포커스 시 오렌지 보더/링.

### 게이지 바 (퍼센트)
트랙 `rgba(255,255,255,0.1)` + `rounded-full` h-8px, 필은 태그 컬러 `base`.

## 10. 보이스 & 카피

- ~해요체: "옷장에 추가했어요", "로그인이 필요해요".
- 제목+보조설명 2줄 구조: 굵은 제목(white) + `text-xs text-gray-400` 설명.
- eyebrow 라벨: 11px, 800, uppercase, `letter-spacing: 0.08em`, `text-gray-400` 계열.
- 인사이트 섹션 라벨은 영문 uppercase (REPEATED DETAILS 등) + 오렌지 틴트(`#f2a56c`).
- 한국어 조사(을/를, 이/가)는 `tasteGraph.ts`의 `josa()` 헬퍼처럼 받침 여부로 동적 선택.
