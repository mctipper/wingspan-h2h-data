import type { RawGame } from "@/types/raw";
import { VALID_CATEGORIES } from "@/types/categories";
import { createGame, updateGame } from "@admin/api/client";
import { showToast } from "@admin/components/toast";
import { validateGameInput, type GameInput } from "@/validation/gameValidator";
import { escapeHtml } from "@/utils/html";

interface CategoryRowState {
  name: string;
  wifey: number | "";
  hubby: number | "";
}

/**
 * Renders the add/edit game form into `el` and owns its state until the next
 * route change. Pass `existingGame` to edit, or null to create (rows are then
 * seeded from the latest game's categories, scores blank).
 *
 * Submission validates with the shared validator before calling the API, then
 * awaits `onSave` and navigates back to the list after a short delay so the
 * success toast is visible.
 */
export function renderGameForm(
  el: HTMLElement,
  allGames: RawGame[],
  existingGame: RawGame | null,
  onSave: () => Promise<void>
): void {
  const isEdit = existingGame !== null;
  // New games get their id from the server on save; guessing it here could go stale
  const gameId: number | null = existingGame?.game_id ?? null;

  // Seed category rows from existing game, last game (new mode), or a single blank row
  const lastGame = allGames.length > 0 ? allGames[allGames.length - 1] : null;
  let rows: CategoryRowState[] = isEdit
    ? Object.keys(existingGame!.players.wifey).map((name) => ({
        name,
        wifey: existingGame!.players.wifey[name],
        hubby: existingGame!.players.hubby[name],
      }))
    : lastGame
    ? Object.keys(lastGame.players.wifey).map((name) => ({ name, wifey: "", hubby: "" }))
    : [{ name: VALID_CATEGORIES[0], wifey: "", hubby: "" }];

  let drawResult: string = existingGame?.drawResult ?? "";
  let submitErrors: string[] = [];

  /** Registry categories not yet used by another row; `excludeIdx` keeps that row's own choice available. */
  function getAvailableCategories(excludeIdx?: number): string[] {
    const used = new Set(
      rows
        .map((row, i) => (i !== excludeIdx ? String(row.name).trim() : null))
        .filter((name) => name)
    );
    return VALID_CATEGORIES.filter((cat) => !used.has(cat));
  }

  /**
   * Snapshots form state as an unvalidated submission. Blank scores become 0;
   * ordering and stray-field stripping are left to the validator's canonicalisation.
   */
  function buildGameInput(): GameInput {
    const hubby: Record<string, number> = {};
    const wifey: Record<string, number> = {};

    for (const row of rows) {
      const name = String(row.name).trim();
      wifey[name] = Number(row.wifey);
      hubby[name] = Number(row.hubby);
    }
    const input: GameInput = { players: { wifey, hubby } };
    if (drawResult) {
      input.drawResult = drawResult as GameInput["drawResult"];
    }
    return input;
  }

  /**
   * Refreshes the totals row and gates the draw dropdown: enabled only on a
   * non-zero tie, otherwise disabled and cleared so a stale choice isn't submitted.
   */
  function updateTotals(): void {
    const totalWifey = rows.reduce((sum, row) => sum + (row.wifey || 0), 0);
    const totalHubby = rows.reduce((sum, row) => sum + (row.hubby || 0), 0);

    const totalRow = document.getElementById("total-row");
    if (totalRow) {
      const wifeyCell = totalRow.querySelector(".total-wifey") as HTMLElement;
      const hubbyCell = totalRow.querySelector(".total-hubby") as HTMLElement;
      if (wifeyCell) wifeyCell.textContent = totalWifey.toString();
      if (hubbyCell) hubbyCell.textContent = totalHubby.toString();
    }

    // Enable/disable draw result dropdown
    const drawResultDropdown = document.getElementById("draw-result") as HTMLSelectElement;
    if (drawResultDropdown) {
      const isTie = totalWifey === totalHubby && totalWifey !== 0;
      drawResultDropdown.disabled = !isTie;
      // A draw result is only valid on a tie; clear it so a stale pick isn't submitted
      if (!isTie) {
        drawResult = "";
        drawResultDropdown.value = "";
      }
    }
  }

  /**
   * Re-renders every category row plus the totals row into `container` and
   * rebinds their listeners. Called after any structural change (add, remove,
   * rename) because each row's dropdown options depend on the others.
   */
  function renderRows(container: HTMLElement): void {
    let tabIndex: number = 1;

    container.innerHTML = rows
      .map(
        (row, i) => `
        <div class="category-row" data-idx="${i}">
          <div>
            <select class="cat-name" data-idx="${i}">
              ${getAvailableCategories(i)
                .concat(String(row.name))
                .filter((c, idx, arr) => arr.indexOf(c) === idx)
                // Existing names come from the stored file, which isn't validated on read
                .map((c) => `<option value="${escapeHtml(c)}"${c === row.name ? " selected" : ""}>${escapeHtml(c)}</option>`)
                .join("")}
            </select>
          </div>
          <div>
            <input type="number" class="cat-wifey" ${i === 0 ? "autofocus" : ""} tabindex="${++tabIndex}" data-idx="${i}" value="${row.wifey === "" ? "" : row.wifey}" placeholder="0" min="0" />
          </div>
          <div>
            <input type="number" class="cat-hubby" tabindex="${++tabIndex}" data-idx="${i}" value="${row.hubby === "" ? "" : row.hubby}" placeholder="0" min="0" />
          </div>
          <button type="button" class="btn btn--danger btn--icon remove-row" data-idx="${i}" ${rows.length <= 1 ? "disabled" : ""} title="Remove">×</button>
        </div>`
      )
      .join("");

    // Add total row
    const totalWifey = rows.reduce((sum, row) => sum + (row.wifey || 0), 0);
    const totalHubby = rows.reduce((sum, row) => sum + (row.hubby || 0), 0);
    container.innerHTML += `
      <div id="total-row" class="category-row" style="font-weight: bold; margin-top: 0.5rem;">
        <div>Total</div>
        <div class="total-wifey">${totalWifey}</div>
        <div class="total-hubby">${totalHubby}</div>
        <div></div>
      </div>`;

    // Bind events
    container.querySelectorAll<HTMLSelectElement>(".cat-name").forEach((sel) => {
      sel.addEventListener("change", () => {
        rows[Number(sel.dataset.idx)].name = sel.value;
        // Re-render to update available categories for all rows
        renderRows(container);
      });
    });
    container.querySelectorAll<HTMLInputElement>(".cat-wifey").forEach((inp) => {
      inp.addEventListener("input", () => {
        rows[Number(inp.dataset.idx)].wifey =
          inp.value === "" ? "" : Number(inp.value);
        updateTotals();
      });
    });
    container.querySelectorAll<HTMLInputElement>(".cat-hubby").forEach((inp) => {
      inp.addEventListener("input", () => {
        rows[Number(inp.dataset.idx)].hubby =
          inp.value === "" ? "" : Number(inp.value);
        updateTotals();
      });
    });
    container.querySelectorAll<HTMLButtonElement>(".remove-row").forEach((btn) => {
      btn.addEventListener("click", () => {
        rows.splice(Number(btn.dataset.idx), 1);
        renderRows(container);
        updateAddButtonState();
      });
    });

    updateAddButtonState();
  }

  /** Disables "Add Category" once every registry category is in use. */
  function updateAddButtonState(): void {
    const addBtn = document.getElementById("add-row-btn") as HTMLButtonElement;
    if (addBtn) {
      addBtn.disabled = getAvailableCategories().length === 0;
    }
  }

  el.innerHTML = `
    <div class="view">
      <div class="card">
        <div style="margin-bottom: 1rem;">
          <a href="#games" style="color: var(--colour-wifey); text-decoration: none; font-weight: 500;">← Back to Games List</a>
        </div>
        <div class="view-title" style="margin-bottom:1rem">${isEdit ? `Edit Game #${gameId}` : "New Game"}</div>

        <form id="game-form" novalidate>
          <div class="form-meta" style="margin-bottom:1.25rem">
            <div class="form-group">
              <label>Game #</label>
              <input type="text" value="${gameId ?? ""}" placeholder="Assigned on save" readonly />
            </div>
            <div class="form-group">
              <label>Draw Result</label>
              <select id="draw-result" disabled>
                <option value="">— Not applicable —</option>
                <option value="wifey" ${drawResult === "wifey" ? "selected" : ""}>Wifey (tiebreaker)</option>
                <option value="hubby" ${drawResult === "hubby" ? "selected" : ""}>Hubby (tiebreaker)</option>
                <option value="draw" ${drawResult === "draw" ? "selected" : ""}>Pure draw</option>
              </select>
            </div>
          </div>

          <div style="margin-bottom:0.5rem">
            <div class="category-rows-header">
              <span>Category</span>
              <span>Wifey</span>
              <span>Hubby</span>
              <span></span>
            </div>
            <div id="category-rows-container" class="category-rows"></div>
          </div>

          <button type="button" class="btn btn--secondary add-category-btn" id="add-row-btn">+ Add Category</button>

          <div id="form-errors" class="form-errors" style="display:none"></div>

          <div class="form-actions" style="margin-top:1.25rem">
            <button type="submit" class="btn btn--primary" id="save-btn">
              ${isEdit ? "Save Changes" : "Add Game"}
            </button>
            <a href="#games" class="btn btn--secondary">Cancel</a>
          </div>
        </form>
      </div>
    </div>`;

  const rowsContainer = document.getElementById("category-rows-container")!;
  renderRows(rowsContainer);
  // Sync the draw dropdown with seeded scores (enables it when editing a tied game)
  updateTotals();

  document.getElementById("draw-result")?.addEventListener("change", (e) => {
    drawResult = (e.target as HTMLSelectElement).value;
  });

  document.getElementById("add-row-btn")?.addEventListener("click", () => {
    const available = getAvailableCategories();
    if (available.length > 0) {
      rows.push({ name: available[0], hubby: "", wifey: "" });
      renderRows(rowsContainer);
    }
  });

  document.getElementById("game-form")?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const result = validateGameInput(buildGameInput());

    const errorsEl = document.getElementById("form-errors")!;
    if (!result.valid) {
      errorsEl.style.display = "";
      errorsEl.innerHTML = result.errors.map((err) => `<div>${escapeHtml(err.message)}</div>`).join("");
      submitErrors = result.errors.map((err) => err.message);
      return;
    }

    errorsEl.style.display = "none";
    submitErrors = [];
    const btn = document.getElementById("save-btn") as HTMLButtonElement;
    btn.disabled = true;
    btn.textContent = "Saving…";

    try {
      if (gameId !== null) {
        await updateGame(gameId, result.game);
        showToast(`Game #${gameId} updated successfully`, "success");
      } else {
        const created = await createGame(result.game);
        showToast(`Game #${created.game_id} added successfully`, "success");
      }
      // Add a delay after successful save to allow seeing the toast
      setTimeout(() => {
        location.hash = "#games";
      }, 1000);

      await onSave();
    } catch (err) {
      showToast(`Error: ${(err as Error).message}`, "error");
      btn.disabled = false;
      btn.textContent = isEdit ? "Save Changes" : "Add Game";
    }
  });

  void submitErrors; // suppress unused warning
}
