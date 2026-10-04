import type { Tally } from "@/types/tally";
import { getAnalysisUrl } from "@/utils/urls";
import { computeGlobalStats } from "@/data/globals";
import type { GlobalMetric } from "@/data/globals";

function fmt2(n: number): string {
  return n.toFixed(2);
}

function fmtInt(n: number): string {
  return Number.isInteger(n) ? String(n) : n.toFixed(1);
}

function streakLabel(length: number): string {
  return length === 0 ? "—" : String(length);
}

function streakSub(player: "wifey" | "hubby" | null, length: number): string | undefined {
  if (!player || length === 0) return undefined;
  const name = player === "wifey" ? "Wifey" : "Hubby";
  return `${name}, ${length} game${length !== 1 ? "s" : ""}`;
}

/** Absolute display — direction is conveyed by colour and the player name instead of a sign. */
function fmtAbs(n: number): string {
  return fmtInt(Math.abs(n));
}

/** Colour modifier for the holder of a metric; neutral when level or tied. */
function holderModifier(holder: GlobalMetric["holder"]): string {
  return holder ? `stat-card--${holder}` : "stat-card--neutral";
}

function holderName(holder: GlobalMetric["holder"]): string | undefined {
  if (!holder) return undefined;
  return holder === "wifey" ? "Wifey" : "Hubby";
}

/** "Cumulative" collapses to "Cum" on mobile; the swap is done in CSS so no re-render is needed. */
const CUMULATIVE_LABEL = `<span class="label-full">Cumulative</span><span class="label-short">Cum</span>`;

type Card = {
  label: string;
  value: string;
  sub?: string;
  modifier: string;
  best?: boolean;
  subBest?: boolean;
  labelItalic?: boolean;
  gameId?: number | null;
  subGameId?: number | null;
  tooltip?: string;
};

function cardHtml(c: Card): string {
  const labelClass = `stat-card__label${c.labelItalic ? " stat-card__label--italic" : ""}${c.tooltip ? " stat-card__label--tooltip" : ""}`;
  const valueClass = `stat-card__value${c.best ? " stat-card__value--best" : ""}`;
  const subClass = `stat-card__sub${c.subBest ? " stat-card__sub--best" : ""}`;
  const valueHtml = c.gameId
    ? `<a href="${getAnalysisUrl(c.gameId)}" class="stat-card__link" title="View game #${c.gameId}">${c.value}</a>`
    : c.value;
  const labelHtml = c.tooltip
    ? `<span class="${labelClass}" title="${c.tooltip}">${c.label}</span>`
    : `<span class="${labelClass}">${c.label}</span>`;
  const subHtml = c.sub !== undefined
    ? c.subGameId
      ? `<a href="${getAnalysisUrl(c.subGameId)}" class="stat-card__link stat-card__sub-link" title="View game #${c.subGameId}">${c.sub}</a>`
      : c.sub
    : "";
  return `
    <div class="stat-card ${c.modifier}">
      ${labelHtml}
      <span class="${valueClass}">${valueHtml}</span>
      ${c.sub !== undefined ? `<span class="${subClass}">${subHtml}</span>` : ""}
    </div>`;
}

function simpleRow(rowLabel: string, cards: Card[], extraClass = ""): string {
  const labelHtml = rowLabel ? `<span class="summary-row__label">${rowLabel}</span>` : "";
  return `<div class="summary-row ${extraClass}">
    ${labelHtml}
    ${cards.map(cardHtml).join("")}
  </div>`;
}

/** One wifey/hubby line: a coloured subheader beside (desktop) or above (mobile) its row. */
function playerLine(player: "wifey" | "hubby" | null, row: string): string {
  // A null player renders an empty spacer so unlabelled rows stay column-aligned with labelled ones
  const name = player === "wifey" ? "Wifey" : player === "hubby" ? "Hubby" : "";
  return `<div class="summary-paired__line">
    <span class="summary-paired__subhead summary-paired__subhead--${player ?? "spacer"}">${name}</span>
    ${row}
  </div>`;
}

