import {
  Chart,
  BarController,
  BarElement,
  CategoryScale,
  LinearScale,
  Tooltip,
} from "chart.js";
import type { Tally } from "@/types/tally";
import { COLOURS } from "@/styles/design";

Chart.register(BarController, BarElement, CategoryScale, LinearScale, Tooltip);

export function renderStreakBarChart(tally: Tally, el: HTMLCanvasElement): void {
  const { runningHistory } = tally;

  // Extract individual streaks by detecting when the streak changes
  type StreakData = {
    player: "wifey" | "hubby";
    length: number;
  };

  const streaks: StreakData[] = [];
  let lastStreak = runningHistory[0]?.runningStreak;

  for (let i = 0; i < runningHistory.length; i++) {
    const entry = runningHistory[i];
    const streak = entry.runningStreak;

    // Detect streak change or end
    if (i === 0) {
      // First entry
      if (streak.player) {
        lastStreak = streak;
      }
    } else {
      const prevStreak = runningHistory[i - 1].runningStreak;

      // Check if streak ended (player changed or went to null) or streak is longer but different player
      if (
        (streak.player !== prevStreak.player || 
         (streak.player === null && prevStreak.player !== null)) &&
        prevStreak.player
      ) {
        // Record the completed streak
        streaks.push({
          player: prevStreak.player,
          length: prevStreak.length,
        });
      }
    }
  }

  // Add the final streak if it exists
  if (lastStreak && lastStreak.player && runningHistory.length > 0) {
    const finalStreak = runningHistory[runningHistory.length - 1].runningStreak;
    if (finalStreak.player && finalStreak !== streaks[streaks.length - 1]) {
      streaks.push({
        player: finalStreak.player,
        length: finalStreak.length,
      });
    }
  }

  // Convert to bar chart data (+ve for wifey, -ve for hubby)
  const labels = streaks.map((_, i) => `${i + 1}`);
  const data = streaks.map((s) => (s.player === "wifey" ? s.length : -s.length));
  const colors = streaks.map((s) => (s.player === "wifey" ? COLOURS.wifey : COLOURS.hubby));

  new Chart(el, {
    type: "bar",
    data: {
      labels,
      datasets: [
        {
          label: "Streaks",
          data,
          backgroundColor: colors,
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
          backgroundColor: COLOURS.tooltipBg,
          titleColor: COLOURS.tooltipTitle,
          bodyColor: COLOURS.tooltipBody,
          borderColor: COLOURS.tooltipBorder,
          borderWidth: 1,
          callbacks: {
            title(items) {
              return `Streak ${items[0]?.label ?? ""}`;
            },
            label(ctx) {
              const v = ctx.parsed.y ?? 0;
              const absLen = Math.abs(v);
              const player = v > 0 ? "Wifey" : "Hubby";
              const games = absLen === 1 ? "game" : "games";
              return `${player}: ${absLen} ${games}`;
            },
          },
        },
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            callback(value) {
              return Math.abs(Number(value));
            },
          },
        },
      },
    },
  });
}
