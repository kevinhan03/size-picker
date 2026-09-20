"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Check, ChevronRight, LoaderCircle } from "lucide-react";
import { authenticatedFetch } from "../../api/shared";
import { useAuthContext } from "../../contexts/AuthContext";
import { getProductPageUrl } from "../../utils/product";
import { ProgressiveImage } from "../ProgressiveImage";
import type { AgentProduct } from "../../types/fashion-agent";

type Option = {
  label: "A" | "B";
  products: AgentProduct[];
  explanation: string;
};
type Run = {
  id: string;
  questionId: string;
  question: string;
  optionA: Option;
  optionB: Option;
  completedAt: string | null;
};
type Progress = {
  total: number;
  completed: number;
  next: { id: string; question: string } | null;
  summary: null | {
    count: number;
    cluster: {
      taste: number;
      explanation: number;
      condition: number;
      preferred: number;
    };
    production: {
      taste: number;
      explanation: number;
      condition: number;
      preferred: number;
    };
  };
};
async function request<T>(url: string, init?: RequestInit) {
  const response = await authenticatedFetch(url, init);
  const payload = await response.json();
  if (!response.ok || !payload.ok)
    throw new Error(payload.error || "evaluation_unavailable");
  return payload.data as T;
}
const scoreNames = [
  "취향에 맞는 정도",
  "설명의 납득도",
  "질문 조건 충족",
] as const;
const Score = ({
  value,
  onChange,
  label,
}: {
  value: number;
  onChange: (score: number) => void;
  label: string;
}) => (
  <div className="flex items-center justify-between gap-2">
    <span className="text-xs text-gray-400">{label}</span>
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((score) => (
        <button
          key={score}
          type="button"
          onClick={() => onChange(score)}
          aria-label={`${label} ${score}점`}
          className={`grid h-7 w-7 place-items-center rounded-md text-xs ${value >= score ? "bg-orange-400 text-black" : "bg-white/[0.06] text-gray-500 hover:bg-white/10"}`}
        >
          {score}
        </button>
      ))}
    </div>
  </div>
);
function Results({ option }: { option: Option }) {
  return (
    <section className="rounded-2xl border border-white/10 bg-white/[0.025] p-4">
      <p className="text-xs font-bold tracking-[0.2em] text-orange-300">
        OPTION {option.label}
      </p>
      <p className="mt-2 min-h-10 text-xs leading-5 text-gray-400">
        {option.explanation}
      </p>
      <div className="mt-4 grid grid-cols-2 gap-2">
        {option.products.map((product, index) => (
          <Link
            key={product.id}
            href={getProductPageUrl(product)}
            target="_blank"
            className="overflow-hidden rounded-xl border border-white/10 bg-black/10 hover:border-orange-400/50"
          >
            <div className="relative aspect-[4/5]">
              <ProgressiveImage
                src={product.image}
                alt={product.name}
                className="object-contain"
              />
              <span className="absolute left-1.5 top-1.5 rounded bg-black/70 px-1.5 py-0.5 text-[10px]">
                {index + 1}
              </span>
            </div>
            <div className="p-2">
              <p className="truncate text-[11px] text-gray-400">
                {product.brand}
              </p>
              <p className="line-clamp-2 text-xs font-medium">{product.name}</p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
export function TasteClusterEvaluationClient() {
  const { authUser, isAuthLoading } = useAuthContext();
  const [progress, setProgress] = useState<Progress | null>(null),
    [run, setRun] = useState<Run | null>(null),
    [pending, setPending] = useState(false),
    [error, setError] = useState<string | null>(null);
  const [preferred, setPreferred] = useState<"a" | "b" | "tie" | null>(null);
  const [scores, setScores] = useState({
    tasteA: 0,
    tasteB: 0,
    explanationA: 0,
    explanationB: 0,
    conditionA: 0,
    conditionB: 0,
  });
  const [note, setNote] = useState("");
  const refresh = () =>
    request<Progress>("/api/fashion-agent/taste-clusters/evaluation")
      .then(setProgress)
      .catch((e) => setError(e.message));
  useEffect(() => {
    if (authUser) void refresh();
  }, [authUser]);
  const start = async () => {
    if (!progress?.next) return;
    setPending(true);
    setError(null);
    try {
      const data = await request<{
        status: string;
        run?: Run;
        reason?: string;
        count?: number;
      }>("/api/fashion-agent/taste-clusters/evaluation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ questionId: progress.next.id }),
      });
      if (data.status === "not_eligible") {
        const message =
          data.reason === "weak_separation"
            ? `유효한 저장 상품 ${data.count || 0}개를 분석했지만, 현재는 두 개의 뚜렷한 취향 갈래가 확인되지 않았어요. 비슷한 취향으로 일관된 컬렉션이라면 정상적인 결과예요. 서로 다른 무드의 저장 상품이 각 3개 이상 쌓인 뒤 다시 평가해 주세요.`
            : `유효한 스타일 분석 상품이 ${data.count || 0}개예요. 두 취향 갈래를 안정적으로 비교하려면 최소 8개가 필요해요.`;
        setError(message);
      } else setRun(data.run || null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "evaluation_unavailable");
    } finally {
      setPending(false);
    }
  };
  const submit = async () => {
    if (!run || !preferred || Object.values(scores).some((score) => !score))
      return;
    setPending(true);
    setError(null);
    try {
      await request("/api/fashion-agent/taste-clusters/evaluation", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          runId: run.id,
          preferredOption: preferred,
          tasteScoreA: scores.tasteA,
          tasteScoreB: scores.tasteB,
          explanationScoreA: scores.explanationA,
          explanationScoreB: scores.explanationB,
          conditionScoreA: scores.conditionA,
          conditionScoreB: scores.conditionB,
          note,
        }),
      });
      setRun(null);
      setPreferred(null);
      setScores({
        tasteA: 0,
        tasteB: 0,
        explanationA: 0,
        explanationB: 0,
        conditionA: 0,
        conditionB: 0,
      });
      setNote("");
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "evaluation_unavailable");
    } finally {
      setPending(false);
    }
  };
  if (isAuthLoading)
    return (
      <main className="mx-auto max-w-3xl p-8 pt-[var(--app-main-pt)] text-gray-400">
        평가를 준비하고 있어요…
      </main>
    );
  if (!authUser)
    return (
      <main className="mx-auto max-w-3xl p-8 pt-[var(--app-main-pt)] text-gray-300">
        로그인 후 추천 평가를 진행할 수 있어요.
      </main>
    );
  return (
    <main className="mx-auto min-h-dvh max-w-5xl px-4 pb-[var(--app-main-pb)] pt-[var(--app-main-pt)] text-white sm:px-6">
      <Link
        href="/fashion-agent"
        className="text-sm text-gray-400 hover:text-white"
      >
        ← 에이전트로 돌아가기
      </Link>
      <header className="mt-8 max-w-2xl">
        <p className="text-xs font-bold tracking-[0.2em] text-orange-400">
          DIGBOX LAB
        </p>
        <h1 className="mt-2 text-3xl font-bold">취향 추천 비교 평가</h1>
        <p className="mt-3 text-sm leading-6 text-gray-400">
          같은 질문과 후보군에서 나온 두 결과를 비교해 주세요. A/B가 어떤
          방식인지 평가 중에는 공개하지 않습니다.
        </p>
      </header>
      {progress && (
        <p className="mt-6 text-sm text-orange-200">
          진행률 {progress.completed} / {progress.total}
        </p>
      )}
      {progress?.summary && (
        <section className="mt-4 overflow-hidden rounded-2xl border border-white/10 text-sm">
          <div className="grid grid-cols-4 bg-white/[0.04] px-4 py-2 text-xs text-gray-400">
            <span>누적 {progress.summary.count}개</span>
            <span>취향 적합성</span>
            <span>설명 납득도</span>
            <span>선호율</span>
          </div>
          <div className="grid grid-cols-4 px-4 py-3">
            <span>평균 취향</span>
            <span>{progress.summary.production.taste}</span>
            <span>{progress.summary.production.explanation}</span>
            <span>{progress.summary.production.preferred}%</span>
          </div>
          <div className="grid grid-cols-4 border-t border-white/10 px-4 py-3 text-orange-200">
            <span>클러스터</span>
            <span>{progress.summary.cluster.taste}</span>
            <span>{progress.summary.cluster.explanation}</span>
            <span>{progress.summary.cluster.preferred}%</span>
          </div>
        </section>
      )}
      {error && (
        <p
          role="alert"
          className="mt-5 rounded-xl border border-orange-400/30 bg-orange-400/10 p-3 text-sm text-orange-200"
        >
          {error}
        </p>
      )}
      {!run ? (
        <section className="mt-8 rounded-2xl border border-white/10 bg-white/[0.025] p-5">
          <p className="text-sm text-gray-400">다음 질문</p>
          <p className="mt-2 text-lg font-semibold">
            {progress?.next?.question || "50개 평가를 모두 완료했습니다."}
          </p>
          {progress?.next && (
            <button
              onClick={() => void start()}
              disabled={pending}
              className="mt-6 inline-flex min-h-11 items-center gap-2 rounded-xl bg-orange-500 px-4 text-sm font-semibold text-black disabled:opacity-50"
            >
              {pending && <LoaderCircle className="h-4 w-4 animate-spin" />}두
              결과 준비하기 <ChevronRight className="h-4 w-4" />
            </button>
          )}
        </section>
      ) : (
        <>
          <section className="mt-8 rounded-2xl border border-white/10 bg-white/[0.025] p-5">
            <p className="text-xs text-gray-400">평가 질문</p>
            <h2 className="mt-2 text-xl font-semibold">{run.question}</h2>
          </section>
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <Results option={run.optionA} />
            <Results option={run.optionB} />
          </div>
          <section className="mt-5 rounded-2xl border border-white/10 bg-white/[0.025] p-5">
            <p className="font-semibold">두 결과를 평가해 주세요</p>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              {(["A", "B"] as const).map((option) => (
                <div
                  key={option}
                  className="space-y-3 rounded-xl bg-black/15 p-3"
                >
                  <p className="text-sm font-semibold">OPTION {option}</p>
                  {scoreNames.map((label, index) => {
                    const key = (
                      ["taste", "explanation", "condition"] as const
                    )[index];
                    const stateKey = `${key}${option}` as keyof typeof scores;
                    return (
                      <Score
                        key={label}
                        label={label}
                        value={scores[stateKey]}
                        onChange={(value) =>
                          setScores((old) => ({ ...old, [stateKey]: value }))
                        }
                      />
                    );
                  })}
                </div>
              ))}
            </div>
            <p className="mt-5 text-sm text-gray-300">
              어느 결과를 실제로 받고 싶나요?
            </p>
            <div className="mt-2 flex gap-2">
              {(["a", "b", "tie"] as const).map((choice) => (
                <button
                  key={choice}
                  onClick={() => setPreferred(choice)}
                  className={`min-h-10 rounded-lg border px-4 text-sm ${preferred === choice ? "border-orange-400 bg-orange-400/10 text-orange-100" : "border-white/10 text-gray-300"}`}
                >
                  {choice === "tie"
                    ? "비슷함"
                    : `OPTION ${choice.toUpperCase()}`}
                </button>
              ))}
            </div>
            <textarea
              value={note}
              onChange={(event) => setNote(event.target.value)}
              maxLength={1000}
              placeholder="선택 이유 또는 이상했던 점 (선택)"
              className="mt-4 min-h-20 w-full rounded-xl border border-white/10 bg-black/20 p-3 text-sm outline-none focus:border-orange-400"
            />
            <button
              onClick={() => void submit()}
              disabled={
                pending ||
                !preferred ||
                Object.values(scores).some((score) => !score)
              }
              className="mt-4 inline-flex min-h-11 items-center gap-2 rounded-xl bg-orange-500 px-4 text-sm font-semibold text-black disabled:opacity-40"
            >
              {pending && <LoaderCircle className="h-4 w-4 animate-spin" />}
              <Check className="h-4 w-4" /> 평가 저장하고 다음 질문으로
            </button>
          </section>
        </>
      )}
    </main>
  );
}
