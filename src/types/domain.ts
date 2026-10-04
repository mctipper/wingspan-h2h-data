/** Canonical player order (wifey first, matching every table and chart). */
export const PLAYERS = ["wifey", "hubby"] as const;
export type Player = (typeof PLAYERS)[number];

export interface CategoryScore {
  category: string;
  hubby: number;
  wifey: number;
  winner: Player | "draw";
  /** Absolute difference between scores */
  margin: number;
}

export interface GameResult {
  gameId: number;
  categories: CategoryScore[];
  /** Sum of each player's category scores */
  totals: Record<Player, number>;
  /**
   * The game winner.
   * - "hubby" | "wifey" — won by score, or won via tiebreaker (scores were equal)
   * - "draw"            — pure draw, scores equal and no tiebreaker
   */
  winner: Player | "draw";
  /**
   * True when scores were equal and a tiebreaker decided the winner.
   * Always false for pure draws and normal wins.
   */
  tiebreaker: boolean;
  /**
   * Signed margin: positive = wifey ahead, negative = hubby ahead, 0 = equal scores.
   * Based on raw totals only — does not reflect tiebreaker.
   */
  margin: number;
  /**
   * True when the winner also won every category. Always false for pure draws
   * (and, necessarily, tiebreaker wins — equal totals preclude a sweep).
   */
  perfect: boolean;
}