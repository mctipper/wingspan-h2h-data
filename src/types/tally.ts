import type { Player } from "./domain";

export interface Streak {
  player: Player | null;
  length: number;
}

export interface RunningEntry {
  gameId: number;
  cumulativeWinsWifey: number;
  cumulativeWinsHubby: number;
  /** Running sum of signed margins (positive = wifey ahead, negative = hubby ahead) */
  cumulativeMargin: number;
  /** Current streak at this point in history */
  runningStreak: Streak;
}

/**
 * Separate sub-object counting draw-related outcomes only.
 * These are tracked independently and do not affect streaks, margins, or win counts.
 */
export interface DrawSummary {
  /** Total games where scores were equal (includes tiebreaker results and pure draws) */
  totalDrawScores: number;
  /** Games where scores were equal and a tiebreaker produced a winner */
  tiebreakerWins: Record<Player, number>;
  /** Games where scores were equal and no tiebreaker — a pure draw */
  pureDraws: number;
}

export interface CategoryStat {
  category: string;
  wifey: number;
  hubby: number;
}

export interface Tally {
  totalGames: number;
  /** Win counts — tiebreaker wins are included here as regular wins */
  wins: Record<Player, number>;
  /** Pure draws only (no tiebreaker) */
  pureDraws: number;
  currentStreak: Streak;
  longestStreakWifey: Streak;
  longestStreakHubby: Streak;
  /** Average winning margin for normal wins (tiebreaker games excluded from average) */
  avgMarginWifey: number;
  avgMarginHubby: number;

  /** Max total score across all games */
  maxTotalWifey: number;
  maxTotalHubby: number;
  /** Max winning margin (normal wins only) */
  maxMarginWifey: number;
  maxMarginHubby: number;
  /** Min total score in a game that was won (normal wins only) */
  minWinningTotalWifey: number;
  minWinningTotalHubby: number;
  /** Peak cumulative win lead ever held */
  maxCumulativeWinsWifey: number;
  maxCumulativeWinsHubby: number;
  /** Peak cumulative score margin ever held */
  maxCumulativeMarginWifey: number;
  maxCumulativeMarginHubby: number;

  /** Max score per category (overall total first, then each category) */
  maxScoreByCategory: CategoryStat[];
  /** Average score per category (overall total first, then each category) */
  avgScoreByCategory: CategoryStat[];
  /** Categories present in every game (used to italicise partial categories) */
  universalCategories: Set<string>;

  /** One entry per game in chronological order, used for time-series charts */
  runningHistory: RunningEntry[];
  /** Draw-specific breakdown — tracked separately from main results */
  drawSummary: DrawSummary;
}