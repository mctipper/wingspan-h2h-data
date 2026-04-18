import type { RawGame, RawGameData } from "@/types/raw";
import type { CategoryScore, GameResult, Player } from "@/types/domain";
import type { CategoryStat, DrawSummary, RunningEntry, Streak, Tally } from "@/types/tally";

export function parseGame(raw: RawGame): GameResult {
  const { hubby, wifey } = raw.players;

  // Validate categories match between both players
  const hubbyKeys = new Set(Object.keys(hubby));
  const wifeyKeys = new Set(Object.keys(wifey));
  const missingFromHubby = [...wifeyKeys].filter((k) => !hubbyKeys.has(k));
  const missingFromWifey = [...hubbyKeys].filter((k) => !wifeyKeys.has(k));

  if (missingFromHubby.length > 0 || missingFromWifey.length > 0) {
    const msgs: string[] = [];
    if (missingFromHubby.length > 0)
      msgs.push(`missing from hubby: ${missingFromHubby.join(", ")}`);
    if (missingFromWifey.length > 0)
      msgs.push(`missing from wifey: ${missingFromWifey.join(", ")}`);
    throw new Error(
      `Game ${raw.game_id} has mismatched categories — ${msgs.join("; ")}`
    );
  }

  const categories: CategoryScore[] = Object.keys(hubby).map((category) => {
    const h = hubby[category];
    const w = wifey[category];
    const margin = Math.abs(h - w);
    const winner: CategoryScore["winner"] =
      h > w ? "hubby" : w > h ? "wifey" : "draw";
    return { category, hubby: h, wifey: w, winner, margin };
  });

  const totalHubby = categories.reduce((sum, c) => sum + c.hubby, 0);
  const totalWifey = categories.reduce((sum, c) => sum + c.wifey, 0);
  const rawMargin = totalWifey - totalHubby;

  let winner: GameResult["winner"];
  let tiebreaker = false;

  if (rawMargin !== 0) {
    // Normal result — scores differ
    winner = rawMargin > 0 ? "wifey" : "hubby";
  } else {
    // Scores are equal — drawResult determines outcome
    if (!raw.drawResult) {
      throw new Error(
        `Game ${raw.game_id} has equal scores but no drawResult field`
      );
    }
    if (raw.drawResult === "draw") {
      winner = "draw";
    } else {
      winner = raw.drawResult; // "hubby" or "wifey"
      tiebreaker = true;
    }
  }

  return {
    gameId: raw.game_id,
    categories,
    totalHubby,
    totalWifey,
    winner,
    tiebreaker,
    margin: rawMargin,
  };
}

export function buildTally(results: GameResult[]): Tally {
  let winsWifey = 0;
  let winsHubby = 0;
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

  // Per-category accumulators: category -> { sumWifey, sumHubby, maxWifey, maxHubby, count }
  const catAccum = new Map<string, { sumWifey: number; sumHubby: number; maxWifey: number; maxHubby: number; count: number }>();

  let currentStreak: Streak = { player: null, length: 0 };
  let longestStreakWifey: Streak = { player: "wifey", length: 0 };
  let longestStreakHubby: Streak = { player: "hubby", length: 0 };

  const runningHistory: RunningEntry[] = [];

  for (const result of results) {
    const { winner, tiebreaker, margin, totalWifey, totalHubby, categories, gameId } = result;

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
        acc = { sumWifey: 0, sumHubby: 0, maxWifey: 0, maxHubby: 0, count: 0 };
        catAccum.set(cat.category, acc);
      }
      acc.sumWifey += cat.wifey;
      acc.sumHubby += cat.hubby;
      if (cat.wifey > acc.maxWifey) acc.maxWifey = cat.wifey;
      if (cat.hubby > acc.maxHubby) acc.maxHubby = cat.hubby;
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
        if (tiebreaker) {
          drawSummary.totalDrawScores++;
          drawSummary.tiebreakerWins.wifey++;
        } else {
          normalWinsWifey++;
          totalMarginWifey += Math.abs(margin);
        }
      } else {
        winsHubby++;
        if (tiebreaker) {
          drawSummary.totalDrawScores++;
          drawSummary.tiebreakerWins.hubby++;
        } else {
          normalWinsHubby++;
          totalMarginHubby += Math.abs(margin);
        }
      }

      // Update streak
      if (currentStreak.player === winner) {
        currentStreak = { player: winner, length: currentStreak.length + 1 };
      } else {
        currentStreak = { player: winner, length: 1 };
      }

      if (winner === "wifey" && currentStreak.length > longestStreakWifey.length) {
        longestStreakWifey = { ...currentStreak };
      }
      if (winner === "hubby" && currentStreak.length > longestStreakHubby.length) {
        longestStreakHubby = { ...currentStreak };
      }
    }

    cumulativeMargin += margin;

    runningHistory.push({
      gameId: result.gameId,
      cumulativeWinsWifey: winsWifey,
      cumulativeWinsHubby: winsHubby,
      cumulativeMargin,
      runningStreak: { ...currentStreak },
    });
  }

  // Peak cumulative leads — derived from running history
  let maxCumulativeWinsWifey = 0;
  let maxCumulativeWinsHubby = 0;
  let maxCumulativeMarginWifey = 0;
  let maxCumulativeMarginHubby = 0;
  for (const e of runningHistory) {
    const winDiff = e.cumulativeWinsWifey - e.cumulativeWinsHubby;
    if (winDiff > maxCumulativeWinsWifey) maxCumulativeWinsWifey = winDiff;
    if (-winDiff > maxCumulativeWinsHubby) maxCumulativeWinsHubby = -winDiff;
    if (e.cumulativeMargin > maxCumulativeMarginWifey) maxCumulativeMarginWifey = e.cumulativeMargin;
    if (-e.cumulativeMargin > maxCumulativeMarginHubby) maxCumulativeMarginHubby = -e.cumulativeMargin;
  }

  // Find last gameId of longest streaks
  let longestStreakWifeyLastGameId: number | null = null;
  let longestStreakHubbyLastGameId: number | null = null;
  if (longestStreakWifey.length > 0) {
    for (let i = runningHistory.length - 1; i >= 0; i--) {
      if (runningHistory[i].runningStreak.player === "wifey" &&
          runningHistory[i].runningStreak.length === longestStreakWifey.length) {
        longestStreakWifeyLastGameId = runningHistory[i].gameId;
        break;
      }
    }
  }
  if (longestStreakHubby.length > 0) {
    for (let i = runningHistory.length - 1; i >= 0; i--) {
      if (runningHistory[i].runningStreak.player === "hubby" &&
          runningHistory[i].runningStreak.length === longestStreakHubby.length) {
        longestStreakHubbyLastGameId = runningHistory[i].gameId;
        break;
      }
    }
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
    return { category: cat, wifey: acc.maxWifey, hubby: acc.maxHubby };
  })];

  const avgScoreByCategory: CategoryStat[] = [overallAvgStat, ...allCategories.map((cat) => {
    const acc = catAccum.get(cat)!;
    return { category: cat, wifey: acc.count > 0 ? acc.sumWifey / acc.count : 0, hubby: acc.count > 0 ? acc.sumHubby / acc.count : 0 };
  })];

  return {
    totalGames: results.length,
    wins: { wifey: winsWifey, hubby: winsHubby },
    pureDraws,
    currentStreak,
    longestStreakWifey,
    longestStreakWifeyLastGameId,
    longestStreakHubby,
    longestStreakHubbyLastGameId,
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
    maxCumulativeWinsWifey,
    maxCumulativeWinsHubby,
    maxCumulativeMarginWifey,
    maxCumulativeMarginHubby,
    maxScoreByCategory,
    avgScoreByCategory,
    universalCategories,
    runningHistory,
    drawSummary,
  };
}

