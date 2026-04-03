import type { Tally } from "../types/tally";

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

type Card = {
  label: string;
  value: string;
  sub?: string;
  modifier: string;
  best?: boolean;
  subBest?: boolean;
  labelItalic?: boolean;
};

function cardHtml(c: Card): string {
  const labelClass = `stat-card__label${c.labelItalic ? " stat-card__label--italic" : ""}`;
  const valueClass = `stat-card__value${c.best ? " stat-card__value--best" : ""}`;
  const subClass = `stat-card__sub${c.subBest ? " stat-card__sub--best" : ""}`;
  return `
    <div class="stat-card ${c.modifier}">
      <span class="${labelClass}">${c.label}</span>
      <span class="${valueClass}">${c.value}</span>
      ${c.sub !== undefined ? `<span class="${subClass}">${c.sub}</span>` : ""}
    </div>`;
}

function simpleRow(rowLabel: string, cards: Card[], extraClass = ""): string {
  const labelHtml = rowLabel ? `<span class="summary-row__label">${rowLabel}</span>` : "";
  return `<div class="summary-row ${extraClass}">
    ${labelHtml}
    ${cards.map(cardHtml).join("")}
  </div>`;
}

function recordsRow(rowLabel: string, cards: Card[]): string {
  const labelHtml = rowLabel ? `<span class="summary-row__label">${rowLabel}</span>` : "";
  return `<div class="summary-row summary-row--records">
    ${labelHtml}
    ${cards.map(cardHtml).join("")}
  </div>`;
}

/** Wrap two rows with a single spanning vertical label */
function pairedRows(label: string, rowA: string, rowB: string): string {
  return `<div class="summary-paired">
    <span class="summary-paired__label">${label}</span>
    <div class="summary-paired__rows">
      ${rowA}
      ${rowB}
    </div>
  </div>`;
}

