import { Check, Plus, Save, X } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import type { Product, ProductStyleReviewInput, ProductTargetGender, StyleAttributes, StyleTagName, StyleTags, StyleTagsEvidence, TagReviewStatus } from '../../types';

const STYLE_TAGS: StyleTagName[] = [
  'casual',
  'minimal',
  'street',
  'classic',
  'vintage',
  'lovely_romantic',
  'sporty',
  'workwear_gorpcore',
  'chic_modern',
  'glam_sexy',
];

const LEGACY_STYLE_TAG_MAP: Record<string, StyleTagName> = {
  '캐주얼': 'casual',
  '미니멀': 'minimal',
  '스트릿': 'street',
  '클래식': 'classic',
  '빈티지': 'vintage',
  '레트로': 'vintage',
  '로맨틱': 'lovely_romantic',
  '스포티': 'sporty',
  '워크웨어': 'workwear_gorpcore',
};

const emptyStyleTags = (): StyleTags =>
  STYLE_TAGS.reduce((acc, tag) => {
    acc[tag] = 0;
    return acc;
  }, {} as StyleTags);

const ATTRIBUTE_FIELDS = [
  { key: 'fit', label: '핏', group: 'shape', options: [['unknown', '판단 보류'], ['slim', '슬림'], ['regular', '레귤러'], ['relaxed', '릴랙스드'], ['wide', '와이드'], ['straight', '스트레이트'], ['tapered', '테이퍼드'], ['bootcut', '부츠컷'], ['balloon', '벌룬']] },
  { key: 'silhouette', label: '실루엣', group: 'shape', options: [['unknown', '판단 보류'], ['clean', '클린'], ['structured', '구조적'], ['loose', '루즈'], ['voluminous', '볼륨감'], ['draped', '드레이프']] },
  { key: 'formality', label: '격식', group: 'shape', options: [['unknown', '판단 보류'], ['casual', '캐주얼'], ['smart-casual', '스마트 캐주얼'], ['formal', '포멀']] },
  { key: 'utility_level', label: '기능 디테일', group: 'shape', options: [['unknown', '판단 보류'], ['none', '없음'], ['light', '가벼움'], ['strong', '강함']] },
  { key: 'material', label: '소재', group: 'expression', options: [['unknown', '판단 보류'], ['cotton', '코튼'], ['denim', '데님'], ['knit', '니트'], ['wool', '울'], ['leather', '레더'], ['linen', '린넨'], ['synthetic', '합성 소재'], ['mixed', '혼방']] },
  { key: 'color', label: '색상', group: 'expression', options: [['unknown', '판단 보류'], ['black', '블랙'], ['white', '화이트'], ['gray', '그레이'], ['blue', '블루'], ['brown', '브라운'], ['beige', '베이지'], ['green', '그린'], ['red', '레드'], ['neutral', '뉴트럴'], ['vivid', '비비드']] },
  { key: 'wash_texture', label: '표면 질감', group: 'expression', options: [['unknown', '판단 보류'], ['clean', '클린'], ['washed', '워싱'], ['faded', '페이디드'], ['distressed', '디스트레스드'], ['textured', '텍스처드']] },
  { key: 'decoration_level', label: '장식성', group: 'expression', options: [['unknown', '판단 보류'], ['none', '없음'], ['light', '가벼움'], ['strong', '강함']] },
  { key: 'sportiness', label: '스포티함', group: 'expression', options: [['unknown', '판단 보류'], ['none', '없음'], ['light', '가벼움'], ['strong', '강함']] },
  { key: 'era_signal', label: '시대감', group: 'expression', options: [['unknown', '판단 보류'], ['contemporary', '컨템포러리'], ['heritage', '헤리티지'], ['90s', '90s'], ['00s', '00s']] },
] as const;

type AttributeField = typeof ATTRIBUTE_FIELDS[number];
export type StyleAttributeOption = { attributeKey: AttributeField['key']; value: string };

const isRecord = (value: unknown): value is Record<string, unknown> =>
  Boolean(value) && typeof value === 'object' && !Array.isArray(value);

const normalizeAttributeValue = (value: unknown) => String(value ?? '').trim().toLowerCase() || 'unknown';

