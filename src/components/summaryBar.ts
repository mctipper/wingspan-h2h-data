import type { Tally } from "@/types/tally";
import type { Player } from "@/types/domain";
import { getAnalysisUrl } from "@/utils/urls";
import { computeGlobalStats } from "@/data/globals";
import type { GlobalMetric } from "@/data/globals";

function fmt2(n: number): string {
  return n.toFixed(2);
}

function fmtInt(n: number): string {
  return Number.isInteger(n) ? String(n) : n.toFixed(1);
}

/** The other player — the comparison target for "best" markers. */
function opponentOf(player: Player): Player {
  return player === "wifey" ? "hubby" : "wifey";
}

function streakLabel(length: number): string {
  return length === 0 ? "—" : String(length);
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
  /** Extra class naming the card's grid area (used by the Overall block's explicit placement) */
  area?: string;
  best?: boolean;
  labelItalic?: boolean;
  gameId?: number | null;
  subGameId?: number | null;
  tooltip?: string;
};

function cardHtml(c: Card): string {
  const labelClass = `stat-card__label${c.labelItalic ? " stat-card__label--italic" : ""}${c.tooltip ? " stat-card__label--tooltip" : ""}`;
  const valueClass = `stat-card__value${c.best ? " stat-card__value--best" : ""}`;
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
    <div class="stat-card ${c.modifier}${c.area ? ` ${c.area}` : ""}">
      ${labelHtml}
      <span class="${valueClass}">${valueHtml}</span>
      ${c.sub !== undefined ? `<span class="stat-card__sub">${subHtml}</span>` : ""}
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
function playerLine(player: Player | null, row: string): string {
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

/**
 * Overall: a single grid (placed by CSS area classes) holding the totals, two player
 * subheaders and their cards — flat so desktop and mobile can re-arrange it freely.
 */
function overallBlock(cards: Card[]): string {
  return `<div class="summary-paired summary-paired--overall">
    <span class="summary-paired__label">Overall</span>
    <div class="overall-grid">
      <span class="summary-paired__subhead summary-paired__subhead--wifey ov-head-wifey">Wifey</span>
      <span class="summary-paired__subhead summary-paired__subhead--hubby ov-head-hubby">Hubby</span>
      ${cards.map(cardHtml).join("")}
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

/**
 * Renders the three summary blocks (Overall, Categories, Globals) into `el`,
 * replacing its contents. Every per-player card is built from the player's own
 * `PlayerTally` compared against the opponent's, so the asterisk ("best") logic
 * is symmetric by construction.
 */
export function renderSummaryBar(tally: Tally, el: HTMLElement): void {
  const { totalGames, pureDraws, players, categories, currentStreak, runningHistory, universalCategories } = tally;

  // ── Overall: Total Games (with pure draws as subtext) beside a wifey and a hubby line of five cards ──
  const perfectsTooltip = "Games where a player won every single category";
  const tbSub = (n: number): string | undefined =>
    n > 0 ? `${n} tiebreaker${n !== 1 ? "s" : ""}` : undefined;

  /** A player's cards; tied values both earn the asterisk. The player's subheader names them. */
  const overallPlayerCards = (player: Player): Card[] => {
    const mine = players[player];
    const theirs = players[opponentOf(player)];
    const modifier = `stat-card--${player}`;
    const slot = (name: string): string => `ov-${player}-${name}`;
    return [
      { label: "Wins", value: String(mine.wins), sub: tbSub(mine.tiebreakerWins), modifier, area: slot("wins") },
      { label: "Avg Score", value: fmt2(mine.avgScore), modifier, area: slot("score"), best: mine.avgScore >= theirs.avgScore },
      { label: "Avg Margin", value: fmt2(mine.avgMargin), modifier, area: slot("margin"), best: mine.avgMargin >= theirs.avgMargin },
      {
        label: "Max Margin",
        value: String(mine.maxMargin.value),
        modifier,
        area: slot("maxmargin"),
        best: mine.maxMargin.value >= theirs.maxMargin.value,
        gameId: mine.maxMargin.gameId,
      },
      {
        label: "Perfects",
        value: String(mine.perfectGames),
        modifier,
        area: slot("perfects"),
        best: mine.perfectGames >= theirs.perfectGames,
        tooltip: perfectsTooltip,
      },
    ];
  };

  const overallCards: Card[] = [
    {
      label: "Total Games",
      value: String(totalGames),
      sub: `${pureDraws} pure draw${pureDraws !== 1 ? "s" : ""}`,
      modifier: "stat-card--neutral",
      area: "ov-total",
    },
    ...overallPlayerCards("wifey"),
    ...overallPlayerCards("hubby"),
  ];

  // ── Category rows — avg as main value, max as subtext ────
  /** One card per category for `player`, in first-appearance order. */
  const categoryCards = (player: Player): Card[] =>
    categories.map((category) => {
      const mine = players[player].categories[category]!;
      const theirs = players[opponentOf(player)].categories[category]!;
      return {
        label: category,
        value: fmt2(mine.avg),
        best: mine.avg >= theirs.avg,
        // The max's "best" marker is an inline asterisk, not a class
        sub: `max ${fmtInt(mine.max.value)}${mine.max.value >= theirs.max.value ? "*" : ""}`,
        modifier: `stat-card--${player}`,
        labelItalic: !universalCategories.has(category),
        subGameId: mine.max.gameId,
      };
    });

  const catWifeyRow = simpleRow("", categoryCards("wifey"), "summary-row--categories");
  const catHubbyRow = simpleRow("", categoryCards("hubby"), "summary-row--categories");

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
  const maxCards = (player: Player): Card[] => [
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
    overallBlock(overallCards) +
    `<div class="summary-section-gap"></div>` +
    pairedRows("Categories", catWifeyRow, catHubbyRow, "", true) +
    `<div class="summary-section-gap"></div>` +
    globalsBlock(globalsCurrentRow, globalsWifeyRow, globalsHubbyRow);
}
