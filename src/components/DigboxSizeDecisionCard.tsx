import { useEffect, useMemo, useState } from "react";
import { Check, ChevronDown, Pencil, Ruler } from "lucide-react";
import type {
  DigboxSizeDecision,
  DigboxSizeDecisionInput,
  Product,
  SizeDecisionFit,
  SizeDecisionSource,
} from "../types";
import { getDisplaySizeTable } from "../utils/sizeTable";
import { useLocaleContext } from "../contexts/LocaleContext";
import type { MessageKey } from "../i18n/messages";

function getSourceOptions(
  t: (key: MessageKey) => string
): Array<{ id: SizeDecisionSource; label: string }> {
  return [
    { id: "comparison", label: t("sizeDecision.sourceComparison") },
    { id: "try_on", label: t("sizeDecision.sourceTryOn") },
    { id: "worn", label: t("sizeDecision.sourceWorn") },
  ];
}

function getFitOptions(
  t: (key: MessageKey) => string
): Array<{ id: SizeDecisionFit; label: string }> {
  return [
    { id: "tight", label: t("sizeDecision.fitTight") },
    { id: "true_to_size", label: t("sizeDecision.fitTrueToSize") },
    { id: "roomy", label: t("sizeDecision.fitRoomy") },
  ];
}

function sourceLabel(
  sources: SizeDecisionSource[],
  t: (key: MessageKey) => string
) {
  if (sources.includes("worn")) return t("sizeDecision.statusWorn");
  if (sources.includes("try_on")) return t("sizeDecision.statusTryOn");
  if (sources.includes("comparison")) return t("sizeDecision.statusComparison");
  return t("sizeDecision.statusDefault");
}

