export type Player = "hubby" | "wifey";

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
  totalHubby: number;
  totalWifey: number;
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
   * True when the game was a perfect game (winner won every category).
   * Always false for draws and normal wins.
   */
  perfect: boolean;
}