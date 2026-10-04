import type { Player } from "@/types/domain";
import type { RunningEntry, Streak } from "@/types/tally";

/** A single global metric: its signed value, who it favours, and the game it was last reached in. */
export interface GlobalMetric {
  /** Signed value — positive favours wifey, negative favours hubby (streaks are unsigned). */
  value: number;
  /** Leader/holder of the value; null when level. */
  holder: Player | null;
  /** Game in which the value was last attained; null for current values or empty history. */
  gameId: number | null;
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

/** Maps a signed value to its owner under the wifey-positive / hubby-negative convention. */
function holderOfSign(value: number): Player | null {
  if (value > 0) return "wifey";
  if (value < 0) return "hubby";
  return null;
}

/**
 * Finds a player's record for a signed series: the highest value for wifey, the
 * lowest for hubby, and the *last* game at which that exact value was held
 * (consistent with the existing streak-record behaviour).
 *
 * A player who never led the series gets a zero value with no game to link.
 */
function playerExtreme(
  history: RunningEntry[],
  select: (entry: RunningEntry) => number,
  player: Player,
): GlobalMetric {
  const sign = player === "wifey" ? 1 : -1;
  const best = Math.max(0, ...history.map((e) => sign * select(e)));
  if (best === 0) return { value: 0, holder: player, gameId: null };

  const hits = history.filter((e) => sign * select(e) === best);
  return { value: sign * best, holder: player, gameId: hits[hits.length - 1].gameId };
}

/** Longest streak a player has achieved, and the last game that reached that length. */
function playerStreakRecord(history: RunningEntry[], player: Player): GlobalMetric {
  const own = history.filter((e) => e.runningStreak.player === player);
  const longest = Math.max(0, ...own.map((e) => e.runningStreak.length));
  if (longest === 0) return { value: 0, holder: player, gameId: null };

  const hits = own.filter((e) => e.runningStreak.length === longest);
  return { value: longest, holder: player, gameId: hits[hits.length - 1].gameId };
}

/**
 * Derives the "Globals" summary from the running history: current tally, streak
 * and cumulative margin, plus each player's all-time extreme of the same.
 *
 * Pure — relies solely on `runningHistory`, so it stays consistent with the charts.
 */
export function computeGlobalStats(
  history: RunningEntry[],
  currentStreak: Streak,
): GlobalStats {
  const tallyOf = (e: RunningEntry): number => e.cumulativeWinsWifey - e.cumulativeWinsHubby;
  const marginOf = (e: RunningEntry): number => e.cumulativeMargin;
  const latest = history[history.length - 1];

  const currentTally = latest ? tallyOf(latest) : 0;
  const currentMargin = latest ? marginOf(latest) : 0;

  return {
    currentTally: { value: currentTally, holder: holderOfSign(currentTally), gameId: null },
    currentStreak: { value: currentStreak.length, holder: currentStreak.player, gameId: null },
    currentMargin: { value: currentMargin, holder: holderOfSign(currentMargin), gameId: null },
    maxTally: {
      wifey: playerExtreme(history, tallyOf, "wifey"),
      hubby: playerExtreme(history, tallyOf, "hubby"),
    },
    maxStreak: {
      wifey: playerStreakRecord(history, "wifey"),
      hubby: playerStreakRecord(history, "hubby"),
    },
    maxMargin: {
      wifey: playerExtreme(history, marginOf, "wifey"),
      hubby: playerExtreme(history, marginOf, "hubby"),
    },
  };
}
