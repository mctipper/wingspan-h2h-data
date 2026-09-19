/** Centralised design config — import from here, never hardcode elsewhere. */

export const COLOURS = {
  wifey: "#4a90d9",
  hubby: "#B3E6B5",
  draw: "#888888",

  /** Semi-transparent fills for chart areas */
  wifeyFill: "#4a90d933",
  hubbyFill: "#B3E6B533",

  /** Table row backgrounds */
  rowWifey: "rgba(74, 144, 217, 0.12)",
  rowHubby: "rgba(179, 230, 181, 0.12)",
  rowTiebreakerWifey: "rgba(74, 144, 217, 0.06)",
  rowTiebreakerHubby: "rgba(179, 230, 181, 0.06)",
  rowDraw: "rgba(170, 170, 170, 0.1)",
  rowWifeyHover: "rgba(74, 144, 217, 0.2)",
  rowHubbyHover: "rgba(179, 230, 181, 0.2)",
  rowTiebreakerWifeyHover: "rgba(74, 144, 217, 0.12)",
  rowTiebreakerHubbyHover: "rgba(179, 230, 181, 0.12)",
  rowDrawHover: "rgba(170, 170, 170, 0.18)",

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

const CSS_COLOUR_PROPERTIES: Record<string, string> = {
  "--colour-wifey": COLOURS.wifey,
  "--colour-hubby": COLOURS.hubby,
  "--colour-draw": COLOURS.draw,
  "--row-wifey": COLOURS.rowWifey,
  "--row-hubby": COLOURS.rowHubby,
  "--row-tiebreaker-wifey": COLOURS.rowTiebreakerWifey,
  "--row-tiebreaker-hubby": COLOURS.rowTiebreakerHubby,
  "--row-draw": COLOURS.rowDraw,
  "--row-wifey-hover": COLOURS.rowWifeyHover,
  "--row-hubby-hover": COLOURS.rowHubbyHover,
  "--row-tiebreaker-wifey-hover": COLOURS.rowTiebreakerWifeyHover,
  "--row-tiebreaker-hubby-hover": COLOURS.rowTiebreakerHubbyHover,
  "--row-draw-hover": COLOURS.rowDrawHover,
  "--bg-primary": "#1a1a2e",
  "--bg-card": "#16213e",
  "--border-colour": COLOURS.chartGrid,
  "--text-primary": COLOURS.tooltipTitle,
  "--text-secondary": COLOURS.chartText,
};

/** Applies the canonical palette to the document's CSS custom properties. */
export function applyDesignTokens(): void {
  const root = document.documentElement;
  Object.entries(CSS_COLOUR_PROPERTIES).forEach(([property, value]: [string, string]) => {
    root.style.setProperty(property, value);
  });
}

/** Reveals the rendered application after design tokens and content are ready. */
export function markAppReady(): void {
  document.body.classList.remove("app-loading");
  document.body.classList.add("app-ready");
  document.getElementById("app-loading")?.setAttribute("aria-hidden", "true");
}

export const SPECIAL_CATEGORIES = ["Nectar", "Duet", "Hummingbirds"] as const;
export type SpecialCategory = (typeof SPECIAL_CATEGORIES)[number];

export const SPECIAL_CATEGORY_COLOUR: Record<SpecialCategory, string> = {
  Nectar: COLOURS.nectar,
  Duet: COLOURS.duet,
  Hummingbirds: COLOURS.hummingbirds,
};
