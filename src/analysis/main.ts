import "@/styles/main.css";
import { results, tally } from "@/data/dataLoader";
import { renderAnalysisView } from "@/components/analysisView";
import { getMainUrl } from "@/utils/urls";
import { applyDesignTokens, markAppReady } from "@/styles/design";

applyDesignTokens();

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
  // results is sorted by game_id, so neighbours are the previous/next games
  const idx = results.findIndex((r) => r.gameId === gameId);
  const result = idx !== -1 ? results[idx] : undefined;
  if (!result) {
    root.innerHTML = `<p id="not-found">Game #${gameId} not found. <a href="${getMainUrl()}" class="back-link">← Back</a></p>`;
  } else {
    const nav = {
      prev: idx > 0 ? `?game=${results[idx - 1]!.gameId}` : null,
      next: idx < results.length - 1 ? `?game=${results[idx + 1]!.gameId}` : null,
    };
    renderAnalysisView(root, result, tally.players, nav);
  }
}

markAppReady();
