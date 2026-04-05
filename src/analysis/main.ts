import "@/styles/main.css";
import rawGames from "@/assets/games.json";
import { renderAnalysisView } from "@/components/analysisView";
import type { RawGameData } from "@/types/raw";

const games = rawGames as unknown as RawGameData;
const params = new URLSearchParams(location.search);
const gameIdParam = params.get("game");
const gameId = gameIdParam !== null ? parseInt(gameIdParam, 10) : NaN;

const root = document.getElementById("analysis-root");
if (!root) throw new Error("Missing #analysis-root");

if (isNaN(gameId)) {
  root.innerHTML = `<p id="not-found">No game specified. <a href="/" class="back-link">← Back</a></p>`;
} else {
  const idx = games.findIndex((g) => g.game_id === gameId);
  const game = idx !== -1 ? games[idx] : undefined;
  if (!game) {
    root.innerHTML = `<p id="not-found">Game #${gameId} not found. <a href="/" class="back-link">← Back</a></p>`;
  } else {
    const nav = {
      prev: idx > 0 ? `?game=${games[idx - 1]!.game_id}` : null,
      next: idx < games.length - 1 ? `?game=${games[idx + 1]!.game_id}` : null,
    };
    renderAnalysisView(root, game, nav);
  }
}
