// Maps mock catalog color names to actual swatch colors for the generated
// product placeholders (there is no real product photography in the MVP
// catalog — see ProductSwatch).
export const COLOR_HEX: Record<string, string> = {
  cream: "#f1e9da",
  black: "#1c1b1a",
  charcoal: "#3a3936",
  brown: "#6b4a34",
  burgundy: "#5b2333",
  olive: "#5c5a3e",
  navy: "#26314a",
  white: "#fdfdfb",
  beige: "#d9cbb2",
  camel: "#b48a5b",
  blush: "#e8c3c0",
  sage: "#a8b08f",
  rust: "#a85536",
  ivory: "#f3eee3",
};

export function colorHex(name: string): string {
  return COLOR_HEX[name.toLowerCase()] ?? "#cfc8ba";
}

/** Whether black/white text reads better on a given swatch color. */
export function textOn(hex: string): "#232220" | "#faf7f2" {
  const c = hex.replace("#", "");
  const r = parseInt(c.slice(0, 2), 16);
  const g = parseInt(c.slice(2, 4), 16);
  const b = parseInt(c.slice(4, 6), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.6 ? "#232220" : "#faf7f2";
}
