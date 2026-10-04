import type { GameResult } from "@/types/domain";
import type { CategoryStat, DrawSummary, RunningEntry, Streak, Tally } from "@/types/tally";

/** Per-category running sums and maxima, keyed by category name during aggregation. */
interface CategoryAccumulator {
  sumWifey: number;
  sumHubby: number;
  maxWifey: number;
  maxHubby: number;
  count: number;
  maxWifeyGameId: number | null;
  maxHubbyGameId: number | null;
}

/**
 * Aggregates parsed games into the head-to-head tally in a single pass.
 *
 * Expects `results` in chronological (game_id) order — streaks and the running
 * history depend on it. Pure: never mutates the input results.
 */
export function buildTally(results: GameResult[]): Tally {
  let winsWifey = 0;
  let winsHubby = 0;
  let perfectGamesWifey = 0;
  let perfectGamesHubby = 0;
  let pureDraws = 0;
  let cumulativeMargin = 0;

  // Draw summary tracked separately
  const drawSummary: DrawSummary = {
    totalDrawScores: 0,
    tiebreakerWins: { wifey: 0, hubby: 0 },
    pureDraws: 0,
  };

  // For average margin — only normal (non-tiebreaker) wins
  let totalMarginWifey = 0;
  let totalMarginHubby = 0;
  let normalWinsWifey = 0;
  let normalWinsHubby = 0;

  // Max/min score tracking with gameIds
  let maxTotalWifey = 0;
  let maxTotalWifeyGameId: number | null = null;
  let maxTotalHubby = 0;
  let maxTotalHubbyGameId: number | null = null;
  let maxMarginWifey = 0;
  let maxMarginWifeyGameId: number | null = null;
  let maxMarginHubby = 0;
  let maxMarginHubbyGameId: number | null = null;
  let minWinningTotalWifey = Infinity;
  let minWinningTotalWifeyGameId: number | null = null;
  let minWinningTotalHubby = Infinity;
  let minWinningTotalHubbyGameId: number | null = null;

  const catAccum = new Map<string, CategoryAccumulator>();

  let currentStreak: Streak = { player: null, length: 0 };

  const runningHistory: RunningEntry[] = [];

  for (const result of results) {
    const { winner, tiebreaker, margin, totalWifey, totalHubby, categories, gameId, perfect } = result;

    // Max totals
    if (totalWifey > maxTotalWifey) {
      maxTotalWifey = totalWifey;
      maxTotalWifeyGameId = gameId;
    }
    if (totalHubby > maxTotalHubby) {
      maxTotalHubby = totalHubby;
      maxTotalHubbyGameId = gameId;
    }

    // Max margin and min winning total — normal wins only
    if (!tiebreaker && winner === "wifey") {
      const m = Math.abs(margin);
      if (m > maxMarginWifey) {
        maxMarginWifey = m;
        maxMarginWifeyGameId = gameId;
      }
      if (totalWifey < minWinningTotalWifey) {
        minWinningTotalWifey = totalWifey;
        minWinningTotalWifeyGameId = gameId;
      }
    }
    if (!tiebreaker && winner === "hubby") {
      const m = Math.abs(margin);
      if (m > maxMarginHubby) {
        maxMarginHubby = m;
        maxMarginHubbyGameId = gameId;
      }
      if (totalHubby < minWinningTotalHubby) {
        minWinningTotalHubby = totalHubby;
        minWinningTotalHubbyGameId = gameId;
      }
    }

    // Per-category accumulation
    for (const cat of categories) {
      let acc = catAccum.get(cat.category);
      if (!acc) {
        acc = { sumWifey: 0, sumHubby: 0, maxWifey: 0, maxHubby: 0, count: 0, maxWifeyGameId: null, maxHubbyGameId: null };
        catAccum.set(cat.category, acc);
      }
      acc.sumWifey += cat.wifey;
      acc.sumHubby += cat.hubby;
      if (cat.wifey > acc.maxWifey) {
        acc.maxWifey = cat.wifey;
        acc.maxWifeyGameId = gameId;
      }
      if (cat.hubby > acc.maxHubby) {
        acc.maxHubby = cat.hubby;
        acc.maxHubbyGameId = gameId;
      }
      acc.count++;
    }

    if (winner === "draw") {
      // Pure draw — game played, streak broken, not counted as a win
      pureDraws++;
      drawSummary.totalDrawScores++;
      drawSummary.pureDraws++;
      currentStreak = { player: null, length: 0 };
    } else {
      // Win (normal or tiebreaker) — counts as a regular win for streaks and totals
      if (winner === "wifey") {
        winsWifey++;
        if (perfect) perfectGamesWifey++;
        if (tiebreaker) {
          drawSummary.totalDrawScores++;
          drawSummary.tiebreakerWins.wifey++;
        } else {
          normalWinsWifey++;
          totalMarginWifey += Math.abs(margin);
        }
      } else {
        winsHubby++;
        if (perfect) perfectGamesHubby++;
        if (tiebreaker) {
          drawSummary.totalDrawScores++;
          drawSummary.tiebreakerWins.hubby++;
        } else {
          normalWinsHubby++;
          totalMarginHubby += Math.abs(margin);
        }
      }

      currentStreak = currentStreak.player === winner
        ? { player: winner, length: currentStreak.length + 1 }
        : { player: winner, length: 1 };
    }

    cumulativeMargin += margin;

    runningHistory.push({
      gameId,
      cumulativeWinsWifey: winsWifey,
      cumulativeWinsHubby: winsHubby,
      cumulativeMargin,
      runningStreak: { ...currentStreak },
    });
  }

  // Build per-category stat arrays (overall total first, then each category)
  const allCategories = [...catAccum.keys()];
  const n = results.length;

  // Categories present in every game
  const universalCategories = new Set(
    allCategories.filter((cat) => catAccum.get(cat)!.count === n)
  );

  const overallMaxStat: CategoryStat = { category: "Overall", wifey: maxTotalWifey, hubby: maxTotalHubby };
  const overallAvgStat: CategoryStat = {
    category: "Overall",
    wifey: n > 0 ? results.reduce((s, r) => s + r.totalWifey, 0) / n : 0,
    hubby: n > 0 ? results.reduce((s, r) => s + r.totalHubby, 0) / n : 0,
  };

  const maxScoreByCategory: CategoryStat[] = [overallMaxStat, ...allCategories.map((cat) => {
    const acc = catAccum.get(cat)!;
    return { category: cat, wifey: acc.maxWifey, hubby: acc.maxHubby, maxWifeyGameId: acc.maxWifeyGameId, maxHubbyGameId: acc.maxHubbyGameId };
  })];

  const avgScoreByCategory: CategoryStat[] = [overallAvgStat, ...allCategories.map((cat) => {
    const acc = catAccum.get(cat)!;
    return { category: cat, wifey: acc.count > 0 ? acc.sumWifey / acc.count : 0, hubby: acc.count > 0 ? acc.sumHubby / acc.count : 0 };
  })];

  return {
    totalGames: n,
    wins: { wifey: winsWifey, hubby: winsHubby },
    perfectGames: { wifey: perfectGamesWifey, hubby: perfectGamesHubby },
    pureDraws,
    currentStreak,
    avgMarginWifey: normalWinsWifey > 0 ? totalMarginWifey / normalWinsWifey : 0,
    avgMarginHubby: normalWinsHubby > 0 ? totalMarginHubby / normalWinsHubby : 0,
    maxTotalWifey,
    maxTotalWifeyGameId,
    maxTotalHubby,
    maxTotalHubbyGameId,
    maxMarginWifey,
    maxMarginWifeyGameId,
    maxMarginHubby,
    maxMarginHubbyGameId,
    minWinningTotalWifey: isFinite(minWinningTotalWifey) ? minWinningTotalWifey : 0,
    minWinningTotalWifeyGameId,
    minWinningTotalHubby: isFinite(minWinningTotalHubby) ? minWinningTotalHubby : 0,
    minWinningTotalHubbyGameId,
    maxScoreByCategory,
    avgScoreByCategory,
    universalCategories,
    runningHistory,
    drawSummary,
  };
}
