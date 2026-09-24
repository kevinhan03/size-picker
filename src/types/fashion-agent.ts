import type { ProductCardData } from "./index";

export type AgentIntent =
  | "search"
  | "recommend"
  | "similar"
  | "compatible"
  | "compare"
  | "taste"
  | "outfit"
  | "wardrobe"
  | "knowledge"
  | "clarify";
export type OutfitSlot = "top" | "bottom" | "outer" | "shoes";
export type AgentOutfitSlot = {
  slot: OutfitSlot;
  productId: string | null;
  source: "closet" | "catalog" | null;
  reason: string;
};
export type AgentFilters = {
  category: string | null;
  subCategory: string | null;
  brand: string | null;
  keywords: string[];
  facts: Array<{ key: string; value: string }>;
  axes: Array<{ key: string; min: number; max: number }>;
  preferredStyles: string[];
  avoidedStyles: string[];
  targetGender: "menswear" | "womenswear" | "unisex" | null;
};
export type AgentPlan = {
  followUp?: {
    filters: AgentFilters;
    candidateScope: "catalog" | "collection";
  } | null;
  session?: {
    candidateScope: "catalog" | "collection";
    novelty: "none" | "medium" | "high";
    axisPreferences: Array<{ key: string; target: number }>;
  };
  intent: AgentIntent;
  filters: AgentFilters;
  personalized: boolean;
  exploration: boolean;
  source: "digbox" | "closet";
  productIds: string[];
  resultPositions: number[];
  reference: { source: "digbox" | "closet"; filters: AgentFilters } | null;
  unsupported: string[];
  question: string | null;
};
export type AgentProduct = ProductCardData & {
  relationship?: "new" | "saved" | "owned";
  evidence?: {
    source: "digbox" | "closet" | "query";
    analyzedCount: number;
    confidence: "none" | "low" | "medium" | "high";
    sessionMatch: number | null;
    caveats: string[];
  };
  reasons: string[];
  tasteScore: number | null;
  recommendationGroup?: "primary" | "compatible";
};
export type AgentReply = {
  outfit?: { mode: "wardrobe" | "catalog"; slots: AgentOutfitSlot[] };
  presentation?: AgentPresentation;
  text: string;
  products: AgentProduct[];
  notes: string[];
};
export type AgentMessage = {
  outfit?: AgentReply["outfit"];
  presentation?: AgentPresentation;
  id: string;
  role: "user" | "assistant";
  text: string;
  products?: AgentProduct[];
  notes?: string[];
};
export type AgentState = { plan: AgentPlan | null; resultIds: string[] };
export type AgentPresentation = {
  kind: "taste" | "recommend" | "compatible" | "compare" | "knowledge";
  title: string;
  distribution?: Array<{ label: string; percent: number }>;
  confidence?: string;
  representatives?: Array<{ label: string; products: ProductCardData[] }>;
  comparedProducts?: ProductCardData[];
  reference?: ProductCardData;
  axes?: Array<{
    label: string;
    explanation?: string;
    values: Array<{ name: string; value: number }>;
  }>;
};
export type AgentConversation = {
  id: string;
  title: string;
  messages: AgentMessage[];
  updated_at: string;
};
