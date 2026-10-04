import type { RawGame } from "@/types/raw";
import { deleteGame } from "@admin/api/client";
import { showToast } from "@admin/components/toast";
import { parseGame } from "@/data/parseGame";
import { outcomeStyle } from "@/components/outcome";
import { specialCategoryCells, specialCategoryHeaders } from "@/components/specialCategoryColumns";

/**
 * Renders the admin games table (newest first) with edit/delete actions into
 * `el`. Outcomes come from `parseGame`, so the list always agrees with the
 * public site. `onDelete` runs after a successful delete to refresh state.
 */
export function renderGameList(el: HTMLElement, games: RawGame[], onDelete: () => Promise<void>): void {
  const reversed = [...games].reverse();

  const rows = reversed
    .map((game) => {
      const { gameId, totals, winner, tiebreaker, categories } = parseGame(game);
      const { label, rowClass } = outcomeStyle(winner, tiebreaker);
      // "*" marks a tiebreaker win in the admin list
      const winnerText = label + (tiebreaker ? "*" : "");

      return `
        <tr class="${rowClass}">
          <td>${gameId}</td>
          <td>${winnerText}</td>
          <td style="color:var(--colour-wifey)">${totals.wifey}</td>
          <td style="color:var(--colour-hubby)">${totals.hubby}</td>
          ${specialCategoryCells(categories)}
          <td>
            <div class="row-actions">
              <a href="#edit/${gameId}" class="btn btn--secondary btn--icon" title="Edit">Edit</a>
              <button class="btn btn--danger btn--icon delete-btn" data-id="${gameId}" title="Delete">Delete</button>
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
                ${specialCategoryHeaders()}
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
