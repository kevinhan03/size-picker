import { Check, CircleHelp, Save, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import {
  COMMON_FACT_FIELD_KEYS,
  fieldsForCategory,
  isCoreTasteCategory,
  STYLE_AXIS_FIELDS,
  STYLE_TAG_NAMES,
} from "../../constants/styleAnalysis.js";
import type {
  Product,
  ProductStyleReviewInput,
  ProductTargetGender,
  StyleAxes,
  StyleTags,
} from "../../types";

const TAGS = STYLE_TAG_NAMES as Array<keyof StyleTags>;
const tagLabels: Record<keyof StyleTags, string> = {
  casual: "캐주얼",
  minimal: "미니멀",
  street: "스트리트",
  classic: "클래식",
  vintage: "빈티지",
  lovely_romantic: "러블리·로맨틱",
  sporty: "스포티",
  workwear_gorpcore: "워크웨어·고프코어",
  chic_modern: "시크·모던",
  glam_sexy: "글램·섹시",
};
const genderLabels: Record<ProductTargetGender, string> = {
  menswear: "남성복",
  womenswear: "여성복",
  unisex: "유니섹스",
  unknown: "판단 보류",
};
const categoryLabels: Record<string, string> = {
  Top: "상의",
  Bottom: "하의",
  Outer: "아우터",
  DressSkirt: "원피스·스커트",
  Shoes: "신발",
};
const asRecord = (value: unknown): Record<string, unknown> =>
  value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
const valuesOf = (value: unknown) =>
  Array.isArray(value)
    ? value.map(String).filter(Boolean)
    : value
      ? [String(value)]
      : [];
const tagsOf = (value: unknown): StyleTags =>
  Object.fromEntries(
    TAGS.map((tag) => [
      tag,
      Math.max(0, Math.min(1, Number(asRecord(value)[tag]) || 0)),
    ])
  ) as StyleTags;
const axesOf = (ai: unknown, human?: unknown): StyleAxes =>
  Object.fromEntries(
    STYLE_AXIS_FIELDS.map((field) => {
      const score = Number(
        asRecord(human)[field.key] ?? asRecord(ai)[field.key]
      );
      return [
        field.key,
        Number.isInteger(score) && score >= 1 && score <= 7 ? score : 4,
      ];
    })
  ) as StyleAxes;
const mergedFacts = (ai: unknown, human: unknown, allowed: string[]) => {
  const result = { ...asRecord(ai) };
  Object.entries(asRecord(human)).forEach(([key, value]) => {
    if (
      value !== null &&
      value !== undefined &&
      (!Array.isArray(value) || value.length)
    )
      result[key] = value;
  });
  return Object.fromEntries(
    Object.entries(result).filter(([key]) => allowed.includes(key))
  );
};

function AxisPicker({
  field,
  value,
  aiValue,
  onChange,
}: {
  field: (typeof STYLE_AXIS_FIELDS)[number];
  value: number;
  aiValue: unknown;
  onChange: (value: number) => void;
}) {
  const options = field.options as Array<{ value: string; label: string }>;
  const selected = options.find(
    (option) => Number(option.value) === value
  )?.label;
  const aiLabel = options.find(
    (option) => Number(option.value) === Number(aiValue)
  )?.label;
  const move = (direction: number, target: HTMLButtonElement) => {
    const next = Math.max(1, Math.min(7, value + direction));
    onChange(next);
    const buttons =
      target.parentElement?.querySelectorAll<HTMLButtonElement>(
        '[role="radio"]'
      );
    buttons?.[next - 1]?.focus();
  };
  const anchors = field.anchors as Record<number, string> | undefined;
  return (
    <fieldset className="rounded-xl border border-gray-800 bg-black/20 p-4">
      <legend className="sr-only">{field.label}</legend>
      <div className="flex items-center gap-1.5 text-sm font-semibold text-gray-200">
        <span>{field.label}</span>
        <details className="group relative">
          <summary
            aria-label={`${field.label} 평가 기준 도움말`}
            className="flex cursor-pointer list-none rounded-full text-gray-500 hover:text-orange-300 focus:outline-none focus:ring-2 focus:ring-orange-400"
          >
            <CircleHelp className="h-4 w-4" />
          </summary>
          <div
            role="tooltip"
            className="absolute left-0 z-30 mt-2 w-72 rounded-lg border border-gray-700 bg-gray-950 p-3 text-xs font-normal leading-5 text-gray-300 shadow-xl"
          >
            <p className="font-semibold text-white">{field.label}</p>
            <p className="mt-1 text-gray-400">{field.description}</p>
            <dl className="mt-2 space-y-1">
              <div>
                <dt className="inline font-semibold text-orange-300">1:</dt>{" "}
                <dd className="inline">{anchors?.[1]}</dd>
              </div>
              <div>
                <dt className="inline font-semibold text-orange-300">4:</dt>{" "}
                <dd className="inline">{anchors?.[4]}</dd>
              </div>
              <div>
                <dt className="inline font-semibold text-orange-300">7:</dt>{" "}
                <dd className="inline">{anchors?.[7]}</dd>
              </div>
            </dl>
            <p className="mt-2 border-t border-gray-800 pt-2 text-gray-400">
              주의: {field.caution}
            </p>
          </div>
        </details>
      </div>
      <p className="mt-1 text-xs leading-5 text-gray-500">
        {field.description}
      </p>
      <div className="mt-3 grid grid-cols-[minmax(44px,1fr)_auto_minmax(44px,1fr)] items-center gap-2 sm:grid-cols-[minmax(72px,1fr)_auto_minmax(72px,1fr)] sm:gap-3">
        <span className="text-left text-[11px] leading-4 text-gray-400 sm:text-xs">
          {field.startLabel}
        </span>
        <div
          role="radiogroup"
          aria-label={field.label}
          className="flex items-center justify-center gap-0.5 sm:gap-1"
        >
          {options.map((option) => {
            const numeric = Number(option.value);
            const active = numeric === value;
            return (
              <button
                key={option.value}
                type="button"
                role="radio"
                aria-checked={active}
                tabIndex={active ? 0 : -1}
                aria-label={`${field.label} ${numeric}점: ${option.label}`}
                onClick={() => onChange(numeric)}
                onKeyDown={(event) => {
                  if (event.key === "ArrowLeft" || event.key === "ArrowDown") {
                    event.preventDefault();
                    move(-1, event.currentTarget);
                  }
                  if (event.key === "ArrowRight" || event.key === "ArrowUp") {
                    event.preventDefault();
                    move(1, event.currentTarget);
                  }
                }}
                className="flex h-10 w-7 items-center justify-center rounded-full focus:outline-none focus:ring-2 focus:ring-orange-400 focus:ring-offset-2 focus:ring-offset-black sm:h-11 sm:w-8"
              >
                <span
                  className={`h-5 w-5 rounded-full border-2 transition sm:h-6 sm:w-6 ${active ? "border-orange-400 bg-orange-400 shadow-[0_0_0_4px_rgba(251,146,60,0.18)]" : "border-sky-400 bg-transparent hover:border-orange-300"}`}
                />
              </button>
            );
          })}
        </div>
        <span className="text-right text-[11px] leading-4 text-gray-400 sm:text-xs">
          {field.endLabel}
        </span>
      </div>
      <div className="mt-3 flex flex-wrap justify-between gap-x-3 gap-y-1 text-xs">
        <span className="font-medium text-orange-300">
          선택: {value}점 · {selected}
        </span>
        <span className="text-gray-500">AI 제안: {aiLabel ?? "분석 대기"}</span>
      </div>
    </fieldset>
  );
}

interface Props {
  isSaving: boolean;
  onSave: (id: string, review: ProductStyleReviewInput) => void;
  product: Product;
}

export function ProductStyleReviewPanel({ isSaving, onSave, product }: Props) {
  const category = product.category === "Uncategorized" ? "" : product.category;
  const fields = useMemo(() => fieldsForCategory(category), [category]);
  const detailed = isCoreTasteCategory(category);
  const common = useMemo(
    () => fields.filter((field) => COMMON_FACT_FIELD_KEYS.includes(field.key)),
    [fields]
  );
  const specific = useMemo(
    () => fields.filter((field) => !COMMON_FACT_FIELD_KEYS.includes(field.key)),
    [fields]
  );
  const initialFacts = useMemo(
    () =>
      mergedFacts(
        product.styleAttributes,
        product.humanStyleAttributes,
        fields.map((field) => field.key)
      ),
    [product.styleAttributes, product.humanStyleAttributes, fields]
  );
  const initialTags = useMemo(
    () => tagsOf(product.humanStyleTags ?? product.styleTags),
    [product.humanStyleTags, product.styleTags]
  );
  const initialAxes = useMemo(
    () => axesOf(product.styleAxes, product.humanStyleAxes),
    [product.styleAxes, product.humanStyleAxes]
  );
  const [facts, setFacts] = useState(initialFacts);
  const [tags, setTags] = useState(initialTags);
  const [axes, setAxes] = useState(initialAxes);
  const [gender, setGender] = useState<ProductTargetGender>(
    product.humanTargetGender ?? product.targetGender ?? "unknown"
  );
  const [note, setNote] = useState(product.tagReviewNote ?? "");
  const [openKey, setOpenKey] = useState<string | null>(null);
  useEffect(() => {
    setFacts(initialFacts);
  }, [initialFacts]);
  useEffect(() => {
    setTags(initialTags);
  }, [initialTags]);
  useEffect(() => {
    setAxes(initialAxes);
  }, [initialAxes]);
  useEffect(() => {
    setGender(product.humanTargetGender ?? product.targetGender ?? "unknown");
    setNote(product.tagReviewNote ?? "");
  }, [product.humanTargetGender, product.targetGender, product.tagReviewNote]);
  const save = (approval?: "facts" | "axes") =>
    onSave(product.id, {
      tagReviewStatus: "edited",
      humanStyleTags: tags,
      humanStyleAttributes: detailed ? facts : {},
      humanStyleAxes: detailed ? axes : null,
      humanStyleTagsEvidence:
        product.humanStyleTagsEvidence ?? product.styleTagsEvidence ?? null,
      tagReviewNote: note,
      targetGender: gender,
      approveFacts: approval === "facts",
      approveStyleAxes: approval === "axes",
    });
  const renderFact = (field: (typeof fields)[number]) => {
    const selected = valuesOf(facts[field.key]);
    const ai = valuesOf(asRecord(product.styleAttributes)[field.key]);
    const id = `${field.key}-${field.categories.join("-")}`;
    const label = (value: string) =>
      field.options.find(
        (option: { value: string; label: string }) => option.value === value
      )?.label ?? value;
    const set = (value: string | string[] | null) =>
      setFacts((current) => ({ ...current, [field.key]: value }));
    return (
      <div key={id} className="min-w-0 text-xs text-gray-400">
        <span className="mb-1 block">{field.label}</span>
        {field.multiple ? (
          <details
            className="relative"
            open={openKey === id}
            onToggle={(event) =>
              setOpenKey(event.currentTarget.open ? id : null)
            }
          >
            <summary className="flex h-9 cursor-pointer list-none items-center justify-between rounded-md border border-gray-700 bg-gray-950 px-2 text-sm text-white">
              <span className="truncate">
                {selected.map(label).join(", ") || "선택 안 함"}
              </span>
              <span>⌄</span>
            </summary>
            <div className="absolute z-20 mt-1 max-h-56 w-full overflow-y-auto rounded-md border border-gray-700 bg-gray-950 p-1.5 shadow-xl">
              {field.options.map((option: { value: string; label: string }) => (
                <label
                  key={option.value}
                  className="flex cursor-pointer items-center gap-2 rounded px-2 py-1.5 text-sm text-gray-200 hover:bg-gray-800"
                >
                  <input
                    type="checkbox"
                    checked={selected.includes(option.value)}
                    disabled={
                      !selected.includes(option.value) &&
                      selected.length >= field.max
                    }
                    onChange={(event) =>
                      set(
                        event.target.checked
                          ? [...selected, option.value]
                          : selected.filter((item) => item !== option.value)
                      )
                    }
                    className="accent-orange-500"
                  />
                  {option.label}
                </label>
              ))}
            </div>
          </details>
        ) : (
          <select
            value={selected[0] ?? ""}
            onChange={(event) => set(event.target.value || null)}
            className="h-9 w-full rounded-md border border-gray-700 bg-gray-950 px-2 text-sm text-white"
          >
            <option value="">선택 안 함</option>
            {field.options.map((option: { value: string; label: string }) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        )}
        <p className="mt-1 text-[11px] text-gray-500">
          AI 제안: {ai.map(label).join(", ") || "선택 안 함"}
        </p>
      </div>
    );
  };
  const status = product.tagReviewStatus ?? "none";
  const canSave = Boolean(product.styleTags);
  return (
    <div className="mt-4 rounded-xl border border-gray-800 bg-black/30 p-3">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <p className="text-xs font-bold tracking-wide text-gray-300">
              AI 분석 검수
            </p>
            {status === "rejected" ? (
              <span className="rounded-md border border-red-800 px-2 py-0.5 text-xs text-red-300">
                반려
              </span>
            ) : null}
          </div>
          <p className="mt-1 text-xs text-gray-500">
            수정 사항은 저장하고, 사실값과 스타일 축은 각각 승인하세요.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => save()}
            disabled={isSaving || !canSave}
            className="inline-flex items-center gap-1 rounded-lg bg-gray-700 px-3 py-2 text-xs font-semibold text-white disabled:bg-gray-800"
          >
            <Save className="h-3.5 w-3.5" />
            저장
          </button>
          <button
            type="button"
            onClick={() =>
              onSave(product.id, {
                tagReviewStatus: "rejected",
                tagReviewNote: note,
              })
            }
            disabled={isSaving}
            className="inline-flex items-center gap-1 rounded-lg px-3 py-2 text-xs font-semibold text-red-300"
          >
            <X className="h-3.5 w-3.5" />
            반려
          </button>
        </div>
      </div>
      <section className="mt-4 border-y border-gray-800 py-3">
        <div className="flex items-center justify-between gap-2">
          <div>
            <p className="text-xs font-semibold text-gray-300">
              상품 타깃 성별
            </p>
            <p className="mt-1 text-xs text-gray-500">
              AI 추정: {genderLabels[product.targetGender ?? "unknown"]}
            </p>
          </div>
          <select
            value={gender}
            onChange={(event) =>
              setGender(event.target.value as ProductTargetGender)
            }
            className="h-9 rounded-lg border border-gray-700 bg-gray-950 px-2 text-sm text-white"
          >
            {(Object.keys(genderLabels) as ProductTargetGender[]).map(
              (value) => (
                <option key={value} value={value}>
                  {genderLabels[value]}
                </option>
              )
            )}
          </select>
        </div>
      </section>
      {detailed ? (
        <section className="mt-4 border-b border-gray-800 pb-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold text-gray-200">
                  상품 사실값 검수
                </p>
                <p className="mt-1 text-xs text-gray-500">
                  공통값과 {categoryLabels[category]}별 값을 구분해 검수합니다.
                </p>
              </div>
              <button
                type="button"
                onClick={() => save("facts")}
                disabled={isSaving || !canSave}
                className="shrink-0 inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-white disabled:bg-gray-800"
              >
                <Check className="h-3.5 w-3.5" />
                {product.factsReviewedAt ? "사실값 재승인" : "사실값 승인"}
              </button>
            </div>
            <div className="mt-3 space-y-4">
              <div className="rounded-lg border border-gray-800 bg-black/20 p-3">
                <p className="mb-3 text-xs font-semibold text-gray-300">
                  공통 사실값
                </p>
                <div className="grid gap-3 sm:grid-cols-2">
                  {common.map(renderFact)}
                </div>
              </div>
              <div className="rounded-lg border border-gray-800 bg-black/20 p-3">
                <p className="mb-3 text-xs font-semibold text-gray-300">
                  {categoryLabels[category]} 사실값
                </p>
                <div className="grid gap-3 sm:grid-cols-2">
                  {specific.map(renderFact)}
                </div>
              </div>
            </div>
        </section>
      ) : (
        <section className="mt-4 border-b border-gray-800 pb-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-semibold text-gray-200">
                상품 사실값 검수
              </p>
              <p className="mt-1 text-xs text-gray-500">
                타깃 성별과 AI 태그를 확인한 뒤 승인하세요.
              </p>
            </div>
            <button
              type="button"
              onClick={() => save("facts")}
              disabled={isSaving || !canSave}
              className="shrink-0 inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-white disabled:bg-gray-800"
            >
              <Check className="h-3.5 w-3.5" />
              {product.factsReviewedAt ? "사실값 재승인" : "사실값 승인"}
            </button>
          </div>
        </section>
      )}
      <section className="mt-4 border-b border-gray-800 pb-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold text-gray-200">
              스타일 축 검수
            </p>
            <p className="mt-1 text-xs text-gray-500">
              양끝 의미를 보고 상품의 전체 인상에 가까운 원을 고르세요.
            </p>
          </div>
          <button
            type="button"
            onClick={() => save("axes")}
            disabled={isSaving || !canSave}
            className="shrink-0 inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-white disabled:bg-gray-800"
          >
            <Check className="h-3.5 w-3.5" />
            {product.styleAxesReviewedAt
              ? "스타일 축 재승인"
              : "스타일 축 승인"}
          </button>
        </div>
        {product.styleAxisReviewRequired ? (
          <p className="mt-2 rounded-md border border-amber-800/70 bg-amber-950/30 px-2 py-1.5 text-xs text-amber-200">
            새 축 기준으로 관리자 값 확인이 필요합니다. 기존 값은 보존되어
            있습니다.
          </p>
        ) : null}
        <div className="mt-3 space-y-3">
          {STYLE_AXIS_FIELDS.map((field) => (
            <AxisPicker
              key={field.key}
              field={field}
              value={axes[field.key as keyof StyleAxes]}
              aiValue={asRecord(product.styleAxes)[field.key]}
              onChange={(value) =>
                setAxes((current) => ({ ...current, [field.key]: value }))
              }
            />
          ))}
        </div>
      </section>
      {canSave ? (
        <div className="mt-4 grid gap-2 md:grid-cols-2">
          {TAGS.map((tag) => (
            <div
              key={tag}
              className="grid grid-cols-[112px_1fr_54px] items-center gap-2 text-xs"
            >
              <span className="font-medium text-gray-300">
                {tagLabels[tag]}
              </span>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={tags[tag]}
                onChange={(event) =>
                  setTags((current) => ({
                    ...current,
                    [tag]: Number(event.target.value),
                  }))
                }
                className="h-2 w-full accent-orange-500"
              />
              <span className="text-right text-gray-400">
                {tags[tag].toFixed(2)}
              </span>
            </div>
          ))}
        </div>
      ) : (
        <p className="mt-4 text-xs text-gray-500">
          AI 분석값이 없어 저장할 수 없습니다.
        </p>
      )}
      <textarea
        value={note}
        onChange={(event) => setNote(event.target.value)}
        placeholder="수정 이유"
        rows={2}
        className="mt-3 w-full resize-none rounded-lg border border-gray-700 bg-gray-950 px-3 py-2 text-sm text-white placeholder-gray-500"
      />
    </div>
  );
}
