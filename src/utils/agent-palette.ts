const palettes = [
  { background: "#35251f", accent: "#fcab79", secondary: "#faf5e8" },
  { background: "#452328", accent: "#fa91e0", secondary: "#ffc6ae" },
  { background: "#203b2b", accent: "#c3dfb4", secondary: "#c7e5f2" },
  { background: "#1d304b", accent: "#a8d3ff", secondary: "#c7e5f2" },
  { background: "#3a3020", accent: "#fcb42a", secondary: "#faf5e8" },
  { background: "#34283f", accent: "#d6b4f5", secondary: "#fa91e0" },
] as const;

/** Stable across re-renders and history reloads, varied between answers. */
export function agentPalette(messageId: string) {
  let hash = 0;
  for (const character of messageId)
    hash = (hash * 31 + character.charCodeAt(0)) >>> 0;
  return palettes[hash % palettes.length];
}
