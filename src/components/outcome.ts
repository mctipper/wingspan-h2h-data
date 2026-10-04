/**
 * Presentation vocabulary for players and outcomes — the one place that maps
 * domain values to display names and CSS modifier classes, so tables, cards
 * and the analysis view cannot drift apart.
 */
import type { Player } from "@/types/domain";

/** Who won something: a game, a category, or nobody. */
export type Outcome = Player | "draw";

export const PLAYER_LABEL: Record<Player, string> = {
  wifey: "Wifey",
  hubby: "Hubby",
};

export interface OutcomeStyle {
  /** Display name: "Wifey" | "Hubby" | "Draw" */
  label: string;
  /** Text-colour modifier for the winner cell: `winner--{outcome}` */
  winnerClass: string;
  /** Row-tint modifier: `row--{outcome}`, or the lighter `row--tiebreaker-{player}` */
  rowClass: string;
}

/**
 * Display name and CSS modifiers for an outcome.
 *
 * `tiebreaker` only affects the row tint (a lighter shade for wins decided
 * after equal scores); it is ignored for draws, which have no tiebreaker.
 */
export function outcomeStyle(outcome: Outcome, tiebreaker = false): OutcomeStyle {
  if (outcome === "draw") {
    return { label: "Draw", winnerClass: "winner--draw", rowClass: "row--draw" };
  }
  return {
    label: PLAYER_LABEL[outcome],
    winnerClass: `winner--${outcome}`,
    rowClass: tiebreaker ? `row--tiebreaker-${outcome}` : `row--${outcome}`,
  };
}
