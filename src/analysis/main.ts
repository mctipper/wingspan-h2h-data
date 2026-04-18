import "@/styles/main.css";
import rawGames from "@/assets/games.json";
import { renderAnalysisView } from "@/components/analysisView";
import { getMainUrl } from "@/utils/urls";
import type { RawGameData } from "@/types/raw";

const games = rawGames as unknown as RawGameData;
// Initialize back link in HTML with correct base path
const backLinks = document.querySelectorAll<HTMLAnchorElement>('a.back-link');
backLinks.forEach(link => {
  link.href = getMainUrl();
});
const params = new URLSearchParams(location.search);
const gameIdParam = params.get("game");
const gameId = gameIdParam !== null ? parseInt(gameIdParam, 10) : NaN;

const root = document.getElementById("analysis-root");
if (!root) throw new Error("Missing #analysis-root");

if (isNaN(gameId)) {
  root.innerHTML = `<p id="not-found">No game specified. <a href="${getMainUrl()}" class="back-link">← Back</a></p>`;
} else {
  const idx = games.findIndex((g) => g.game_id === gameId);
  const game = idx !== -1 ? games[idx] : undefined;
  if (!game) {
    root.innerHTML = `<p id="not-found">Game #${gameId} not found. <a href="${getMainUrl()}" class="back-link">← Back</a></p>`;
  } else {
    const nav = {
      prev: idx > 0 ? `?game=${games[idx - 1]!.game_id}` : null,
      next: idx < games.length - 1 ? `?game=${games[idx + 1]!.game_id}` : null,
    };
    // Pass all games to enable cross-game category average calculation
    renderAnalysisView(root, game, nav, games);
  }
}
