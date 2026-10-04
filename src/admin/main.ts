import { fetchGames } from "@admin/api/client";
import { renderGameList } from "@admin/views/gameList";
import { renderGameForm } from "@admin/views/gameForm";
import { showToast } from "@admin/components/toast";
import { getMainUrl } from "@/utils/urls";
import type { RawGame } from "@/types/raw";
import { applyDesignTokens, markAppReady } from "@/styles/design";

/**
 * The admin single-page app: owns the cached games and renders the view for
 * the current hash into `root`.
 *
 * Invariant: views only ever see `games` through `route()`, and every path
 * that changes the stored data ends in `refresh()` (data) or `reload()` (data
 * then view), so the cache and the screen cannot silently diverge.
 */
class AdminApp {
  /** Last games fetched from the API; empty until the first load succeeds. */
  private games: RawGame[] = [];

  /**
   * @param root container each view renders into (replaced wholesale per route)
   * @param loadGames source of the stored games — injected so tests can fake the API
   */
  constructor(
    private readonly root: HTMLElement,
    private readonly loadGames: () => Promise<RawGame[]>,
  ) {}

  /** Loads games, renders the current route, starts listening for navigation, then reveals the app. */
  async start(): Promise<void> {
    await this.refresh("Failed to load games");
    this.route();
    window.addEventListener("hashchange", () => this.route());
    markAppReady();
  }

  /**
   * Hash router: `#new` → blank form, `#edit/<id>` → populated form, anything
   * else → games list. Re-renders `root` from scratch and highlights the active nav link.
   */
  private route(): void {
    const hash = window.location.hash; // e.g. "#games", "#new", "#edit/3"
    this.root.innerHTML = "";

    /** Data only: the form navigates back to the list itself, and that hashchange re-renders. */
    const afterSave = (): Promise<void> => this.refresh("Failed to refresh games");
    /** Data and view: the list stays put after a delete, so it must re-render to drop the row. */
    const afterDelete = (): Promise<void> => this.reload();

    if (hash === "#new") {
      renderGameForm(this.root, this.games, null, afterSave);
    } else if (hash.startsWith("#edit/")) {
      const id = parseInt(hash.slice(6), 10);
      const game = this.games.find((g) => g.game_id === id) ?? null;
      if (game) {
        renderGameForm(this.root, this.games, game, afterSave);
      } else {
        this.root.innerHTML = `<p style="color:var(--text-secondary);padding:2rem 0">Game #${id} not found. <a href="#games" style="color:var(--colour-wifey)">← Back</a></p>`;
      }
    } else {
      // #games or default
      renderGameList(this.root, this.games, afterDelete);
    }

    // Highlight active nav link
    document.querySelectorAll<HTMLAnchorElement>("header nav a").forEach((a) => {
      a.classList.toggle("active", a.getAttribute("href") === hash || (hash === "" && a.getAttribute("href") === "#games"));
    });
  }

  /**
   * Re-fetches the games into the cache without touching the view. On failure,
   * toasts `failureMessage` and keeps the previous cache rather than emptying it.
   */
  private async refresh(failureMessage: string): Promise<void> {
    try {
      this.games = await this.loadGames();
    } catch (e) {
      showToast(`${failureMessage}: ${(e as Error).message}`, "error");
    }
  }

  /** Re-fetches the games, then re-renders the current view from them. */
  private async reload(): Promise<void> {
    await this.refresh("Failed to refresh games");
    this.route();
  }
}

// ── Page setup ──
applyDesignTokens();

// Set up main site link with correct base path
const mainLink = document.querySelector<HTMLAnchorElement>("nav a[data-main-link]");
if (mainLink) {
  mainLink.href = getMainUrl();
}

const root = document.getElementById("view-root");
if (!root) throw new Error("Missing #view-root");
void new AdminApp(root, fetchGames).start();
