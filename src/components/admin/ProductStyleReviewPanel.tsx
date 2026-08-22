import { Check, X } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { fieldsForCategory, isCoreTasteCategory, STYLE_TAG_NAMES } from '../../constants/styleAnalysis.js';
import type { Product, ProductStyleReviewInput, ProductTargetGender, StyleTags, TagReviewStatus } from '../../types';

const STYLE_TAGS = STYLE_TAG_NAMES as Array<keyof StyleTags>;
const tagLabels: Record<keyof StyleTags, string> = { casual: '캐주얼', minimal: '미니멀', street: '스트리트', classic: '클래식', vintage: '빈티지', lovely_romantic: '러블리·로맨틱', sporty: '스포티', workwear_gorpcore: '워크웨어·고프코어', chic_modern: '시크·모던', glam_sexy: '글램·섹시' };
const statusLabels: Record<TagReviewStatus | 'none', string> = { none: '미검수', needs_review: '검수 필요', approved: '승인', edited: '수정됨', rejected: '반려' };
const targetGenderLabels: Record<ProductTargetGender, string> = { menswear: '남성복', womenswear: '여성복', unisex: '유니섹스', unknown: '판단 보류' };
const isRecord = (value: unknown): value is Record<string, unknown> => Boolean(value) && typeof value === 'object' && !Array.isArray(value);
const selectedValues = (value: unknown) => Array.isArray(value) ? value.map(String).filter(Boolean) : value ? [String(value)] : [];
const normalizeAttributes = (value: unknown) => isRecord(value) ? value : {};
const normalizeTags = (value: unknown): StyleTags => {
  const result = Object.fromEntries(STYLE_TAGS.map((tag) => [tag, 0])) as StyleTags;
  if (!isRecord(value)) return result;
  STYLE_TAGS.forEach((tag) => { const score = Number(value[tag]); if (Number.isFinite(score)) result[tag] = Math.max(0, Math.min(1, score)); });
  return result;
};

interface ProductStyleReviewPanelProps { isSaving: boolean; onSave: (productId: string, review: ProductStyleReviewInput) => void; product: Product; }

