import rawGames from "../../data/games.json";
import { loadAll } from "./parser";
import type { RawGameData } from "../types/raw";

export const { results, tally } = loadAll(rawGames as unknown as RawGameData);