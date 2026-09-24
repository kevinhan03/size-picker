import type { Product } from "../../../src/types";
import type {
  AgentOutfitSlot,
  AgentPlan,
  AgentProduct,
  AgentReply,
  OutfitSlot,
} from "../../../src/types/fashion-agent";
import {
  getCrossCategoryStyleSimilarity,
  getEffectiveProductTargetGender,
} from "../../../src/utils/tasteGraph";
import { supabase } from "../../lib/supabase.js";
import { normalizeAnalysisProduct, RECOMMENDATION_COLUMNS } from "../catalog";
import { getClosetProducts } from "../user-collections";
import { compactCard } from "./presentation";
import { runEngine } from "./engine";

const slots: Array<{ key: OutfitSlot; category: string }> = [
  { key: "top", category: "Top" },
  { key: "bottom", category: "Bottom" },
  { key: "outer", category: "Outer" },
  { key: "shoes", category: "Shoes" },
];

function harmony(candidate: Product, selected: Product[]) {
  if (!selected.length) return 0.5;
  const scores = selected.flatMap((item) => {
    const leftGender = getEffectiveProductTargetGender(item);
    const rightGender = getEffectiveProductTargetGender(candidate);
    if (
      ![leftGender, "unisex", "unknown"].includes(rightGender) &&
      !["unisex", "unknown"].includes(leftGender)
    )
      return [];
    const value = getCrossCategoryStyleSimilarity(item, candidate);
    return value ? [value.score] : [];
  });
  return scores.length
    ? scores.reduce((sum, score) => sum + score, 0) / scores.length
    : -1;
}