const optionsForAttribute = (field: AttributeField, customOptions: StyleAttributeOption[]) => {
  const builtIn = field.options.map(([value, label]) => [value, label] as const);
  const knownValues = new Set<string>(builtIn.map(([value]) => value));
  const custom = customOptions
    .filter((option) => option.attributeKey === field.key && !knownValues.has(option.value))
    .map((option) => [option.value, option.value] as const);
  return [...builtIn, ...custom];
};

const normalizeAttributeForField = (field: AttributeField, value: unknown, customOptions: StyleAttributeOption[]) => {
  const normalized = normalizeAttributeValue(value);
  return optionsForAttribute(field, customOptions).some(([option]) => option === normalized) ? normalized : 'unknown';
};

const attributeLabel = (field: AttributeField, value: unknown, customOptions: StyleAttributeOption[]) =>
  optionsForAttribute(field, customOptions).find(([option]) => option === normalizeAttributeForField(field, value, customOptions))?.[1] ?? '판단 보류';

const attributeEvidence = (evidence: StyleTagsEvidence | null | undefined, key: string) => {
  const values = evidence?.attributes?.[key];
  return Array.isArray(values) ? values.map((value) => String(value).trim()).filter(Boolean).slice(0, 2) : [];
};

const editableStyleAttributes = (value: unknown): StyleAttributes => {
  const source = isRecord(value) ? value : {};
  return {
    ...source,
    ...Object.fromEntries(ATTRIBUTE_FIELDS.map((field) => [field.key, normalizeAttributeValue(source[field.key])])),
    details: Array.isArray(source.details) ? source.details : [],
  };
};

const styleTagsToInputValues = (tags: StyleTags): Record<StyleTagName, string> =>
  STYLE_TAGS.reduce((acc, tag) => {
    acc[tag] = tags[tag].toFixed(2);
    return acc;
  }, {} as Record<StyleTagName, string>);

const normalizeStyleTags = (value: unknown): StyleTags => {
  const output = emptyStyleTags();
  if (!value || typeof value !== 'object' || Array.isArray(value)) return output;
  const record = value as Record<string, unknown>;
  Object.entries(record).forEach(([key, rawScore]) => {
    const mappedTag = LEGACY_STYLE_TAG_MAP[key];
    if (!mappedTag) return;
    const score = Number(rawScore);
    if (Number.isFinite(score)) output[mappedTag] = Math.max(output[mappedTag], Math.min(1, Math.max(0, score)));
  });
  STYLE_TAGS.forEach((tag) => {
    const score = Number(record[tag]);
    if (Number.isFinite(score)) output[tag] = Math.min(1, Math.max(0, score));
  });
  return output;
};

