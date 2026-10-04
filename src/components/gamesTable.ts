import type { GameResult } from "@/types/domain";
import type { RunningEntry } from "@/types/tally";
import { SPECIAL_CATEGORY_COLOUR } from "@/styles/design";
import { getAnalysisUrl } from "@/utils/urls";
import { outcomeStyle } from "@/components/outcome";

export function renderGamesTable(
  results: GameResult[],
  runningHistory: RunningEntry[],
  el: HTMLElement
): void {
  // Build a map from gameId -> RunningEntry for O(1) lookup
  const historyMap = new Map(runningHistory.map((e) => [e.gameId, e]));

  const reversed = [...results].reverse();

  const rows = reversed
    .map((game) => {
      const { gameId, winner, margin, totals, tiebreaker, categories, perfect } = game;

      const { label, winnerClass, rowClass } = outcomeStyle(winner, tiebreaker);
      // "!" marks a perfect game (winner took every category)
      const displayWinner = label + (perfect ? "!" : "");
      // Draws and tiebreakers have equal totals, so this is already 0 for them
      const absMargin = Math.abs(margin);

      const entry = historyMap.get(gameId);

      // Streak — just the number, winner is already shown in the Winner column
      let streakText = "—";
      if (entry && entry.runningStreak.length > 0 && entry.runningStreak.player) {
        streakText = String(entry.runningStreak.length);
      }

      // Running tallies at this point
      const cumWinDiff = entry ? entry.cumulativeWins.wifey - entry.cumulativeWins.hubby : null;
      const runWins = cumWinDiff === null ? "—" : cumWinDiff > 0 ? `+${cumWinDiff}` : String(cumWinDiff);
      const runMargin = entry
        ? (entry.cumulativeMargin > 0
            ? `+${entry.cumulativeMargin}`
            : String(entry.cumulativeMargin))
        : "—";

      // Special category ticks
      const catSet = new Set(categories.map((c) => c.category));
      function specialTick(catName: keyof typeof SPECIAL_CATEGORY_COLOUR): string {
        if (!catSet.has(catName)) return "";
        const colour = SPECIAL_CATEGORY_COLOUR[catName];
        return `<span style="color:${colour};font-weight:700;" title="${catName}">✓</span>`;
      }

      return `
        <tr class="${rowClass}" data-game-id="${gameId}">
          <td><a href="${getAnalysisUrl(gameId)}" style="color:inherit;text-decoration:none;text-decoration:underline;" title="View analysis">${gameId}</a></td>
          <td class="${winnerClass}">${displayWinner}</td>
          <td>${absMargin}</td>
          <td>${totals.wifey}</td>
          <td>${totals.hubby}</td>
          <td>${streakText}</td>
          <td>${runWins}</td>
          <td>${runMargin}</td>
          <td>${specialTick("Nectar")}</td>
          <td>${specialTick("Duet")}</td>
          <td>${specialTick("Hummingbirds")}</td>
        </tr>`;
    })
    .join("");

  el.innerHTML = `
    <table>
      <thead>
        <tr>
          <th>Game #</th>
          <th>Winner</th>
          <th>Margin</th>
          <th>Wifey Total</th>
          <th>Hubby Total</th>
          <th>Streak</th>
          <th title="Cumulative win difference (positive = Wifey ahead)">Cum. Wins</th>
          <th title="Cumulative score margin (positive = Wifey ahead)">Cum. Margin</th>
          <th title="Nectar">N</th>
          <th title="Duet">D</th>
          <th title="Hummingbirds">H</th>
        </tr>
      </thead>
      <tbody>
        ${rows}
      </tbody>
    </table>`;
}