export function loadAll(raw: RawGameData): {
  results: GameResult[];
  tally: Tally;
} {
  const sorted = [...raw].sort((a, b) => a.game_id - b.game_id);
  const results = sorted.map(parseGame);
  const tally = buildTally(results);
  return { results, tally };
}

/**
 * Session-level cache for category averages by category signature.
 * Key: sorted category names joined by "|" (e.g., "Birds|Bonus Cards|Eggs|...")
 * Value: pre-calculated per-category averages for both players across all games
 */
const categoryAverageCache = new Map<
  string,
  {
    categories: string[];
    wifeyByCategory: Record<string, number>;
    hubbyByCategory: Record<string, number>;
    wifeyOverall: number;
    hubbyOverall: number;
  }
>();

/**
 * Calculate per-category averages across all games using the same logic as the main page.
 * Each category is averaged across all games that have that category, regardless of
 * whether other categories match. Results are cached by category signature.
 *
 * @param game - The reference game (category set is derived from this)
 * @param allGames - All games to analyze
 * @returns Per-category averages for wifey/hubby matching main page calculations
 */
export function calculateCategoryAverages(
  game: RawGame,
  allGames: RawGameData
): {
  categories: string[];
  wifeyByCategory: Record<string, number>;
  hubbyByCategory: Record<string, number>;
  wifeyOverall: number;
  hubbyOverall: number;
} {
  // Create category signature (sorted category names joined)
  const categories = Object.keys(game.players.hubby).sort();
  const categorySignature = categories.join("|");

  // Check cache first
  const cached = categoryAverageCache.get(categorySignature);
  if (cached) {
    return cached;
  }

  // Accumulate scores for each category across ALL games (matching main page logic)
  const catAccum = new Map<string, { sumWifey: number; sumHubby: number; count: number }>();

  allGames.forEach((g) => {
    Object.keys(g.players.wifey).forEach((cat) => {
      if (!catAccum.has(cat)) {
        catAccum.set(cat, { sumWifey: 0, sumHubby: 0, count: 0 });
      }
      const acc = catAccum.get(cat)!;
      acc.sumWifey += g.players.wifey[cat] ?? 0;
      acc.sumHubby += g.players.hubby[cat] ?? 0;
      acc.count += 1;
    });
  });

  // Calculate per-category averages
  const wifeyByCategory: Record<string, number> = {};
  const hubbyByCategory: Record<string, number> = {};

  categories.forEach((category) => {
    const acc = catAccum.get(category);
    if (acc) {
      wifeyByCategory[category] = acc.count > 0 ? acc.sumWifey / acc.count : 0;
      hubbyByCategory[category] = acc.count > 0 ? acc.sumHubby / acc.count : 0;
    } else {
      wifeyByCategory[category] = 0;
      hubbyByCategory[category] = 0;
    }
  });

  // Calculate overall averages (average of the per-category averages)
  const wifeyValues = categories.map((cat) => wifeyByCategory[cat]);
  const wifeyOverall =
    wifeyValues.length > 0
      ? wifeyValues.reduce((sum, avg) => sum + avg, 0) / wifeyValues.length
      : 0;

  const hubbyValues = categories.map((cat) => hubbyByCategory[cat]);
  const hubbyOverall =
    hubbyValues.length > 0
      ? hubbyValues.reduce((sum, avg) => sum + avg, 0) / hubbyValues.length
      : 0;

  const result = { categories, wifeyByCategory, hubbyByCategory, wifeyOverall, hubbyOverall };

  // Cache the result
  categoryAverageCache.set(categorySignature, result);

  return result;
}