const getTopTags = (tags: StyleTags) =>
  [...STYLE_TAGS]
    .map((tag) => ({ tag, score: tags[tag] }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);

const getEffectiveStyleTags = (product: Product): unknown => {
  if (
    (product.tagReviewStatus === 'approved' || product.tagReviewStatus === 'edited') &&
    product.humanStyleTags
  ) {
    return product.humanStyleTags;
  }
  return product.styleTags;
};

const statusLabels: Record<TagReviewStatus | 'none', string> = {
  none: '미검수',
  needs_review: '검수 필요',
  approved: '승인',
  edited: '수정됨',
  rejected: '반려',
};

const targetGenderLabels: Record<ProductTargetGender, string> = {
  menswear: '남성복',
  womenswear: '여성복',
  unisex: '유니섹스',
  unknown: '판단 보류',
};

interface ProductStyleReviewPanelProps {
  customAttributeOptions: StyleAttributeOption[];
  isSaving: boolean;
  onAddAttributeOption: (option: StyleAttributeOption) => Promise<void>;
  onSave: (productId: string, review: ProductStyleReviewInput) => void;
  product: Product;
}

export function ProductStyleReviewPanel({ customAttributeOptions, isSaving, onAddAttributeOption, onSave, product }: ProductStyleReviewPanelProps) {
  const effectiveTags = useMemo(() => normalizeStyleTags(getEffectiveStyleTags(product)), [product]);
  const initialHumanTags = useMemo(
    () => normalizeStyleTags(product.humanStyleTags ?? product.styleTags),
    [product.humanStyleTags, product.styleTags]
  );
  const initialHumanAttributes = useMemo(
    () => editableStyleAttributes(product.humanStyleAttributes ?? product.styleAttributes),
    [product.humanStyleAttributes, product.styleAttributes]
  );
  const [humanTags, setHumanTags] = useState<StyleTags>(initialHumanTags);
  const [humanAttributes, setHumanAttributes] = useState<StyleAttributes>(initialHumanAttributes);
  const [newOptionInputs, setNewOptionInputs] = useState<Record<string, string>>({});
  const [scoreInputs, setScoreInputs] = useState<Record<StyleTagName, string>>(
    styleTagsToInputValues(initialHumanTags)
  );
  const [reviewNote, setReviewNote] = useState(product.tagReviewNote ?? '');
  const [targetGender, setTargetGender] = useState<ProductTargetGender>(
    product.humanTargetGender ?? product.targetGender ?? 'unknown'
  );

  const hasAiTags = Boolean(product.styleTags);
  const aiAttributes = useMemo(() => editableStyleAttributes(product.styleAttributes), [product.styleAttributes]);
  const topTasteTags = getTopTags(effectiveTags);
  const material = humanAttributes.material;
  const fit = humanAttributes.fit;
  const reviewStatus = product.tagReviewStatus ?? 'none';

  useEffect(() => {
    setHumanTags(initialHumanTags);
    setScoreInputs(styleTagsToInputValues(initialHumanTags));
  }, [initialHumanTags]);

  useEffect(() => {
    setHumanAttributes(initialHumanAttributes);
  }, [initialHumanAttributes]);

  useEffect(() => {
    setReviewNote(product.tagReviewNote ?? '');
  }, [product.tagReviewNote]);

  useEffect(() => {
    setTargetGender(product.humanTargetGender ?? product.targetGender ?? 'unknown');
  }, [product.humanTargetGender, product.targetGender]);

  const setTagScore = (tag: StyleTagName, score: number) => {
    setHumanTags((prev) => ({
      ...prev,
      [tag]: Math.min(1, Math.max(0, score)),
    }));
  };

  const updateScoreFromRange = (tag: StyleTagName, value: string) => {
    const score = Number(value);
    if (!Number.isFinite(score)) return;
    setTagScore(tag, score);
    setScoreInputs((prev) => ({ ...prev, [tag]: score.toFixed(2) }));
  };

  const updateScoreInput = (tag: StyleTagName, value: string) => {
    if (!/^\d*(?:\.\d*)?$/.test(value)) return;
    setScoreInputs((prev) => ({ ...prev, [tag]: value }));
    const score = Number(value);
    if (value.trim() !== '' && Number.isFinite(score)) setTagScore(tag, score);
  };

  const normalizeScoreInput = (tag: StyleTagName) => {
    setScoreInputs((prev) => ({
      ...prev,
      [tag]: humanTags[tag].toFixed(2),
    }));
  };

  const setAttributeValue = (key: string, value: string) => {
    setHumanAttributes((previous) => ({ ...previous, [key]: value }));
  };

  const addAttributeOption = async (field: AttributeField) => {
    const value = String(newOptionInputs[field.key] ?? '').trim().replace(/\s+/g, ' ').toLowerCase();
    if (!value) return;
    await onAddAttributeOption({ attributeKey: field.key, value });
    setAttributeValue(field.key, value);
    setNewOptionInputs((previous) => ({ ...previous, [field.key]: '' }));
  };

  const saveEditedReview = () => {
    onSave(product.id, {
      tagReviewStatus: 'edited',
      humanStyleTags: humanTags,
      humanStyleAttributes: humanAttributes,
      humanStyleTagsEvidence: product.humanStyleTagsEvidence ?? product.styleTagsEvidence ?? null,
      tagReviewNote: reviewNote,
    });
  };

  const saveTargetGenderReview = () => {
    onSave(product.id, { targetGender });
  };

  return (
    <div className="mt-4 rounded-xl border border-gray-800 bg-black/30 p-3">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-xs font-bold uppercase tracking-wide text-gray-500">Taste Tags</p>
            <span className="rounded-md border border-gray-700 px-2 py-0.5 text-xs text-gray-300">
              {statusLabels[reviewStatus]}
            </span>
          </div>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {topTasteTags.map(({ tag, score }) => (
              <span key={tag} className="rounded-md bg-gray-800 px-2 py-1 text-xs text-gray-200">
                {tag} {score.toFixed(2)}
              </span>
            ))}
            {!hasAiTags ? <span className="text-xs text-gray-500">AI 태그 없음</span> : null}
          </div>
          <div className="mt-2 flex flex-wrap gap-2 text-xs text-gray-500">
            {material ? <span>material: {String(material)}</span> : null}
            {fit ? <span>fit: {String(fit)}</span> : null}
          </div>
        </div>
        <div className="flex shrink-0 flex-wrap gap-2">
          <button
            type="button"
            onClick={() =>
              onSave(product.id, {
                tagReviewStatus: 'approved',
                humanStyleTags: humanTags,
                humanStyleAttributes: humanAttributes,
                humanStyleTagsEvidence: product.humanStyleTagsEvidence ?? product.styleTagsEvidence ?? null,
                tagReviewNote: reviewNote,
              })
            }
            disabled={isSaving || !hasAiTags}
            className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-white disabled:cursor-not-allowed disabled:bg-gray-800 disabled:text-gray-500"
          >
            <Check className="h-3.5 w-3.5" />
            승인
          </button>
          <button
            type="button"
            onClick={saveEditedReview}
            disabled={isSaving || !hasAiTags}
            className="inline-flex items-center gap-1 rounded-lg bg-orange-600 px-3 py-2 text-xs font-semibold text-white disabled:cursor-not-allowed disabled:bg-gray-800 disabled:text-gray-500"
          >
            <Save className="h-3.5 w-3.5" />
            저장
          </button>
          <button
            type="button"
            onClick={() =>
              onSave(product.id, {
                tagReviewStatus: 'rejected',
                tagReviewNote: reviewNote,
              })
            }
            disabled={isSaving}
            className="inline-flex items-center gap-1 rounded-lg px-3 py-2 text-xs font-semibold text-red-300 hover:bg-red-900/30 disabled:cursor-not-allowed disabled:text-gray-500"
          >
            <X className="h-3.5 w-3.5" />
            반려
          </button>
        </div>
      </div>

      <div className="mt-4 flex flex-col gap-2 border-y border-gray-800 py-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <p className="text-xs font-semibold text-gray-300">상품 타깃 성별</p>
          <p className="mt-1 text-xs text-gray-500">
            AI 추정: {targetGenderLabels[product.targetGender ?? 'unknown']}
            {product.humanTargetGender ? ` · 사람 검수: ${targetGenderLabels[product.humanTargetGender]}` : ''}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={targetGender}
            onChange={(event) => setTargetGender(event.target.value as ProductTargetGender)}
            className="h-9 min-w-28 rounded-lg border border-gray-700 bg-gray-950 px-2 text-sm text-white focus:border-orange-500 focus:outline-none"
            aria-label="상품 타깃 성별"
          >
            {(Object.keys(targetGenderLabels) as ProductTargetGender[]).map((value) => (
              <option key={value} value={value}>{targetGenderLabels[value]}</option>
            ))}
          </select>
          <button
            type="button"
            onClick={saveTargetGenderReview}
            disabled={isSaving}
            className="inline-flex h-9 items-center gap-1 rounded-lg border border-orange-500/50 bg-orange-500/10 px-3 text-xs font-semibold text-orange-200 hover:bg-orange-500/20 disabled:cursor-not-allowed disabled:border-gray-800 disabled:bg-gray-900 disabled:text-gray-500"
          >
            <Save className="h-3.5 w-3.5" />
            성별 저장
          </button>
        </div>
      </div>

      <section className="mt-4 border-y border-gray-800 py-4">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-semibold text-gray-200">형태 · 표현 속성 검수</p>
            <p className="mt-1 text-xs text-gray-500">승인 또는 저장한 값은 상품 유사도와 취향 판단에서 AI 결과보다 우선합니다.</p>
          </div>
          {(reviewStatus === 'approved' || reviewStatus === 'edited') && (
            <span className="text-xs font-medium text-emerald-300">사람 검수값 사용 중</span>
          )}
        </div>

        <div className="mt-3 grid gap-4 lg:grid-cols-2">
          {(['shape', 'expression'] as const).map((group) => (
            <div key={group} className="rounded-lg border border-gray-800 bg-black/20 p-3">
              <p className="text-[11px] font-bold uppercase tracking-wide text-orange-300">
                {group === 'shape' ? '형태 유사도' : '표현 유사도'}
              </p>
              <div className="mt-2 grid gap-2 sm:grid-cols-2">
                {ATTRIBUTE_FIELDS.filter((field) => field.group === group).map((field) => {
                  const evidence = attributeEvidence(product.styleTagsEvidence, field.key);
                  return (
                    <label key={field.key} className="block min-w-0 text-xs text-gray-400">
                      <span className="mb-1 block">{field.label}</span>
                      <select
                        value={normalizeAttributeForField(field, humanAttributes[field.key], customAttributeOptions)}
                        onChange={(event) => setAttributeValue(field.key, event.target.value)}
                        className="h-9 w-full rounded-md border border-gray-700 bg-gray-950 px-2 text-sm text-white focus:border-orange-500 focus:outline-none"
                      >
                        {optionsForAttribute(field, customAttributeOptions).map(([value, label]) => (
                          <option key={value} value={value}>{label}</option>
                        ))}
                      </select>
                      <p className="mt-1 text-[11px] leading-4 text-gray-500">AI 제안: {attributeLabel(field, aiAttributes[field.key], customAttributeOptions)}</p>
                      {evidence.map((evidence) => (
                        <p key={evidence} className="mt-0.5 text-[11px] leading-4 text-gray-600">근거: {evidence}</p>
                      ))}
                      {!evidence.length ? <p className="mt-0.5 text-[11px] leading-4 text-gray-600">근거: AI 근거 없음</p> : null}
                      <div className="mt-2 flex gap-1.5">
                        <input
                          type="text"
                          value={newOptionInputs[field.key] ?? ''}
                          onChange={(event) => setNewOptionInputs((previous) => ({ ...previous, [field.key]: event.target.value }))}
                          onKeyDown={(event) => {
                            if (event.key !== 'Enter') return;
                            event.preventDefault();
                            void addAttributeOption(field);
                          }}
                          placeholder="새 선택지 추가"
                          className="h-8 min-w-0 flex-1 rounded-md border border-gray-800 bg-gray-950 px-2 text-xs text-white placeholder:text-gray-600 focus:border-orange-500 focus:outline-none"
                        />
                        <button
                          type="button"
                          onClick={() => void addAttributeOption(field)}
                          disabled={isSaving || !String(newOptionInputs[field.key] ?? '').trim()}
                          className="inline-flex h-8 shrink-0 items-center gap-1 rounded-md border border-orange-500/50 px-2 text-xs font-semibold text-orange-200 hover:bg-orange-500/10 disabled:cursor-not-allowed disabled:border-gray-800 disabled:text-gray-600"
                        >
                          <Plus className="h-3.5 w-3.5" />
                          추가
                        </button>
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </section>

      {hasAiTags ? (
        <div className="mt-4 grid gap-2 md:grid-cols-2">
          {STYLE_TAGS.map((tag) => (
            <div key={tag} className="grid grid-cols-[64px_1fr_64px] items-center gap-2 text-xs">
              <span className="font-medium text-gray-300">{tag}</span>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={humanTags[tag]}
                onChange={(event) => updateScoreFromRange(tag, event.target.value)}
                className="h-2 w-full accent-orange-500"
              />
              <input
                type="text"
                inputMode="decimal"
                value={scoreInputs[tag]}
                onChange={(event) => updateScoreInput(tag, event.target.value)}
                onBlur={() => normalizeScoreInput(tag)}
                className="h-8 w-16 rounded-md border border-gray-700 bg-gray-950 px-2 text-center text-xs text-white focus:outline-none focus:border-orange-500"
              />
            </div>
          ))}
        </div>
      ) : null}

      <textarea
        value={reviewNote}
        onChange={(event) => setReviewNote(event.target.value)}
        placeholder="수정 이유"
        rows={2}
        className="mt-3 w-full resize-none rounded-lg border border-gray-700 bg-gray-950 px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-orange-500"
      />
    </div>
  );
}
