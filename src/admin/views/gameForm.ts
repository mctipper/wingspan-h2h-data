import type { RawGame } from "@/types/raw";
import { VALID_CATEGORIES } from "@/types/categories";
import { createGame, updateGame } from "@admin/api/client";
import { showToast } from "@admin/components/toast";
import { validateGame } from "@admin/validation/gameValidator";

interface CategoryRowState {
  name: string;
  wifey: number | "";
  hubby: number | "";
}

export function renderGameForm(
  el: HTMLElement,
  allGames: RawGame[],
  existingGame: RawGame | null,
  onSave: () => Promise<void>
): void {
  const isEdit = existingGame !== null;
  const nextId = isEdit
    ? existingGame!.game_id
    : allGames.length > 0
    ? Math.max(...allGames.map((g) => g.game_id)) + 1
    : 1;

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

  function getAvailableCategories(excludeIdx?: number): string[] {
    const used = new Set(
      rows
        .map((row, i) => (i !== excludeIdx ? String(row.name).trim() : null))
        .filter((name) => name)
    );
    return VALID_CATEGORIES.filter((cat) => !used.has(cat));
  }

  function buildRawGame(): RawGame {
    const hubby: Record<string, number> = {};
    const wifey: Record<string, number> = {};

    // Sort rows by VALID_CATEGORIES order before building
    const sortedRows = [...rows].sort(
      (a, b) => VALID_CATEGORIES.indexOf(a.name as any) - VALID_CATEGORIES.indexOf(b.name as any)
    );

    for (const row of sortedRows) {
      const name = String(row.name).trim();
      wifey[name] = Number(row.wifey);
      hubby[name] = Number(row.hubby);
    }
    const base: RawGame = { game_id: nextId, players: { wifey, hubby } };
    if (drawResult) {
      base.drawResult = drawResult as RawGame["drawResult"];
    }
    return base;
  }

  function updateTotals() {
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
      if ((totalWifey === 0 || totalHubby ===0)) {
        drawResultDropdown.disabled = true;
      }
      else if (totalWifey === totalHubby) {
        drawResultDropdown.disabled = false;
      } else {
        drawResultDropdown.disabled = true;
      }
    }
  }

  function renderRows(container: HTMLElement): void {
    container.innerHTML = rows
      .map(
        (row, i) => `
        <div class="category-row" data-idx="${i}">
          <div>
            <select class="cat-name" data-idx="${i}">
              ${getAvailableCategories(i)
                .concat(String(row.name))
                .filter((c, idx, arr) => arr.indexOf(c) === idx)
                .map((c) => `<option value="${c}"${c === row.name ? " selected" : ""}>${c}</option>`)
                .join("")}
            </select>
          </div>
          <div>
            <input type="number" class="cat-wifey" data-idx="${i}" value="${row.wifey === "" ? "" : row.wifey}" placeholder="0" min="0" />
          </div>
          <div>
            <input type="number" class="cat-hubby" data-idx="${i}" value="${row.hubby === "" ? "" : row.hubby}" placeholder="0" min="0" />
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

  function updateAddButtonState(): void {
    const addBtn = document.getElementById("add-row-btn") as HTMLButtonElement;
    if (addBtn) {
      addBtn.disabled = getAvailableCategories().length === 0;
    }
  }

  el.innerHTML = `
    <div class="view">
      <div class="card">
        <div class="view-title" style="margin-bottom:1rem">${isEdit ? `Edit Game #${nextId}` : "New Game"}</div>

        <form id="game-form" novalidate>
          <div class="form-meta" style="margin-bottom:1.25rem">
            <div class="form-group">
              <label>Game #</label>
              <input type="number" value="${nextId}" readonly />
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
    const raw = buildRawGame();
    const { valid, errors } = validateGame(raw);

    const errorsEl = document.getElementById("form-errors")!;
    if (!valid) {
      errorsEl.style.display = "";
      errorsEl.innerHTML = errors.map((err) => `<div>${escHtml(err.message)}</div>`).join("");
      submitErrors = errors.map((err) => err.message);
      return;
    }

    errorsEl.style.display = "none";
    submitErrors = [];
    const btn = document.getElementById("save-btn") as HTMLButtonElement;
    btn.disabled = true;
    btn.textContent = "Saving…";

    try {
      if (isEdit) {
        await updateGame(nextId, raw);
        showToast(`Game #${nextId} updated`, "success");
      } else {
        await createGame(raw);
        showToast(`Game #${nextId} added`, "success");
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

function escHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