/**
 * Wrap two rows with a single spanning vertical label.
 * With `playerRows`, the rows are treated as wifey (A) then hubby (B) and given subheaders;
 */
function pairedRows(label: string, rowA: string, rowB: string, extraClass = "", playerRows = false): string {
  return `<div class="summary-paired ${extraClass}">
    <span class="summary-paired__label">${label}</span>
    <div class="summary-paired__rows">
      ${playerRows ? playerLine("wifey", rowA) : rowA}
      ${playerRows ? playerLine("hubby", rowB) : rowB}
    </div>
  </div>`;
}

/** Globals: one unlabelled current row, then a wifey and a hubby row of per-topic maxes. */
function globalsBlock(currentRow: string, wifeyMaxRow: string, hubbyMaxRow: string): string {
  return `<div class="summary-paired summary-paired--globals">
    <span class="summary-paired__label">Globals</span>
    <div class="summary-paired__rows">
      ${playerLine(null, currentRow)}
      ${playerLine("wifey", wifeyMaxRow)}
      ${playerLine("hubby", hubbyMaxRow)}
    </div>
  </div>`;
}

export function renderSummaryBar(tally: Tally, el: HTMLElement): void {
  const {
    totalGames,
    wins,
    perfectGames,
    pureDraws,
    currentStreak,
    runningHistory,
    avgMarginWifey,
    avgMarginHubby,
    maxScoreByCategory,
    avgScoreByCategory,
    universalCategories,
    drawSummary,
  } = tally;

  const tbWifey = drawSummary.tiebreakerWins.wifey;
  const tbHubby = drawSummary.tiebreakerWins.hubby;

  // ── Overall: headline counts, then wifey/hubby pairs per metric ──
  const overallTopRow = simpleRow("", [
    { label: "Total Games", value: String(totalGames), modifier: "stat-card--neutral" },
    {
      label: "Wifey Wins",
      value: String(wins.wifey),
      sub: tbWifey > 0 ? `${tbWifey} tiebreaker${tbWifey !== 1 ? "s" : ""}` : undefined,
      modifier: "stat-card--wifey",
    },
    {
      label: "Hubby Wins",
      value: String(wins.hubby),
      sub: tbHubby > 0 ? `${tbHubby} tiebreaker${tbHubby !== 1 ? "s" : ""}` : undefined,
      modifier: "stat-card--hubby",
    },
    { label: "Pure Draws", value: String(pureDraws), modifier: "stat-card--neutral" },
  ], "summary-row--current");

  // Tied values both earn the asterisk
  const avgOverallWifey = avgScoreByCategory[0]?.wifey ?? 0;
  const avgOverallHubby = avgScoreByCategory[0]?.hubby ?? 0;
  const perfectsTooltip = "Games where a player won every single category";

  /** One metric as a wifey card followed by a hubby card, so a 2-column grid yields one row per metric. */
  const playerPair = (
    label: string,
    wifeyValue: string,
    hubbyValue: string,
    wifeyBest: boolean,
    hubbyBest: boolean,
    tooltip?: string,
  ): Card[] => [
    { label, value: wifeyValue, sub: "Wifey", modifier: "stat-card--wifey", best: wifeyBest, tooltip },
    { label, value: hubbyValue, sub: "Hubby", modifier: "stat-card--hubby", best: hubbyBest, tooltip },
  ];

  const overallPairsRow = simpleRow("", [
    ...playerPair("Avg Score", fmt2(avgOverallWifey), fmt2(avgOverallHubby),
      avgOverallWifey >= avgOverallHubby, avgOverallHubby >= avgOverallWifey),
    ...playerPair("Avg Margin", fmt2(avgMarginWifey), fmt2(avgMarginHubby),
      avgMarginWifey >= avgMarginHubby, avgMarginHubby >= avgMarginWifey),
    ...playerPair("Perfects", String(perfectGames.wifey), String(perfectGames.hubby),
      perfectGames.wifey >= perfectGames.hubby, perfectGames.hubby >= perfectGames.wifey, perfectsTooltip),
  ], "summary-row--overall-pairs");

  // ── Category rows — avg as main value, max as subtext ────
  const catStats = maxScoreByCategory.slice(1);
  const catAvgStats = avgScoreByCategory.slice(1);
  const maxMap = new Map(catStats.map((s) => [s.category, s]));

  function catCard(
    label: string,
    avgValue: number,
    maxValue: number,
    opponentAvg: number,
    opponentMax: number,
    modifier: string,
    maxGameId?: number | null,
  ): Card {
    const avgBest = avgValue >= opponentAvg;
    const maxBest = maxValue >= opponentMax;
    return {
      label,
      value: fmt2(avgValue),
      best: avgBest,
      sub: `max ${fmtInt(maxValue)}${maxBest ? "*" : ""}`,
      subBest: false, // asterisk is inline in sub text instead
      modifier,
      labelItalic: !universalCategories.has(label),
      subGameId: maxGameId,
    };
  }

  const wifeyCards: Card[] = catAvgStats.map((s) => {
    const maxS = maxMap.get(s.category);
    return catCard(
      s.category,
      s.wifey,
      maxS?.wifey ?? 0,
      s.hubby,
      maxS?.hubby ?? 0,
      "stat-card--wifey",
      maxS?.maxWifeyGameId,
    );
  });

  const hubbyCards: Card[] = catAvgStats.map((s) => {
    const maxS = maxMap.get(s.category);
    return catCard(
      s.category,
      s.hubby,
      maxS?.hubby ?? 0,
      s.wifey,
      maxS?.wifey ?? 0,
      "stat-card--hubby",
      maxS?.maxHubbyGameId,
    );
  });

  const catWifeyRow = simpleRow("", wifeyCards, "summary-row--categories");
  const catHubbyRow = simpleRow("", hubbyCards, "summary-row--categories");

  // ── Globals — current standing above all-time extremes ───
  const globals = computeGlobalStats(runningHistory, currentStreak);

  /** Current cards: coloured by the current holder, named in the subtext. */
  const currentCard = (label: string, m: GlobalMetric, value: string): Card => ({
    label,
    value,
    sub: holderName(m.holder),
    modifier: holderModifier(m.holder),
  });

  /** Max cards: underlined (linked) to the game the record was last held; the row's subheader names the player. */
  const maxCard = (label: string, m: GlobalMetric, value: string): Card => ({
    label,
    value,
    modifier: holderModifier(m.holder),
    gameId: m.gameId,
  });

  /** One player's maxes, ordered to sit beneath the matching current card. */
  const maxCards = (player: "wifey" | "hubby"): Card[] => [
    maxCard("Max Running Tally", globals.maxTally[player], fmtAbs(globals.maxTally[player].value)),
    maxCard("Max Streak", globals.maxStreak[player], streakLabel(globals.maxStreak[player].value)),
    maxCard(`Max ${CUMULATIVE_LABEL} Margin`, globals.maxMargin[player], fmtAbs(globals.maxMargin[player].value)),
  ];

  const globalsCurrentRow = simpleRow("", [
    currentCard("Current Running Tally", globals.currentTally, fmtAbs(globals.currentTally.value)),
    currentCard("Current Streak", globals.currentStreak, streakLabel(globals.currentStreak.value)),
    currentCard(`Current ${CUMULATIVE_LABEL} Margin`, globals.currentMargin, fmtAbs(globals.currentMargin.value)),
  ], "summary-row--globals");
  const globalsWifeyRow = simpleRow("", maxCards("wifey"), "summary-row--globals");
  const globalsHubbyRow = simpleRow("", maxCards("hubby"), "summary-row--globals");

  el.innerHTML =
    pairedRows("Overall", overallTopRow, overallPairsRow, "summary-paired--overall") +
    `<div class="summary-section-gap"></div>` +
    pairedRows("Categories", catWifeyRow, catHubbyRow, "", true) +
    `<div class="summary-section-gap"></div>` +
    globalsBlock(globalsCurrentRow, globalsWifeyRow, globalsHubbyRow);
}
