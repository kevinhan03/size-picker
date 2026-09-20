const COLOR_TOKENS = [
  ["black", /(?:블랙|검정|\bblack\b)/i],
  ["navy", /(?:네이비|\bnavy\b)/i],
  ["white", /(?:화이트|흰색|\bwhite\b)/i],
  ["blue", /(?:블루(?!종)|파랑|파란|\bblue\b)/i],
  ["gray", /(?:그레이|회색|\bgr[ae]y\b)/i],
  ["brown", /(?:브라운|갈색|\bbrown\b)/i],
  ["beige", /(?:베이지|\bbeige\b)/i],
];

/** Only use a single, explicit colour token. Ambiguous or multi-colour names stay unflagged. */
export function explicitNameColor(name) {
  const text = String(name || "");
  const matches = COLOR_TOKENS.filter(([, pattern]) => pattern.test(text)).map(
    ([color]) => color
  );
  if (matches.length && /[/+&,]/.test(text)) return null;
  return matches.length === 1 ? matches[0] : null;
}

export function detectStyleAttributeConflicts(product, attributes) {
  const expected = explicitNameColor(product?.name);
  const actual = attributes?.primary_color;
  if (!expected || !actual || expected === actual) return [];
  return [
    {
      field: "primary_color",
      expected,
      actual,
      source: "product_name",
      confidence: "high",
      message: `상품명 색상 표기(${expected})와 AI 분석(${actual})이 달라 검수가 필요합니다.`,
    },
  ];
}
