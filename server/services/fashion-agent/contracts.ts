import {
  STYLE_ATTRIBUTE_FIELDS,
  STYLE_AXIS_FIELDS,
  STYLE_TAG_NAMES,
} from "../../../src/constants/styleAnalysis.js";
import type { AgentPlan } from "../../../src/types/fashion-agent";
import { PRODUCT_CATEGORY_REGISTRY } from "../../../src/constants/productCategoryRegistry.js";

export class AgentError extends Error {
  constructor(
    public code: string,
    public status = 400
  ) {
    super(code);
  }
}
export const emptyFilters = () => ({
  category: null,
  subCategory: null,
  brand: null,
  keywords: [],
  facts: [],
  axes: [],
  preferredStyles: [],
  avoidedStyles: [],
  targetGender: null,
});

type Schema = {
  type?: string | string[];
  enum?: unknown[];
  properties?: Record<string, Schema>;
  required?: string[];
  additionalProperties?: boolean;
  items?: Schema;
  maxItems?: number;
  maxLength?: number;
  minimum?: number;
  maximum?: number;
};
export function objectSchema(properties: Record<string, Schema>): Schema {
  return {
    type: "object",
    properties,
    required: Object.keys(properties),
    additionalProperties: false,
  };
}
const string = { type: "string", maxLength: 100 };
const nullable = { type: ["string", "null"], maxLength: 100 };
const strings = (maxItems = 6): Schema => ({
  type: "array",
  items: string,
  maxItems,
});
export const planSchema = objectSchema({
  session: objectSchema({
    candidateScope: { type: "string", enum: ["catalog", "collection"] },
    novelty: { type: "string", enum: ["none", "medium", "high"] },
    axisPreferences: {
      type: "array",
      maxItems: 8,
      items: objectSchema({
        key: { type: "string", enum: STYLE_AXIS_FIELDS.map((f) => f.key) },
        target: { type: "number", minimum: 1, maximum: 7 },
      }),
    },
  }),
  intent: {
    type: "string",
    enum: [
      "search",
      "recommend",
      "similar",
      "compatible",
      "compare",
      "taste",
      "knowledge",
      "clarify",
    ],
  },
  filters: objectSchema({
    category: {
      ...nullable,
      enum: [...PRODUCT_CATEGORY_REGISTRY.map((c) => c.code), null],
    },
    subCategory: {
      ...nullable,
      enum: [
        ...PRODUCT_CATEGORY_REGISTRY.flatMap((c) => c.subcategories),
        null,
      ],
    },
    brand: nullable,
    keywords: strings(5),
    facts: {
      type: "array",
      maxItems: 8,
      items: objectSchema({
        key: {
          type: "string",
          enum: [...new Set(STYLE_ATTRIBUTE_FIELDS.map((f) => f.key))],
        },
        value: {
          ...string,
          enum: [
            ...new Set(
              STYLE_ATTRIBUTE_FIELDS.flatMap((f) =>
                f.options.map((o: { value: string }) => o.value)
              )
            ),
          ],
        },
      }),
    },
    axes: {
      type: "array",
      maxItems: 8,
      items: objectSchema({
        key: { type: "string", enum: STYLE_AXIS_FIELDS.map((f) => f.key) },
        min: { type: "number", minimum: 1, maximum: 7 },
        max: { type: "number", minimum: 1, maximum: 7 },
      }),
    },
    preferredStyles: {
      type: "array",
      maxItems: 3,
      items: { type: "string", enum: STYLE_TAG_NAMES },
    },
    avoidedStyles: {
      type: "array",
      maxItems: 3,
      items: { type: "string", enum: STYLE_TAG_NAMES },
    },
    targetGender: {
      type: ["string", "null"],
      enum: ["menswear", "womenswear", "unisex", null],
    },
  }),
  personalized: { type: "boolean" },
  exploration: { type: "boolean" },
  source: { type: "string", enum: ["digbox", "closet"] },
  productIds: strings(4),
  resultPositions: {
    type: "array",
    maxItems: 4,
    items: { type: "integer", minimum: 1, maximum: 8 },
  },
  reference: {
    type: ["object", "null"],
    properties: {
      source: { type: "string", enum: ["digbox", "closet"] },
      filters: objectSchema({
        category: {
          ...nullable,
          enum: [...PRODUCT_CATEGORY_REGISTRY.map((c) => c.code), null],
        },
        subCategory: {
          ...nullable,
          enum: [
            ...PRODUCT_CATEGORY_REGISTRY.flatMap((c) => c.subcategories),
            null,
          ],
        },
        brand: nullable,
        keywords: strings(5),
        facts: {
          type: "array",
          maxItems: 8,
          items: objectSchema({
            key: {
              type: "string",
              enum: [...new Set(STYLE_ATTRIBUTE_FIELDS.map((f) => f.key))],
            },
            value: {
              ...string,
              enum: [
                ...new Set(
                  STYLE_ATTRIBUTE_FIELDS.flatMap((f) =>
                    f.options.map((o: { value: string }) => o.value)
                  )
                ),
              ],
            },
          }),
        },
        axes: {
          type: "array",
          maxItems: 8,
          items: objectSchema({
            key: { type: "string", enum: STYLE_AXIS_FIELDS.map((f) => f.key) },
            min: { type: "number", minimum: 1, maximum: 7 },
            max: { type: "number", minimum: 1, maximum: 7 },
          }),
        },
        preferredStyles: {
          type: "array",
          maxItems: 3,
          items: { type: "string", enum: STYLE_TAG_NAMES },
        },
        avoidedStyles: {
          type: "array",
          maxItems: 3,
          items: { type: "string", enum: STYLE_TAG_NAMES },
        },
        targetGender: {
          type: ["string", "null"],
          enum: ["menswear", "womenswear", "unisex", null],
        },
      }),
    },
    required: ["source", "filters"],
    additionalProperties: false,
  },
  unsupported: strings(8),
  question: { type: ["string", "null"], maxLength: 300 },
});