export function renderSummaryBar(tally: Tally, el: HTMLElement): void {
  const {
    totalGames,
    wins,
    pureDraws,
    currentStreak,
    longestStreakWifey,
    longestStreakHubby,
    maxTotalWifey,
    maxTotalHubby,
    maxMarginWifey,
    maxMarginHubby,
    minWinningTotalWifey,
    minWinningTotalHubby,
    avgMarginWifey,
    avgMarginHubby,
    maxCumulativeWinsWifey,
    maxCumulativeWinsHubby,
    maxCumulativeMarginWifey,
    maxCumulativeMarginHubby,
    maxScoreByCategory,
    avgScoreByCategory,
    universalCategories,
    drawSummary,
  } = tally;

  const currentStreakMod =
    currentStreak.player === "wifey"
      ? "stat-card--wifey"
      : currentStreak.player === "hubby"
        ? "stat-card--hubby"
        : "stat-card--neutral";

  const tbWifey = drawSummary.tiebreakerWins.wifey;
  const tbHubby = drawSummary.tiebreakerWins.hubby;

  // ── Row 1: Current ──────────────────────────────────────
  const row1 = simpleRow("Current", [
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
    {
      label: "Current Streak",
      value: streakLabel(currentStreak.length),
      sub: streakSub(currentStreak.player, currentStreak.length),
      modifier: currentStreakMod,
    },
  ], "summary-row--current");

  // ── Records rows — 8 columns, tied values both get asterisk ─
  const recordLabels = ["Max Score", "Max Margin", "Min Win Score", "Avg Score", "Avg Margin", "Best Streak", "Peak Win Lead", "Peak Score Lead"];

  // For min-win: lower is better, so "best" means equal OR lower
  const wifeyMaxScoreBest    = maxTotalWifey >= maxTotalHubby;
  const hubbyMaxScoreBest    = maxTotalHubby >= maxTotalWifey;
  const wifeyMaxMarginBest   = maxMarginWifey >= maxMarginHubby;
  const hubbyMaxMarginBest   = maxMarginHubby >= maxMarginWifey;
  const wifeyMinWinBest      = minWinningTotalWifey <= minWinningTotalHubby;
  const hubbyMinWinBest      = minWinningTotalHubby <= minWinningTotalWifey;

  const avgOverallWifey = avgScoreByCategory[0]?.wifey ?? 0;
  const avgOverallHubby = avgScoreByCategory[0]?.hubby ?? 0;
  const wifeyAvgScoreBest    = avgOverallWifey >= avgOverallHubby;
  const hubbyAvgScoreBest    = avgOverallHubby >= avgOverallWifey;
  const wifeyAvgMarginBest   = avgMarginWifey >= avgMarginHubby;
  const hubbyAvgMarginBest   = avgMarginHubby >= avgMarginWifey;
  const wifeyStreakBest      = longestStreakWifey.length >= longestStreakHubby.length;
  const hubbyStreakBest      = longestStreakHubby.length >= longestStreakWifey.length;
  const wifeyPeakWinsBest    = maxCumulativeWinsWifey >= maxCumulativeWinsHubby;
  const hubbyPeakWinsBest    = maxCumulativeWinsHubby >= maxCumulativeWinsWifey;
  const wifeyPeakMarginBest  = maxCumulativeMarginWifey >= maxCumulativeMarginHubby;
  const hubbyPeakMarginBest  = maxCumulativeMarginHubby >= maxCumulativeMarginWifey;

  const wifeyRecords: Card[] = [
    { label: recordLabels[0], value: String(maxTotalWifey), modifier: "stat-card--wifey", best: wifeyMaxScoreBest },
    { label: recordLabels[1], value: String(maxMarginWifey), modifier: "stat-card--wifey", best: wifeyMaxMarginBest },
    { label: recordLabels[2], value: String(minWinningTotalWifey || "—"), modifier: "stat-card--wifey", best: wifeyMinWinBest },
    { label: recordLabels[3], value: fmt2(avgOverallWifey), modifier: "stat-card--wifey", best: wifeyAvgScoreBest },
    { label: recordLabels[4], value: fmt2(avgMarginWifey), modifier: "stat-card--wifey", best: wifeyAvgMarginBest },
    { label: recordLabels[5], value: streakLabel(longestStreakWifey.length), modifier: "stat-card--wifey", best: wifeyStreakBest },
    { label: recordLabels[6], value: String(maxCumulativeWinsWifey), modifier: "stat-card--wifey", best: wifeyPeakWinsBest },
    { label: recordLabels[7], value: String(maxCumulativeMarginWifey), modifier: "stat-card--wifey", best: wifeyPeakMarginBest },
  ];

  const hubbyRecords: Card[] = [
    { label: recordLabels[0], value: String(maxTotalHubby), modifier: "stat-card--hubby", best: hubbyMaxScoreBest },
    { label: recordLabels[1], value: String(maxMarginHubby), modifier: "stat-card--hubby", best: hubbyMaxMarginBest },
    { label: recordLabels[2], value: String(minWinningTotalHubby || "—"), modifier: "stat-card--hubby", best: hubbyMinWinBest },
    { label: recordLabels[3], value: fmt2(avgOverallHubby), modifier: "stat-card--hubby", best: hubbyAvgScoreBest },
    { label: recordLabels[4], value: fmt2(avgMarginHubby), modifier: "stat-card--hubby", best: hubbyAvgMarginBest },
    { label: recordLabels[5], value: streakLabel(longestStreakHubby.length), modifier: "stat-card--hubby", best: hubbyStreakBest },
    { label: recordLabels[6], value: String(maxCumulativeWinsHubby), modifier: "stat-card--hubby", best: hubbyPeakWinsBest },
    { label: recordLabels[7], value: String(maxCumulativeMarginHubby), modifier: "stat-card--hubby", best: hubbyPeakMarginBest },
  ];

  const recordsWifeyRow = recordsRow("", wifeyRecords);
  const recordsHubbyRow = recordsRow("", hubbyRecords);

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
    );
  });

  const catWifeyRow = simpleRow("", wifeyCards, "summary-row--categories");
  const catHubbyRow = simpleRow("", hubbyCards, "summary-row--categories");

  el.innerHTML =
    row1 +
    `<div class="summary-section-gap"></div>` +
    pairedRows("Game Stats", recordsWifeyRow, recordsHubbyRow) +
    `<div class="summary-section-gap"></div>` +
    pairedRows("Categories", catWifeyRow, catHubbyRow);
}