export function DigboxSizeDecisionCard({
  product,
  decision,
  suggestedRowIndex,
  onSave,
}: {
  product: Product;
  decision?: DigboxSizeDecision | null;
  suggestedRowIndex: number | null;
  onSave: (decision: DigboxSizeDecisionInput | null) => Promise<void>;
}) {
  const { t } = useLocaleContext();
  const sourceOptions = useMemo(() => getSourceOptions(t), [t]);
  const fitOptions = useMemo(() => getFitOptions(t), [t]);
  const table = useMemo(() => getDisplaySizeTable(product), [product]);
  const rows = table?.rows ?? [];
  const [isExpanded, setIsExpanded] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [rowIndex, setRowIndex] = useState<number | null>(
    decision?.rowIndex ?? suggestedRowIndex ?? null
  );
  const [manualSize, setManualSize] = useState(
    decision?.rowIndex === null ? decision?.label || "" : ""
  );
  const [sources, setSources] = useState<SizeDecisionSource[]>(
    decision?.sources ?? []
  );
  const [fit, setFit] = useState<SizeDecisionFit | null>(decision?.fit ?? null);
  const [note, setNote] = useState(decision?.note ?? "");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setIsExpanded(false);
    setIsEditing(false);
    setRowIndex(decision?.rowIndex ?? suggestedRowIndex ?? null);
    setManualSize(decision?.rowIndex === null ? decision?.label || "" : "");
    setSources(decision?.sources ?? []);
    setFit(decision?.fit ?? null);
    setNote(decision?.note ?? "");
    setError(null);
  }, [decision, product.id, suggestedRowIndex]);

  const selectedRow = rowIndex !== null ? rows[rowIndex] : null;
  const selectedLabel = String(selectedRow?.[0] ?? manualSize).trim();
  const canSave = Boolean(selectedLabel);

  const toggleSource = (source: SizeDecisionSource) => {
    setSources((current) =>
      current.includes(source)
        ? current.filter((item) => item !== source)
        : [...current, source]
    );
  };

  const handleSave = async () => {
    if (!canSave) return;
    setIsSaving(true);
    setError(null);
    try {
      await onSave({
        label: selectedLabel,
        rowIndex: selectedRow ? rowIndex : null,
        snapshot:
          selectedRow && table
            ? {
                headers: table.headers.map((header) =>
                  String(header ?? "").trim()
                ),
                row: selectedRow.map((value) => String(value ?? "").trim()),
              }
            : null,
        sources,
        fit,
        note: note.trim() || null,
      });
      setIsEditing(false);
      setIsExpanded(false);
    } catch {
      setError(t("sizeDecision.saveFailed"));
    } finally {
      setIsSaving(false);
    }
  };

  const toggleExpanded = () => {
    setIsExpanded((current) => {
      const next = !current;
      if (next && !decision?.label) setIsEditing(true);
      return next;
    });
  };

  return (
    <section className="mt-5 overflow-hidden rounded-2xl border border-orange-400/20 bg-[linear-gradient(135deg,rgba(249,115,22,0.14),rgba(255,255,255,0.035)_48%,rgba(255,255,255,0.02))] shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]">
      <button
        type="button"
        onClick={toggleExpanded}
        aria-expanded={isExpanded}
        aria-controls="purchase-size-panel"
        className="flex w-full items-start justify-between gap-4 px-4 pb-3 pt-4 text-left transition hover:bg-white/[0.025] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-orange-300/70 sm:px-5 sm:pt-5"
      >
        <div className="flex min-w-0 gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-orange-300/25 bg-orange-400/[0.12] text-orange-200">
            <Ruler className="h-4 w-4" aria-hidden="true" />
          </div>
          <div className="min-w-0">
            <h5
              id="purchase-size-title"
              className="text-sm font-bold text-white"
            >
              {t("sizeDecision.title")}
            </h5>
            <p className="mt-0.5 text-xs font-semibold leading-5 text-white/55">
              {decision?.label
                ? t("sizeDecision.descriptionWithDecision")
                : t("sizeDecision.descriptionEmpty")}
            </p>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2 pt-0.5">
          {decision?.label ? (
            <span className="rounded-lg bg-orange-400 px-2 py-1 text-xs font-black text-black">
              {decision.label}
            </span>
          ) : (
            <span className="text-xs font-bold text-orange-100/70">
              {t("sizeDecision.recordCta")}
            </span>
          )}
          <ChevronDown
            className={`h-4 w-4 text-orange-100/75 transition-transform duration-200 ${isExpanded ? "rotate-180" : ""}`}
            aria-hidden="true"
          />
        </div>
      </button>

      <div
        id="purchase-size-panel"
        className={`grid transition-[grid-template-rows] duration-200 ease-out motion-reduce:transition-none ${isExpanded ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}
      >
        <div className="min-h-0 overflow-hidden">
          {!isEditing && decision?.label ? (
            <div className="border-t border-white/[0.08] bg-black/[0.10] px-4 py-3.5 sm:px-5">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-lg bg-orange-400 px-2.5 py-1 text-sm font-black text-black">
                  {decision.label}
                </span>
                <span className="rounded-lg border border-white/[0.1] bg-white/[0.06] px-2 py-1 text-xs font-bold text-white/80">
                  {sourceLabel(decision.sources, t)}
                </span>
                {decision.fit ? (
                  <span className="text-xs font-bold text-orange-100/75">
                    {
                      fitOptions.find((option) => option.id === decision.fit)
                        ?.label
                    }
                  </span>
                ) : null}
              </div>
              {decision.note ? (
                <p className="mt-2 text-sm font-semibold leading-5 text-gray-300">
                  {decision.note}
                </p>
              ) : null}
              <button
                type="button"
                onClick={() => setIsEditing(true)}
                className="mt-3 inline-flex h-9 items-center gap-1.5 rounded-xl px-2 text-xs font-bold text-orange-100 transition hover:bg-orange-300/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-300/70"
              >
                <Pencil className="h-3.5 w-3.5" aria-hidden="true" />{" "}
                {t("common.edit")}
              </button>
            </div>
          ) : (
            <div className="border-t border-white/[0.08] bg-black/[0.10] px-4 py-4 sm:px-5">
              {rows.length ? (
                <div className="grid grid-cols-4 gap-2 sm:grid-cols-5">
                  {rows.map((row, index) => {
                    const label =
                      String(row[0] ?? "").trim() || `Size ${index + 1}`;
                    const selected = rowIndex === index;
                    return (
                      <button
                        key={`${label}-${index}`}
                        type="button"
                        aria-pressed={selected}
                        onClick={() => {
                          setRowIndex(index);
                          setManualSize("");
                        }}
                        className={`h-10 rounded-xl border text-sm font-bold transition ${selected ? "border-orange-300/70 bg-orange-400 text-black shadow-[0_4px_12px_rgba(249,115,22,0.2)]" : "border-white/[0.1] bg-white/[0.055] text-gray-200 hover:border-orange-300/40 hover:text-white"}`}
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>
              ) : (
                <input
                  value={manualSize}
                  onChange={(event) => {
                    setManualSize(event.target.value);
                    setRowIndex(null);
                  }}
                  placeholder={t("addProduct.manualSizePlaceholder")}
                  className="h-11 w-full rounded-xl border border-white/[0.12] bg-white/[0.06] px-3 text-sm font-semibold text-white outline-none placeholder:text-gray-600 focus:border-orange-300/70"
                />
              )}

              <div className="mt-4">
                <p className="mb-2 text-[11px] font-black uppercase tracking-wide text-gray-500">
                  {t("sizeDecision.howConfirmed")}
                </p>
                <div className="flex flex-wrap gap-2">
                  {sourceOptions.map((option) => (
                    <button
                      key={option.id}
                      type="button"
                      aria-pressed={sources.includes(option.id)}
                      onClick={() => toggleSource(option.id)}
                      className={`rounded-lg border px-2.5 py-2 text-xs font-bold transition ${sources.includes(option.id) ? "border-orange-300/55 bg-orange-400/[0.15] text-orange-100" : "border-white/[0.1] bg-white/[0.04] text-gray-400 hover:text-gray-200"}`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="mt-4">
                <p className="mb-2 text-[11px] font-black uppercase tracking-wide text-gray-500">
                  {t("sizeDecision.fitLabel")}
                </p>
                <div className="flex flex-wrap gap-2">
                  {fitOptions.map((option) => (
                    <button
                      key={option.id}
                      type="button"
                      aria-pressed={fit === option.id}
                      onClick={() =>
                        setFit((current) =>
                          current === option.id ? null : option.id
                        )
                      }
                      className={`rounded-lg border px-2.5 py-2 text-xs font-bold transition ${fit === option.id ? "border-white/[0.3] bg-white/[0.13] text-white" : "border-white/[0.1] bg-white/[0.04] text-gray-400 hover:text-gray-200"}`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>

              <label className="mt-4 block">
                <span className="mb-2 block text-[11px] font-black uppercase tracking-wide text-gray-500">
                  {t("sizeDecision.noteLabel")}{" "}
                  <span className="normal-case font-semibold text-gray-600">
                    {t("addProduct.optional")}
                  </span>
                </span>
                <textarea
                  value={note}
                  onChange={(event) => setNote(event.target.value)}
                  maxLength={240}
                  rows={2}
                  placeholder={t("sizeDecision.notePlaceholder")}
                  className="w-full resize-none rounded-xl border border-white/[0.1] bg-white/[0.045] px-3 py-2.5 text-sm font-semibold leading-5 text-white outline-none placeholder:text-gray-600 focus:border-orange-300/70"
                />
              </label>
              {error ? (
                <p className="mt-2 text-xs font-bold text-red-300">{error}</p>
              ) : null}
              <div className="mt-4 flex items-center justify-between gap-3">
                {decision?.label ? (
                  <button
                    type="button"
                    onClick={() => setIsEditing(false)}
                    className="h-11 px-2 text-sm font-bold text-gray-400 transition hover:text-white"
                  >
                    {t("common.cancel")}
                  </button>
                ) : (
                  <span className="text-xs font-semibold text-gray-500">
                    {t("sizeDecision.selectSizeFirst")}
                  </span>
                )}
                <button
                  type="button"
                  disabled={!canSave || isSaving}
                  onClick={() => void handleSave()}
                  className="inline-flex h-11 items-center gap-2 rounded-xl bg-orange-400 px-4 text-sm font-black text-black transition hover:bg-orange-300 disabled:cursor-not-allowed disabled:bg-gray-700 disabled:text-gray-500"
                >
                  <Check className="h-4 w-4" aria-hidden="true" />
                  {isSaving
                    ? t("addProduct.saving")
                    : selectedLabel
                      ? t("sizeDecision.recordWithLabel", {
                          label: selectedLabel,
                        })
                      : t("sizeDecision.savePreferred")}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
