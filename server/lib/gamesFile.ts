import { readFile, writeFile } from "fs/promises";
import { resolve } from "path";
import type { RawGame } from "../../src/types/raw.js";

const GAMES_PATH = resolve(import.meta.dirname, "../../src/assets/games.json");

export async function readGames(): Promise<RawGame[]> {
  const raw = await readFile(GAMES_PATH, "utf-8");
  return JSON.parse(raw) as RawGame[];
}

export async function writeGames(games: RawGame[]): Promise<void> {
  const sorted = [...games].sort((a, b) => a.game_id - b.game_id);
  await writeFile(GAMES_PATH, JSON.stringify(sorted, null, 2) + "\n", "utf-8");
}
