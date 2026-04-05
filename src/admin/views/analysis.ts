import type { RawGame } from "@/types/raw";
import { renderAnalysisView } from "@/components/analysisView";

export function renderAnalysis(
  el: HTMLElement,
  allGames: RawGame[],
  game: RawGame,
  gameId: number
): void {
  el.innerHTML = `
    <div class="view">
      <div class="analysis-admin-nav">
        <a href="#games" class="btn btn--secondary btn--icon">← Games</a>
        <a href="#edit/${gameId}" class="btn btn--secondary btn--icon">Edit Game #${gameId}</a>
      </div>
      <div id="analysis-inner"></div>
    </div>`;

  const sorted = [...allGames].sort((a, b) => a.game_id - b.game_id);
  const idx = sorted.findIndex((g) => g.game_id === gameId);
  const nav = {
    prev: idx > 0 ? `#analysis/${sorted[idx - 1]!.game_id}` : null,
    next: idx < sorted.length - 1 ? `#analysis/${sorted[idx + 1]!.game_id}` : null,
  };

  const inner = document.getElementById("analysis-inner")!;
  renderAnalysisView(inner, game, nav);
}