export function ProductStyleReviewPanel({ isSaving, onSave, product }: ProductStyleReviewPanelProps) {
  const initialTags = useMemo(() => normalizeTags(product.humanStyleTags ?? product.styleTags), [product.humanStyleTags, product.styleTags]);
  const initialAttributes = useMemo(() => normalizeAttributes(product.humanStyleAttributes ?? product.styleAttributes), [product.humanStyleAttributes, product.styleAttributes]);
  const [humanTags, setHumanTags] = useState(initialTags);
  const [humanAttributes, setHumanAttributes] = useState(initialAttributes);
  const [targetGender, setTargetGender] = useState<ProductTargetGender>(product.humanTargetGender ?? product.targetGender ?? 'unknown');
  const [reviewNote, setReviewNote] = useState(product.tagReviewNote ?? '');
  const [openAttributeKey, setOpenAttributeKey] = useState<string | null>(null);
  const reviewStatus = product.tagReviewStatus ?? 'none';
  const hasAiTags = Boolean(product.styleTags);
  const category = product.category === 'Uncategorized' ? '' : product.category;
  const fields = useMemo(() => fieldsForCategory(category), [category]);
  const hasDetailedFields = isCoreTasteCategory(category);

  useEffect(() => { setHumanTags(initialTags); }, [initialTags]);
  useEffect(() => { setHumanAttributes(initialAttributes); }, [initialAttributes]);
  useEffect(() => { setTargetGender(product.humanTargetGender ?? product.targetGender ?? 'unknown'); }, [product.humanTargetGender, product.targetGender]);
  useEffect(() => { setReviewNote(product.tagReviewNote ?? ''); }, [product.tagReviewNote]);

  const setAttribute = (key: string, value: string | string[] | null) => setHumanAttributes((previous) => ({ ...previous, [key]: value }));
  const save = (status: TagReviewStatus) => onSave(product.id, { tagReviewStatus: status, humanStyleTags: humanTags, humanStyleAttributes: hasDetailedFields ? humanAttributes : {}, humanStyleTagsEvidence: product.humanStyleTagsEvidence ?? product.styleTagsEvidence ?? null, tagReviewNote: reviewNote, targetGender });

  return <div className="mt-4 rounded-xl border border-gray-800 bg-black/30 p-3">
    <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between"><div><div className="flex flex-wrap items-center gap-2"><p className="text-xs font-bold tracking-wide text-gray-300">AI 분석 검수</p><span className="rounded-md border border-gray-700 px-2 py-0.5 text-xs text-gray-300">{statusLabels[reviewStatus]}</span></div><p className="mt-1 text-xs text-gray-500">Gemini 초안을 수정한 뒤 승인 또는 저장하세요.</p></div><div className="flex shrink-0 gap-2"><button type="button" onClick={() => save(reviewStatus === 'approved' || reviewStatus === 'edited' ? 'edited' : 'approved')} disabled={isSaving || !hasAiTags} className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-white disabled:cursor-not-allowed disabled:bg-gray-800 disabled:text-gray-500"><Check className="h-3.5 w-3.5" />{reviewStatus === 'approved' || reviewStatus === 'edited' ? '저장' : '승인'}</button><button type="button" onClick={() => onSave(product.id, { tagReviewStatus: 'rejected', tagReviewNote: reviewNote })} disabled={isSaving} className="inline-flex items-center gap-1 rounded-lg px-3 py-2 text-xs font-semibold text-red-300 hover:bg-red-900/30 disabled:text-gray-500"><X className="h-3.5 w-3.5" />반려</button></div></div>
    <section className="mt-4 border-y border-gray-800 py-3"><div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between"><div><p className="text-xs font-semibold text-gray-300">상품 타깃 성별</p><p className="mt-1 text-xs text-gray-500">AI 추정: {targetGenderLabels[product.targetGender ?? 'unknown']} · 저장 또는 승인 시 반영</p></div><select value={targetGender} onChange={(event) => setTargetGender(event.target.value as ProductTargetGender)} className="h-9 min-w-28 rounded-lg border border-gray-700 bg-gray-950 px-2 text-sm text-white focus:border-orange-500 focus:outline-none" aria-label="상품 타깃 성별">{(Object.keys(targetGenderLabels) as ProductTargetGender[]).map((value) => <option key={value} value={value}>{targetGenderLabels[value]}</option>)}</select></div></section>
    {hasDetailedFields ? <section className="mt-4 border-b border-gray-800 pb-4"><p className="text-xs font-semibold text-gray-200">취향 속성 검수</p><p className="mt-1 text-xs text-gray-500">승인 또는 저장한 값은 AI 분석값보다 우선합니다.</p><div className="mt-3 grid gap-3 sm:grid-cols-2">{fields.map((field) => { const values = selectedValues(humanAttributes[field.key]); const aiValues = selectedValues(normalizeAttributes(product.styleAttributes)[field.key]); const fieldId = `${field.key}-${field.categories.join('-')}`; const labelFor = (value: string) => field.options.find((entry: { value: string; label: string }) => entry.value === value)?.label ?? value; return <div key={fieldId} className="min-w-0 text-xs text-gray-400"><span className="mb-1 block">{field.label}</span>{field.multiple ? <details className="relative" open={openAttributeKey === fieldId} onToggle={(event) => setOpenAttributeKey(event.currentTarget.open ? fieldId : null)}><summary className="flex h-9 cursor-pointer list-none items-center justify-between rounded-md border border-gray-700 bg-gray-950 px-2 text-sm text-white"><span className="truncate">{values.map(labelFor).join(', ') || '선택 안 함'}</span><span className="text-gray-500">⌄</span></summary><div className="absolute z-20 mt-1 max-h-56 w-full overflow-y-auto rounded-md border border-gray-700 bg-gray-950 p-1.5 shadow-xl">{field.options.map((entry: { value: string; label: string }) => <label key={entry.value} className="flex cursor-pointer items-center gap-2 rounded px-2 py-1.5 text-sm text-gray-200 hover:bg-gray-800"><input type="checkbox" checked={values.includes(entry.value)} disabled={!values.includes(entry.value) && values.length >= field.max} onChange={(event) => setAttribute(field.key, event.target.checked ? [...values, entry.value] : values.filter((value) => value !== entry.value))} className="h-3.5 w-3.5 accent-orange-500" />{entry.label}</label>)}</div></details> : <select value={values[0] ?? ''} onChange={(event) => setAttribute(field.key, event.target.value || null)} className="h-9 w-full rounded-md border border-gray-700 bg-gray-950 px-2 text-sm text-white focus:border-orange-500 focus:outline-none"><option value="">선택 안 함</option>{field.options.map((entry: { value: string; label: string }) => <option key={entry.value} value={entry.value}>{entry.label}</option>)}</select>}<p className="mt-1 text-[11px] leading-4 text-gray-500">AI 제안: {aiValues.map(labelFor).join(', ') || '선택 안 함'}</p></div>; })}</div></section> : <p className="mt-4 rounded-lg border border-gray-800 bg-black/20 px-3 py-2 text-xs text-gray-500">이 카테고리는 현재 스타일 태그와 타깃 성별만 분석합니다.</p>}
    {hasAiTags ? <div className="mt-4 grid gap-2 md:grid-cols-2">{STYLE_TAGS.map((tag) => <div key={tag} className="grid grid-cols-[112px_1fr_54px] items-center gap-2 text-xs"><span className="font-medium text-gray-300">{tagLabels[tag]}</span><input type="range" min="0" max="1" step="0.05" value={humanTags[tag]} onChange={(event) => setHumanTags((previous) => ({ ...previous, [tag]: Number(event.target.value) }))} className="h-2 w-full accent-orange-500" /><span className="text-right text-gray-400">{humanTags[tag].toFixed(2)}</span></div>)}</div> : <p className="mt-4 text-xs text-gray-500">AI 태그가 없어 승인할 수 없습니다.</p>}
    <textarea value={reviewNote} onChange={(event) => setReviewNote(event.target.value)} placeholder="수정 이유" rows={2} className="mt-3 w-full resize-none rounded-lg border border-gray-700 bg-gray-950 px-3 py-2 text-sm text-white placeholder-gray-500 focus:border-orange-500 focus:outline-none" />
  </div>;
}
