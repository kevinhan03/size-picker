import { expect, it } from "vitest";

const enabled =
  process.env.QUERY_TASTE_AUDIT_USER_ID?.match(/^[0-9a-f-]{36}$/i);
it.skipIf(!enabled)(
  "audits the fifty fixed questions against one user's saved products",
  async () => {
    for (const file of [".env.local", ".env"]) {
      try {
        process.loadEnvFile(file);
      } catch {
        /* provided by runner */
      }
    }
    const { getTasteSummary } = await import("../taste-analysis");
    const { queryTasteObservationCorpus } =
      await import("./query-taste-observation-corpus");
    const { observeQueryTaste } = await import("./query-taste-observation");
    const { products } = await getTasteSummary(
      process.env.QUERY_TASTE_AUDIT_USER_ID!,
      "digbox"
    );
    const results = queryTasteObservationCorpus.map((item) => ({
      id: item.id,
      kind: item.kind,
      observation: observeQueryTaste(products, item.plan),
    }));
    const directional = results.filter(
      ({ observation }) => observation.reason === "signals_detected"
    );
    const broad = results.filter(({ kind }) => kind === "broad");
    const conditionOnly = results.filter(
      ({ observation }) => observation.reason === "condition_only"
    );
    const average = (values: Array<number | null>) => {
      const finite = values.filter(
        (value): value is number => typeof value === "number"
      );
      return finite.length
        ? finite.reduce((sum, value) => sum + value, 0) / finite.length
        : null;
    };
    console.info("Query taste read-only audit", {
      questions: results.length,
      validSavedProducts: products.length,
      broad: broad.length,
      conditionOnly: conditionOnly.length,
      directional: directional.length,
      top4Relevance: average(
        directional.map(({ observation }) => observation.metrics.top4Mean)
      ),
      localGlobalDistance: average(
        directional.map(
          ({ observation }) => observation.metrics.localGlobalDistance
        )
      ),
      top4Dispersion: average(
        directional.map(({ observation }) => observation.metrics.top4Dispersion)
      ),
      strongestLocalShift: [...directional]
        .sort(
          (left, right) =>
            (right.observation.metrics.localGlobalDistance || 0) -
            (left.observation.metrics.localGlobalDistance || 0)
        )
        .slice(0, 5)
        .map(({ id, observation }) => ({
          id,
          distance: observation.metrics.localGlobalDistance,
          relevance: observation.metrics.top4Mean,
          dispersion: observation.metrics.top4Dispersion,
        })),
      weakestLocalShift: [...directional]
        .sort(
          (left, right) =>
            (left.observation.metrics.localGlobalDistance || 0) -
            (right.observation.metrics.localGlobalDistance || 0)
        )
        .slice(0, 5)
        .map(({ id, observation }) => ({
          id,
          distance: observation.metrics.localGlobalDistance,
          relevance: observation.metrics.top4Mean,
          dispersion: observation.metrics.top4Dispersion,
        })),
    });
    expect(results).toHaveLength(50);
    expect(directional.length).toBeGreaterThan(0);
  },
  60000
);
