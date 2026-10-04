import rawGames from "@/assets/games.json";
import { loadGames } from "@/data/loadGames";

/** The bundled dataset, loaded once per page; the only module that touches games.json. */
export const { results, tally } = loadGames(rawGames);
