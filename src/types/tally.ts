import type { Player } from "@/types/domain";

export interface Streak {
  player: Player | null;
  length: number;
}

/** A record value and the game it was first attained in (null when never attained). */
export interface Metric {
  value: number;
  gameId: number | null;
}

export interface RunningEntry {
  gameId: number;
  /** Wins (including tiebreakers) per player up to and including this game */
  cumulativeWins: Record<Player, number>;
  /** Running sum of signed margins (positive = wifey ahead, negative = hubby ahead) */
  cumulativeMargin: number;
  /** Current streak at this point in history */
  runningStreak: Streak;
}

/**
 * A global metric: a `Metric` plus who holds it. Unlike tally metrics, `value`
 * is signed (positive favours wifey, negative hubby; streaks are unsigned) and
 * `gameId` is the game it was *last* attained in — null for current values.
 */
export interface GlobalMetric extends Metric {
  /** Leader/holder of the value; null when level. */
  holder: Player | null;
}

/** A record held separately by each player. */
export type PlayerRecords = Record<Player, GlobalMetric>;

export interface GlobalStats {
  currentTally: GlobalMetric;
  currentStreak: GlobalMetric;
  currentMargin: GlobalMetric;
  maxTally: PlayerRecords;
  maxStreak: PlayerRecords;
  maxMargin: PlayerRecords;
}

/** One player's record in one category, over games that included it. */
export interface CategoryRecord {
  avg: number;
  max: Metric;
}

/** Everything the tally knows about a single player. */
export interface PlayerTally {
  /** Includes tiebreaker wins */
  wins: number;
  /** Wins decided by tiebreaker after equal scores (a subset of `wins`) */
  tiebreakerWins: number;
  /** Games where the player won every category */
  perfectGames: number;
  /** Mean total score across all games */
  avgScore: number;
  /** Mean winning margin — normal wins only (tiebreakers have no margin) */
  avgMargin: number;
  /** Largest winning margin — normal wins only */
  maxMargin: Metric;
  /** Highest total score in any game */
  maxTotal: Metric;
  /** Keyed by category name; iterate via `Tally.categories` for a stable order */
  categories: Record<string, CategoryRecord>;
}

export interface Tally {
  totalGames: number;
  /** Equal scores with no tiebreaker; these break streaks but count as nobody's win */
  pureDraws: number;
  players: Record<Player, PlayerTally>;
  /** Every category seen, in order of first appearance */
  categories: string[];
  /** Categories present in every game (used to italicise partial categories) */
  universalCategories: Set<string>;
  /** Current standings and all-time records, derived from `runningHistory` */
  globals: GlobalStats;
  /** One entry per game in chronological order, used for time-series charts */
  runningHistory: RunningEntry[];
}
