import { expect, it } from "vitest";
import { queryTasteObservationCorpus } from "./query-taste-observation-corpus";
it("keeps broad control questions separate from directional queries", () => {
  expect(queryTasteObservationCorpus).toHaveLength(50);
  expect(
    queryTasteObservationCorpus.filter((item) => item.kind === "broad")
  ).toHaveLength(20);
  expect(
    queryTasteObservationCorpus.filter((item) => item.kind === "directional")
  ).toHaveLength(30);
  expect(new Set(queryTasteObservationCorpus.map((item) => item.id)).size).toBe(
    50
  );
});