planSchema.properties!.followUp = {
  type: ["object", "null"],
  properties: {
    filters: planSchema.properties!.filters,
    candidateScope: { type: "string", enum: ["catalog", "collection"] },
  },
  required: ["filters", "candidateScope"],
  additionalProperties: false,
};
planSchema.required!.push("followUp");

/** Validate the same constrained schema locally, including refusal/truncated responses. */
export function validateSchema(value: unknown, schema: Schema): void {
  const type =
    value === null
      ? "null"
      : Array.isArray(value)
        ? "array"
        : typeof value === "number" && Number.isInteger(value)
          ? "integer"
          : typeof value;
  const types = Array.isArray(schema.type) ? schema.type : [schema.type];
  if (
    !types.includes(type) &&
    !(type === "integer" && types.includes("number"))
  )
    throw new AgentError("invalid_model_response", 502);
  if (schema.enum && !schema.enum.includes(value))
    throw new AgentError("invalid_model_response", 502);
  if (
    typeof value === "number" &&
    (!Number.isFinite(value) ||
      value < (schema.minimum ?? -Infinity) ||
      value > (schema.maximum ?? Infinity))
  )
    throw new AgentError("invalid_model_response", 502);
  if (
    typeof value === "string" &&
    value.length > (schema.maxLength ?? Infinity)
  )
    throw new AgentError("invalid_model_response", 502);
  if (Array.isArray(value)) {
    if (value.length > (schema.maxItems ?? Infinity))
      throw new AgentError("invalid_model_response", 502);
    value.forEach((item) => validateSchema(item, schema.items!));
  } else if (value && typeof value === "object") {
    const record = value as Record<string, unknown>;
    if (
      Object.keys(record).some((key) => !schema.properties?.[key]) ||
      schema.required?.some((key) => !(key in record))
    )
      throw new AgentError("invalid_model_response", 502);
    Object.entries(record).forEach(([key, item]) =>
      validateSchema(item, schema.properties![key])
    );
  }
}
export function validatePlan(value: unknown): AgentPlan {
  if (value && typeof value === "object" && !("followUp" in value))
    value = { ...value, followUp: null };
  // Stored v1 plans remain readable; provider output still requires all v2 fields.
  if (value && typeof value === "object" && !("session" in value)) {
    value = {
      ...value,
      session: {
        candidateScope: "catalog",
        novelty: (value as AgentPlan).exploration ? "medium" : "none",
        axisPreferences: [],
      },
    };
  }
  validateSchema(value, planSchema);
  const plan = value as AgentPlan;
  // The schema permits every registry subcategory so OpenAI can use one schema
  // for both result and reference filters. A wrong cross-category selection
  // (e.g. a shirt subcategory on pants) adds no useful constraint; discard it
  // instead of turning an otherwise valid request into a provider error.
  const normalizeSubcategory = <
    T extends { category: string | null; subCategory: string | null },
  >(
    filters: T
  ): T =>
    filters.subCategory &&
    !PRODUCT_CATEGORY_REGISTRY.some(
      (category) =>
        category.code === filters.category &&
        category.subcategories.includes(filters.subCategory!)
    )
      ? { ...filters, subCategory: null }
      : filters;
  plan.filters = normalizeSubcategory(plan.filters);
  if (plan.reference)
    plan.reference = {
      ...plan.reference,
      filters: normalizeSubcategory(plan.reference.filters),
    };
  if (plan.followUp)
    plan.followUp = {
      ...plan.followUp,
      filters: normalizeSubcategory(plan.followUp.filters),
    };
  if (plan.followUp) {
    if (
      !["search", "recommend"].includes(plan.intent) ||
      !plan.followUp.filters.category
    )
      throw new AgentError("invalid_model_response", 502);
    plan.followUp.filters = validatePlan({
      ...plan,
      filters: plan.followUp.filters,
      followUp: null,
      reference: null,
    }).filters;
  }
  if (
    plan.filters.axes.some((axis) => axis.min > axis.max) ||
    plan.productIds.some((id) => !/^[1-9]\d{0,15}$/.test(id))
  )
    throw new AgentError("invalid_model_response", 502);
  for (const fact of plan.filters.facts) {
    if (
      !STYLE_ATTRIBUTE_FIELDS.some(
        (field) =>
          field.key === fact.key &&
          field.options.some(
            (option: { value: string }) => option.value === fact.value
          )
      )
    )
      throw new AgentError("invalid_model_response", 502);
  }
  // Structured filters already express these words. Requiring them again as
  // literal product-name substrings breaks Korean queries over English names.
  const categoryTerms: Record<string, string[]> = {
    Top: ["상의", "탑", "top"],
    Bottom: ["하의", "바지", "팬츠", "pants", "trousers"],
    Outer: ["아우터", "자켓", "재킷", "outerwear", "jacket"],
    DressSkirt: ["원피스", "스커트"],
    Shoes: ["신발", "슈즈", "shoes"],
    Bag: ["가방", "백", "bag"],
  };
  const colors: Record<string, string[]> = {
    black: ["검정", "검정색", "검은", "검은색"],
    white: ["흰", "흰색", "하얀", "하얀색"],
    gray: ["회색"],
    brown: ["갈색"],
    blue: ["파란", "파란색"],
    red: ["빨간", "빨간색"],
    green: ["녹색", "초록", "초록색"],
  };
  const redundant = new Set<string>(
    (categoryTerms[plan.filters.category || ""] || []).map((s) =>
      s.toLowerCase()
    )
  );
  for (const fact of plan.filters.facts) {
    redundant.add(fact.value.toLowerCase());
    STYLE_ATTRIBUTE_FIELDS.filter((f) => f.key === fact.key).forEach((f) =>
      f.options
        .filter((o: { value: string }) => o.value === fact.value)
        .forEach((o: { label: string }) => redundant.add(o.label.toLowerCase()))
    );
    if (fact.key === "primary_color")
      (colors[fact.value] || []).forEach((term) => redundant.add(term));
  }
  if (plan.filters.brand) redundant.add(plan.filters.brand.toLowerCase());
  const referenceFilters = plan.reference
    ? validatePlan({
        ...plan,
        filters: plan.reference.filters,
        reference: null,
      }).filters
    : null;
  return {
    ...plan,
    exploration:
      plan.session?.candidateScope === "collection"
        ? false
        : plan.session?.novelty !== "none" || plan.exploration,
    reference: plan.reference
      ? { ...plan.reference, filters: referenceFilters! }
      : null,
    filters: {
      ...plan.filters,
      keywords: plan.filters.keywords.filter(
        (term) =>
          !term.split(/\s+/).every((word) => redundant.has(word.toLowerCase()))
      ),
    },
  };
}
export function resolveReferences(
  plan: AgentPlan,
  resultIds: string[],
  message: string
): string[] {
  const ids = [...plan.productIds];
  for (const position of plan.resultPositions) {
    if (!resultIds[position - 1])
      throw new AgentError("unknown_product_reference");
    ids.push(resultIds[position - 1]);
  }
  const explicitIds: string[] = message.match(/\b\d+\b/g) || [];
  if (ids.some((id) => !resultIds.includes(id) && !explicitIds.includes(id)))
    throw new AgentError("unknown_product_reference");
  return [...new Set(ids)].slice(0, 4);
}
