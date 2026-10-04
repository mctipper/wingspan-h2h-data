import type { Tally, RunningEntry } from "@/types/tally";
import type { Player } from "@/types/domain";
import { COLOURS } from "@/styles/design";
import { PLAYER_LABEL } from "@/components/outcome";
import {
  AXIS_GRID,
  AXIS_TICKS,
  Chart,
  GAME_AXIS,
  TOOLTIP_THEME,
  divergingAxisTitle,
} from "@/components/charts/chartTheme";

interface StreakRun {
  player: Player;
  length: number;
}

/**
 * Every winning streak in order, including the one still running. An entry
 * closes a run when the next game isn't won by the same player (or there is no
 * next game); pure draws have no player, so they never start a run.
 */
function streakRuns(history: RunningEntry[]): StreakRun[] {
  const runs: StreakRun[] = [];
  history.forEach(({ runningStreak: { player, length } }, i) => {
    if (player !== null && history[i + 1]?.runningStreak.player !== player) {
      runs.push({ player, length });
    }
  });
  return runs;
}

/**
 * One bar per winning streak, up for wifey and down for hubby, on a y axis
 * symmetric about zero. Creates a Chart.js instance on `el`.
 */
export function renderStreakBarChart(tally: Tally, el: HTMLCanvasElement): void {
  const runs = streakRuns(tally.runningHistory);

  // Symmetric axis rounded up to the next multiple of 5, so both players' bars share a scale
  const yAxisMax = Math.ceil(Math.max(0, ...runs.map((r) => r.length)) / 5) * 5;

  new Chart(el, {
    type: "bar",
    data: {
      labels: runs.map((_, i) => `${i + 1}`),
      datasets: [
        {
          label: "Streaks",
          data: runs.map((r) => (r.player === "wifey" ? r.length : -r.length)),
          backgroundColor: runs.map((r) => COLOURS[r.player]),
          borderRadius: 4,
          borderSkipped: false,
        },
      ],
    },
    options: {
      indexAxis: "x",
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          ...TOOLTIP_THEME,
          callbacks: {
            title: (items) => `Streak ${items[0]?.label ?? ""}`,
            label: (ctx) => {
              const v = ctx.parsed.y ?? 0;
              const absLen = Math.abs(v);
              return `${PLAYER_LABEL[v > 0 ? "wifey" : "hubby"]}: ${absLen} ${absLen === 1 ? "game" : "games"}`;
            },
          },
        },
      },
      scales: {
        x: GAME_AXIS,
        y: {
          beginAtZero: true,
          max: yAxisMax,
          min: -yAxisMax,
          ticks: { ...AXIS_TICKS, callback: (value) => Math.abs(Number(value)) },
          grid: AXIS_GRID,
          title: divergingAxisTitle("Streaks"),
        },
      },
    },
  });
}
