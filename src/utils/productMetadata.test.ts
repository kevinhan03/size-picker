import { describe, expect, it } from "vitest";
import {
  buildStructuredProductMetadata,
  extractStyleFactTextFromHtml,
} from "../../server/services/product-metadata/html.js";

describe("product-page tagging text extraction", () => {
  it("keeps product facts and removes size-only, UI, and duplicate translation text", () => {
    const candidates = extractStyleFactTextFromHtml({
      seedTexts: [
        "내구성이 돋보이는 코듀로이 넥 비조 단추 여밈 후면 래글런 소매 구조 버튼 커프스 밴딩 처리된 허리 장식적인 곡선 시접 YKK EXCELLA® 프론트 지퍼 크롭 핏",
        "Durable corduroy Throat latch on collar Split raglan construction Buttoned cuffs Elastic waistband Decortative curved seam YKK EXCELLA front zip Cropped fit",
        "총장/가슴 단면/소매장 S: 58.3cm/57cm/77cm M: 61cm/60cm/79cm L: 63.7cm/63cm/81cm",
        "면 52% 폴리에스터 48% 안감: 폴리에스터 100% 제조자: 주식회사 포스트아카이브 제조국: 대한민국",
        "새로 고침 --> Composition 면 52% 폴리에스터 48% --> Care 드라이 클리닝 세탁.",
      ],
    });

    expect(candidates).toEqual([
      "내구성이 돋보이는 코듀로이 넥 비조 단추 여밈 후면 래글런 소매 구조 버튼 커프스 밴딩 처리된 허리 장식적인 곡선 시접 YKK EXCELLA® 프론트 지퍼 크롭 핏",
      "면 52% 폴리에스터 48% 안감: 폴리에스터 100% 제조자: 주식회사 포스트아카이브 제조국: 대한민국",
    ]);

    expect(buildStructuredProductMetadata({ sourceTexts: candidates, category: "outer" })).toMatchObject({
      metadata_source: "product_page",
      product_summary: candidates[0],
      materials: [candidates[1]],
      fit_silhouette: expect.arrayContaining(["래글런 소매", "크롭 핏"]),
      design_details: expect.arrayContaining(["넥 비조", "YKK EXCELLA 프론트 지퍼"]),
      pattern_texture: ["코듀로이"],
      category_details: {
        detail_type: "outer",
        attributes: expect.objectContaining({ collar: ["넥 비조"], closure: ["단추 여밈"] }),
      },
    });
  });
});