export async function buildOutfit(
  userId: string,
  plan: AgentPlan,
  locale: string,
  anchorId?: string
): Promise<AgentReply> {
  const en = locale === "en";
  if (plan.unsupported.length)
    return {
      text: en
        ? "DIGBOX cannot verify these requirements. Remove them to build an outfit."
        : "확인할 수 없는 조건을 제외하면 코디를 제안할 수 있어요.",
      notes: [plan.unsupported.join(", ")],
      products: [],
    };
  const wardrobeMode = plan.intent === "wardrobe";
  const owned = wardrobeMode ? await getClosetProducts(userId) : [];
  const selected: Product[] = [];
  const products: AgentProduct[] = [];
  const resultSlots: AgentOutfitSlot[] = [];
  let anchor = anchorId
    ? owned.find((item) => item.id === anchorId)
    : undefined;
  if (anchorId && !anchor) {
    const { data, error } = await supabase!
      .from("products")
      .select(RECOMMENDATION_COLUMNS)
      .eq("id", anchorId)
      .maybeSingle();
    if (error) throw error;
    anchor = data ? normalizeAnalysisProduct(data) || undefined : undefined;
  }
  if (anchorId && !anchor)
    return {
      text: en
        ? "I couldn't find the item to build around."
        : "기준으로 삼을 상품을 찾지 못했어요.",
      products: [],
      notes: [],
    };
  if (anchor && !slots.some((slot) => slot.category === anchor.category))
    return {
      text: en
        ? "Choose a top, bottom, outerwear, or shoes as the outfit anchor."
        : "상의·하의·겉옷·신발 중 기준 상품을 골라 주세요.",
      products: [],
      notes: [],
    };
  if (anchor) selected.push(anchor);
  for (const { key, category } of slots) {
    if (anchor?.category === category) {
      products.push({
        ...compactCard(anchor),
        relationship: owned.some((item) => item.id === anchor!.id)
          ? "owned"
          : "new",
        reasons: [
          en
            ? "The item you chose as the outfit anchor."
            : "코디의 기준으로 지정한 상품이에요.",
        ],
        tasteScore: null,
      });
      resultSlots.push({
        slot: key,
        productId: anchor.id,
        source: owned.some((item) => item.id === anchor!.id)
          ? "closet"
          : "catalog",
        reason: en ? "Your chosen item" : "지정한 기준 상품",
      });
      continue;
    }
    const slotPlan: AgentPlan = {
      ...plan,
      intent: "recommend",
      filters: {
        ...plan.filters,
        category,
        subCategory:
          plan.filters.category === category ? plan.filters.subCategory : null,
        brand: plan.filters.category === category ? plan.filters.brand : null,
        keywords:
          plan.filters.category === category ? plan.filters.keywords : [],
        facts: plan.filters.category === category ? plan.filters.facts : [],
      },
      personalized: plan.personalized || wardrobeMode,
      source: wardrobeMode ? "closet" : plan.source,
      reference: null,
      followUp: null,
      session: {
        candidateScope: "catalog",
        novelty: "none",
        axisPreferences: plan.session?.axisPreferences || [],
      },
    };
    const ownedCandidates = owned.filter(
      (item) =>
        item.category === category &&
        !selected.some((chosen) => chosen.id === item.id)
    );
    const compatibleOwned = ownedCandidates
      .map((item) => ({ item, score: harmony(item, selected) }))
      .filter((entry) => entry.score >= 0)
      .sort((a, b) => b.score - a.score || a.item.id.localeCompare(b.item.id));
    if (wardrobeMode && compatibleOwned.length) {
      const item = compatibleOwned[0].item;
      selected.push(item);
      products.push({
        ...compactCard(item),
        relationship: "owned",
        reasons: [
          en
            ? "Selected from your wardrobe using DIGBOX style harmony."
            : "옷장 상품 중 DIGBOX 스타일 조화 점수를 기준으로 골랐어요.",
        ],
        tasteScore: null,
      });
      resultSlots.push({
        slot: key,
        productId: item.id,
        source: "closet",
        reason: en ? "From your wardrobe" : "내 옷장에서 선택",
      });
      continue;
    }
    const found = await runEngine(userId, slotPlan, [], locale);
    const candidateCards = found.products
      .filter((card) => !selected.some((item) => item.id === card.id))
      .slice(0, 8);
    let chosen: AgentProduct | undefined;
    let chosenModel: Product | undefined;
    if (candidateCards.length) {
      const { data, error } = await supabase!
        .from("products")
        .select(RECOMMENDATION_COLUMNS)
        .in(
          "id",
          candidateCards.map((card) => card.id)
        );
      if (error) throw error;
      const models = new Map(
        (data || []).flatMap((row) => {
          const item = normalizeAnalysisProduct(row);
          return item ? [[item.id, item] as const] : [];
        })
      );
      const ranked = candidateCards
        .map((card, index) => ({
          card,
          model: models.get(card.id),
          score: models.has(card.id)
            ? harmony(models.get(card.id)!, selected) - index * 0.01
            : -1,
        }))
        .filter((entry) => entry.model && entry.score >= 0)
        .sort((a, b) => b.score - a.score);
      if (ranked.length) {
        chosen = ranked[0].card;
        chosenModel = ranked[0].model;
      }
    }
    if (chosen && chosenModel) {
      selected.push(chosenModel);
      products.push(chosen);
      resultSlots.push({
        slot: key,
        productId: chosen.id,
        source: "catalog",
        reason: wardrobeMode
          ? en
            ? "A catalog item to fill a wardrobe gap"
            : "옷장에 없는 품목을 카탈로그에서 보충"
          : en
            ? "Selected from the catalog"
            : "카탈로그에서 선택",
      });
    } else {
      resultSlots.push({
        slot: key,
        productId: null,
        source: null,
        reason: en
          ? "No compatible item was found for this slot."
          : "이 칸에 맞는 상품을 찾지 못했어요.",
      });
    }
  }
  return {
    text: wardrobeMode
      ? en
        ? resultSlots.some((slot) => slot.source === "catalog")
          ? "Here is one outfit built around your wardrobe. Catalog items fill missing slots."
          : "Here is one outfit built around your wardrobe."
        : resultSlots.some((slot) => slot.source === "catalog")
          ? "옷장 상품을 중심으로 한 가지 코디를 구성했어요. 부족한 품목은 카탈로그에서 보충했어요."
          : "옷장 상품을 중심으로 한 가지 코디를 구성했어요."
      : en
        ? "Here is one outfit assembled from DIGBOX products."
        : "DIGBOX 상품으로 한 가지 코디를 구성했어요.",
    products,
    notes: [
      en
        ? "Style compatibility is an estimate based on analyzed product attributes."
        : "스타일 조화는 분석된 상품 속성에 근거한 추정이에요.",
    ],
    outfit: { mode: wardrobeMode ? "wardrobe" : "catalog", slots: resultSlots },
  };
}
