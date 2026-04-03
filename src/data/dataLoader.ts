import rawGames from "@/assets/games.json";
import { loadAll } from "@/data/parser";
import type { RawGameData } from "@/types/raw";

export const { results, tally } = loadAll(rawGames as unknown as RawGameData);