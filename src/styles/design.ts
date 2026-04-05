/** Centralised design config — import from here, never hardcode elsewhere */

export const COLOURS = {
  wifey: "#4a90d9",
  hubby: "#e07b54",
  draw: "#888888",
  drawBg: "#555555",

  /** Semi-transparent fills for chart areas */
  wifeyFill: "#4a90d933",
  hubbyFill: "#e07b5433",

  /** Table row backgrounds */
  rowWifey: "rgba(74, 144, 217, 0.12)",
  rowHubby: "rgba(224, 123, 84, 0.12)",
  rowTiebreakerWifey: "rgba(74, 144, 217, 0.06)",
  rowTiebreakerHubby: "rgba(224, 123, 84, 0.06)",
  rowDraw: "rgba(136, 136, 136, 0.08)",

  /** Special category tick colours */
  nectar: "#ff69b4",   // bright pink
  duet: "#ff3333",     // bright red
  hummingbirds: "#33dd66", // bright green

  /** Chart chrome */
  chartGrid: "#2a2a4a",
  chartText: "#9999bb",
  tooltipBg: "#16213e",
  tooltipTitle: "#e8e8f0",
  tooltipBody: "#9999bb",
  tooltipBorder: "#2a2a4a",
} as const;

export const SPECIAL_CATEGORIES = ["Nectar", "Duet", "HummingBirds"] as const;
export type SpecialCategory = (typeof SPECIAL_CATEGORIES)[number];

export const SPECIAL_CATEGORY_COLOUR: Record<SpecialCategory, string> = {
  Nectar: COLOURS.nectar,
  Duet: COLOURS.duet,
  HummingBirds: COLOURS.hummingbirds,
};
