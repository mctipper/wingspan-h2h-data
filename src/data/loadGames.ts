import type { RawGame } from "@/types/raw";
import type { GameResult } from "@/types/domain";
import type { Tally } from "@/types/tally";
import { validateGameInput } from "@/validation/gameValidator";
import { parseGame } from "@/data/parseGame";
import { buildTally } from "@/data/tally";

export interface LoadedGames {
  /** Parsed games in ascending game_id order. */
  results: GameResult[];
  tally: Tally;
}

/**
 * Turns the raw games dataset into parsed results and the aggregate tally.
 *
 * This is the trust boundary for file-sourced data (games.json can be
 * hand-edited), so every game passes the same validator the API uses before it
 * is parsed — downstream modules may then assume well-formed input.
 * Sorts by game_id because the tally's streaks and running history are order-dependent.
 *
 * @throws on a non-array dataset, an invalid or duplicate game_id, or any game
 * failing validation — failing loudly beats rendering silently wrong stats.
 */
export function loadGames(raw: unknown): LoadedGames {
  if (!Array.isArray(raw)) {
    throw new Error("Games data must be an array");
  }

  const games = raw.map(toValidGame);
  assertUniqueIds(games);

  const results = [...games].sort((a, b) => a.game_id - b.game_id).map(parseGame);
  return { results, tally: buildTally(results) };
}

/** Validates one dataset entry, returning it in canonical form with its id reattached. */
function toValidGame(entry: unknown, index: number): RawGame {
  const gameId = (entry as { game_id?: unknown } | null)?.game_id;
  if (typeof gameId !== "number" || !Number.isInteger(gameId) || gameId < 1) {
    throw new Error(`Game at index ${index} has an invalid game_id: ${JSON.stringify(gameId)}`);
  }

  const result = validateGameInput(entry);
  if (!result.valid) {
    throw new Error(`Game ${gameId} is invalid — ${result.errors.map((e) => e.message).join("; ")}`);
  }
  return { game_id: gameId, ...result.game };
}

/** Duplicate ids would make analysis links and running history ambiguous. */
function assertUniqueIds(games: RawGame[]): void {
  const seen = new Set<number>();
  for (const { game_id } of games) {
    if (seen.has(game_id)) throw new Error(`Duplicate game_id: ${game_id}`);
    seen.add(game_id);
  }
}
