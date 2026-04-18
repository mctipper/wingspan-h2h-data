import { fetchGames } from "@admin/api/client";
import { renderGameList } from "@admin/views/gameList";
import { renderGameForm } from "@admin/views/gameForm";
import { showToast } from "@admin/components/toast";
import { getMainUrl } from "@/utils/urls";
import type { RawGame } from "@/types/raw";

let allGames: RawGame[] = [];
const root = document.getElementById("view-root")!;

// Set up main site link with correct base path
const mainLink = document.querySelector<HTMLAnchorElement>('nav a[data-main-link]');
if (mainLink) {
  mainLink.href = getMainUrl();
}

async function bootstrap(): Promise<void> {
  try {
    allGames = await fetchGames();
  } catch (e) {
    showToast(`Failed to load games: ${(e as Error).message}`, "error");
  }
  route();
}

function route(): void {
  const hash = window.location.hash; // e.g. "#games", "#new", "#edit/3"
  root.innerHTML = "";

  if (hash === "#new") {
    renderGameForm(root, allGames, null, onSave);
  } else if (hash.startsWith("#edit/")) {
    const id = parseInt(hash.slice(6), 10);
    const game = allGames.find((g) => g.game_id === id) ?? null;
    if (game) {
      renderGameForm(root, allGames, game, onSave);
    } else {
      root.innerHTML = `<p style="color:var(--text-secondary);padding:2rem 0">Game #${id} not found. <a href="#games" style="color:var(--colour-wifey)">← Back</a></p>`;
    }
  } else {
    // #games or default
    renderGameList(root, allGames, onSave);
  }

  // Highlight active nav link
  document.querySelectorAll<HTMLAnchorElement>("header nav a").forEach((a) => {
    a.classList.toggle("active", a.getAttribute("href") === hash || (hash === "" && a.getAttribute("href") === "#games"));
  });
}

async function onSave(): Promise<void> {
  try {
    allGames = await fetchGames();
  } catch (e) {
    showToast(`Failed to refresh games: ${(e as Error).message}`, "error");
  }
}

window.addEventListener("hashchange", route);
void bootstrap();
