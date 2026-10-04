import type { RawGame } from "@/types/raw";
import type { CategoryScore, GameResult } from "@/types/domain";

/**
 * Derives the full result of a single game from its raw scores.
 *
 * Assumes input has passed `validateGameInput` (both players score the same
 * categories, scores are numeric) — validation lives at the load/API seams, not
 * here. Self-contained: everything on the result, including `perfect`, depends
 * only on this game, so callers need no further processing. Pure.
 *
 * @throws if scores are tied but `drawResult` is absent — without it there is no
 * outcome to report, so this is a broken invariant rather than a validation rule.
 */
export function parseGame(raw: RawGame): GameResult {
  const { hubby, wifey } = raw.players;

  const categories: CategoryScore[] = Object.keys(hubby).map((category) => {
    const h = hubby[category];
    const w = wifey[category];
    const winner: CategoryScore["winner"] = h > w ? "hubby" : w > h ? "wifey" : "draw";
    return { category, hubby: h, wifey: w, winner, margin: Math.abs(h - w) };
  });

  const totalHubby = categories.reduce((sum, c) => sum + c.hubby, 0);
  const totalWifey = categories.reduce((sum, c) => sum + c.wifey, 0);
  const margin = totalWifey - totalHubby;

  let winner: GameResult["winner"];
  let tiebreaker = false;
  if (margin !== 0) {
    winner = margin > 0 ? "wifey" : "hubby";
  } else if (!raw.drawResult) {
    throw new Error(`Game ${raw.game_id} has equal scores but no drawResult field`);
  } else if (raw.drawResult === "draw") {
    winner = "draw";
  } else {
    winner = raw.drawResult;
    tiebreaker = true;
  }

  // Unreachable for tiebreaker wins (equal totals preclude sweeping every category), so no special case
  const perfect = winner !== "draw" && categories.every((c) => c.winner === winner);

  return {
    gameId: raw.game_id,
    categories,
    totals: { wifey: totalWifey, hubby: totalHubby },
    winner,
    tiebreaker,
    margin,
    perfect,
  };
}
