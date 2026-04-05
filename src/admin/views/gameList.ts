import type { RawGame } from "@/types/raw";
import { SPECIAL_CATEGORIES, SPECIAL_CATEGORY_COLOUR } from "@/styles/design";
import { deleteGame } from "@admin/api/client";
import { showToast } from "@admin/components/toast";

export function renderGameList(el: HTMLElement, games: RawGame[], onDelete: () => Promise<void>): void {
  const reversed = [...games].reverse();

  const rows = reversed
    .map((game) => {
      const { game_id, players } = game;
      const hubbyTotal = Object.values(players.hubby).reduce((s, v) => s + v, 0);
      const wifeyTotal = Object.values(players.wifey).reduce((s, v) => s + v, 0);

      let rowClass: string;
      let winnerText: string;
      if (game.drawResult === "draw") {
        rowClass = "row--draw";
        winnerText = "Draw";
      } else if (wifeyTotal > hubbyTotal) {
        rowClass = "row--wifey";
        winnerText = "Wifey";
      } else if (hubbyTotal > wifeyTotal) {
        rowClass = "row--hubby";
        winnerText = "Hubby";
      } else {
        // equal scores, tiebreaker
        rowClass = game.drawResult === "wifey" ? "row--tiebreaker-wifey" : "row--tiebreaker-hubby";
        winnerText = game.drawResult === "wifey" ? "Wifey*" : "Hubby*";
      }

      const catSet = new Set(Object.keys(players.hubby));
      const specialTicks = SPECIAL_CATEGORIES.map((cat) =>
        catSet.has(cat)
          ? `<td><span style="color:${SPECIAL_CATEGORY_COLOUR[cat]};font-weight:700;" title="${cat}">✓</span></td>`
          : `<td></td>`
      ).join("");

      return `
        <tr class="${rowClass}">
          <td>${game_id}</td>
          <td>${winnerText}</td>
          <td style="color:var(--colour-wifey)">${wifeyTotal}</td>
          <td style="color:var(--colour-hubby)">${hubbyTotal}</td>
          ${specialTicks}
          <td>
            <div class="row-actions">
              <a href="#edit/${game_id}" class="btn btn--secondary btn--icon" title="Edit">Edit</a>
              <a href="#analysis/${game_id}" class="btn btn--secondary btn--icon" title="Analysis">Analysis</a>
              <button class="btn btn--danger btn--icon delete-btn" data-id="${game_id}" title="Delete">Delete</button>
            </div>
          </td>
        </tr>`;
    })
    .join("");

  el.innerHTML = `
    <div class="view">
      <div class="card">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:1rem;">
          <span class="view-title">All Games (${games.length})</span>
          <a href="#new" class="btn btn--primary">+ New Game</a>
        </div>
        <div style="overflow-x:auto">
          <table class="games-list-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Winner</th>
                <th>Wifey</th>
                <th>Hubby</th>
                <th title="Nectar">N</th>
                <th title="Duet">D</th>
                <th title="HummingBirds">H</th>
                <th style="text-align:center">Actions</th>
              </tr>
            </thead>
            <tbody>${rows}</tbody>
          </table>
        </div>
      </div>

    </div>`;

  el.querySelectorAll<HTMLButtonElement>(".delete-btn").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const id = Number(btn.dataset.id);
      if (!confirm(`Delete Game #${id}? This cannot be undone.`)) return;
      btn.disabled = true;
      try {
        await deleteGame(id);
        showToast(`Game #${id} deleted`, "success");
        await onDelete();
      } catch (e) {
        showToast(`Delete failed: ${(e as Error).message}`, "error");
        btn.disabled = false;
      }
    });
  });
}
