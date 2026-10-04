import { PLAYERS, type GameResult, type Player } from "@/types/domain";
import type { CategoryRecord, Metric, PlayerTally, RunningEntry, Streak, Tally } from "@/types/tally";

/** Running totals for one player in one category. */
interface CategoryAccumulator {
  sum: number;
  max: Metric;
}

/** One player's running state during the aggregation pass. */
interface PlayerAccumulator {
  wins: number;
  tiebreakerWins: number;
  perfectGames: number;
  scoreSum: number;
  /** Normal (non-tiebreaker) wins — the denominator for average margin */
  normalWins: number;
  normalMarginSum: number;
  maxMargin: Metric;
  maxTotal: Metric;
  minWinningTotal: Metric;
  categories: Map<string, CategoryAccumulator>;
}

/** Fresh accumulator; `minWinningTotal` starts at Infinity so the first win always records. */
function newPlayerAccumulator(): PlayerAccumulator {
  return {
    wins: 0,
    tiebreakerWins: 0,
    perfectGames: 0,
    scoreSum: 0,
    normalWins: 0,
    normalMarginSum: 0,
    maxMargin: { value: 0, gameId: null },
    maxTotal: { value: 0, gameId: null },
    minWinningTotal: { value: Infinity, gameId: null },
    categories: new Map(),
  };
}

/** Raises `metric` to `value` if strictly greater, so ties keep the earliest game. */
function recordMax(metric: Metric, value: number, gameId: number): void {
  if (value > metric.value) {
    metric.value = value;
    metric.gameId = gameId;
  }
}

/** Lowers `metric` to `value` if strictly smaller, so ties keep the earliest game. */
function recordMin(metric: Metric, value: number, gameId: number): void {
  if (value < metric.value) {
    metric.value = value;
    metric.gameId = gameId;
  }
}

/** Mean that is 0 rather than NaN for an empty set. */
function mean(sum: number, count: number): number {
  return count > 0 ? sum / count : 0;
}

/**
 * Aggregates parsed games into the head-to-head tally in a single pass.
 *
 * Expects `results` in chronological (game_id) order — streaks and the running
 * history depend on it. Pure: never mutates the input results.
 */
export function buildTally(results: GameResult[]): Tally {
  const acc: Record<Player, PlayerAccumulator> = {
    wifey: newPlayerAccumulator(),
    hubby: newPlayerAccumulator(),
  };
  // Shared by both players: a category is always scored by both or neither
  const categoryGameCounts = new Map<string, number>();

  let pureDraws = 0;
  let cumulativeMargin = 0;
  let currentStreak: Streak = { player: null, length: 0 };
  const runningHistory: RunningEntry[] = [];

  for (const { gameId, categories, totals, winner, tiebreaker, margin, perfect } of results) {
    // ── Scores: every game counts towards both players' averages and maxima ──
    for (const player of PLAYERS) {
      const p = acc[player];
      p.scoreSum += totals[player];
      recordMax(p.maxTotal, totals[player], gameId);

      for (const cat of categories) {
        let c = p.categories.get(cat.category);
        if (!c) {
          c = { sum: 0, max: { value: 0, gameId: null } };
          p.categories.set(cat.category, c);
        }
        c.sum += cat[player];
        recordMax(c.max, cat[player], gameId);
      }
    }
    for (const cat of categories) {
      categoryGameCounts.set(cat.category, (categoryGameCounts.get(cat.category) ?? 0) + 1);
    }

    // ── Outcome: wins, margins and streaks ──
    if (winner === "draw") {
      // Pure draw — game played, streak broken, not counted as a win
      pureDraws++;
      currentStreak = { player: null, length: 0 };
    } else {
      const p = acc[winner];
      p.wins++;
      if (perfect) p.perfectGames++;
      if (tiebreaker) {
        p.tiebreakerWins++;
      } else {
        const winningMargin = Math.abs(margin);
        p.normalWins++;
        p.normalMarginSum += winningMargin;
        recordMax(p.maxMargin, winningMargin, gameId);
        recordMin(p.minWinningTotal, totals[winner], gameId);
      }

      currentStreak = currentStreak.player === winner
        ? { player: winner, length: currentStreak.length + 1 }
        : { player: winner, length: 1 };
    }

    cumulativeMargin += margin;
    runningHistory.push({
      gameId,
      cumulativeWins: { wifey: acc.wifey.wins, hubby: acc.hubby.wins },
      cumulativeMargin,
      runningStreak: { ...currentStreak },
    });
  }

  // ── Finalise ──
  const totalGames = results.length;
  const categories = [...categoryGameCounts.keys()];
  const universalCategories = new Set(categories.filter((cat) => categoryGameCounts.get(cat) === totalGames));

  /** Converts a player's accumulator into its public, immutable-by-convention shape. */
  const finalise = (p: PlayerAccumulator): PlayerTally => ({
    wins: p.wins,
    tiebreakerWins: p.tiebreakerWins,
    perfectGames: p.perfectGames,
    avgScore: mean(p.scoreSum, totalGames),
    avgMargin: mean(p.normalMarginSum, p.normalWins),
    maxMargin: p.maxMargin,
    maxTotal: p.maxTotal,
    minWinningTotal: isFinite(p.minWinningTotal.value) ? p.minWinningTotal : { value: 0, gameId: null },
    categories: Object.fromEntries(
      categories.map((cat): [string, CategoryRecord] => {
        const c = p.categories.get(cat)!;
        return [cat, { avg: mean(c.sum, categoryGameCounts.get(cat)!), max: c.max }];
      }),
    ),
  });

  return {
    totalGames,
    pureDraws,
    players: { wifey: finalise(acc.wifey), hubby: finalise(acc.hubby) },
    categories,
    universalCategories,
    currentStreak,
    runningHistory,
  };
}
