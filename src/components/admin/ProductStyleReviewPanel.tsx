import { Check, Save, X } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import type { Product, ProductStyleReviewInput, StyleTagName, StyleTags, TagReviewStatus } from '../../types';

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

interface ProductStyleReviewPanelProps {
  isSaving: boolean;
  onSave: (productId: string, review: ProductStyleReviewInput) => void;
  product: Product;
}

export function ProductStyleReviewPanel({ isSaving, onSave, product }: ProductStyleReviewPanelProps) {
  const aiTags = useMemo(() => normalizeStyleTags(product.styleTags), [product.styleTags]);
  const effectiveTags = useMemo(() => normalizeStyleTags(getEffectiveStyleTags(product)), [product]);
  const initialHumanTags = useMemo(
    () => normalizeStyleTags(product.humanStyleTags ?? product.styleTags),
    [product.humanStyleTags, product.styleTags]
  );
  const [humanTags, setHumanTags] = useState<StyleTags>(initialHumanTags);
  const [scoreInputs, setScoreInputs] = useState<Record<StyleTagName, string>>(
    styleTagsToInputValues(initialHumanTags)
  );
  const [reviewNote, setReviewNote] = useState(product.tagReviewNote ?? '');

  const hasAiTags = Boolean(product.styleTags);
  const topTasteTags = getTopTags(effectiveTags);
  const material =
    product.humanStyleAttributes?.material ??
    product.styleAttributes?.material ??
    null;
  const fit =
    product.humanStyleAttributes?.fit ??
    product.styleAttributes?.fit ??
    null;
  const reviewStatus = product.tagReviewStatus ?? 'none';

  useEffect(() => {
    setHumanTags(initialHumanTags);
    setScoreInputs(styleTagsToInputValues(initialHumanTags));
  }, [initialHumanTags]);

  useEffect(() => {
    setReviewNote(product.tagReviewNote ?? '');
  }, [product.tagReviewNote]);

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

  const saveEditedReview = () => {
    onSave(product.id, {
      tagReviewStatus: 'edited',
      humanStyleTags: humanTags,
      humanStyleAttributes: product.humanStyleAttributes ?? product.styleAttributes ?? null,
      humanStyleTagsEvidence: product.humanStyleTagsEvidence ?? product.styleTagsEvidence ?? null,
      tagReviewNote: reviewNote,
    });
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
                humanStyleAttributes: product.humanStyleAttributes ?? product.styleAttributes ?? null,
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
