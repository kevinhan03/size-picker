import type { AgentPlan } from "../../../src/types/fashion-agent";

/** All channels share hard filters. Merge by ID, retaining each channel's candidates. */
export async function retrieveCandidates<T extends { id: string | number }>(
  targets: Record<string, number>[],
  search: (target: Record<string, number>) => Promise<T[]>
): Promise<T[]> {
  const unique = targets.filter(
    (target, index) =>
      targets.findIndex(
        (other) => JSON.stringify(other) === JSON.stringify(target)
      ) === index
  );
  const batches = await Promise.all(unique.slice(0, 3).map(search));
  return [
    ...new Map(batches.flat().map((row) => [String(row.id), row])).values(),
  ];
}

export function sessionAffinity(
  axes: Record<string, number> | undefined,
  preferences: NonNullable<AgentPlan["session"]>["axisPreferences"]
): number | null {
  if (
    !preferences.length ||
    !axes ||
    preferences.some(({ key }) => !Number.isFinite(axes[key]))
  )
    return null;
  return (
    1 -
    preferences.reduce(
      (sum, { key, target }) => sum + Math.abs(axes[key] - target) / 6,
      0
    ) /
      preferences.length
  );
}

export function rankingScore(input: {
  base: number;
  session: number | null;
  tasteConfidence?: number;
  novelty: number;
  noveltyLevel: "none" | "medium" | "high";
}): number {
  const confidence = Math.max(0, Math.min(1, input.tasteConfidence ?? 1));
  const relevance =
    input.session === null
      ? input.base
      : (0.6 * confidence * input.base + 0.4 * input.session) /
        (0.6 * confidence + 0.4);
  return (
    relevance +
    { none: 0, medium: 0.15, high: 0.3 }[input.noveltyLevel] * input.novelty
  );
}
