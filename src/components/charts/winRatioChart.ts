import {
  Chart,
  DoughnutController,
  ArcElement,
  Legend,
  Tooltip,
} from "chart.js";
import type { Tally } from "../../types/tally";

Chart.register(DoughnutController, ArcElement, Legend, Tooltip);

const COLOUR_WIFEY = "#4a90d9";
const COLOUR_HUBBY = "#e07b54";
const COLOUR_DRAW = "#555577";

export function renderWinRatioChart(tally: Tally, el: HTMLCanvasElement): void {
  const { wins, pureDraws } = tally;

  new Chart(el, {
    type: "doughnut",
    data: {
      labels: ["Wifey", "Hubby", "Draw"],
      datasets: [
        {
          data: [wins.wifey, wins.hubby, pureDraws],
          backgroundColor: [COLOUR_WIFEY, COLOUR_HUBBY, COLOUR_DRAW],
          borderColor: "#1a1a2e",
          borderWidth: 2,
          hoverOffset: 6,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      cutout: "60%",
      plugins: {
        legend: {
          position: "bottom",
          labels: {
            color: "#9999bb",
            font: { size: 12 },
            padding: 12,
          },
        },
        tooltip: {
          backgroundColor: "#16213e",
          titleColor: "#e8e8f0",
          bodyColor: "#9999bb",
          borderColor: "#2a2a4a",
          borderWidth: 1,
          callbacks: {
            label(ctx) {
              const total = wins.wifey + wins.hubby + pureDraws;
              const pct = total > 0 ? ((ctx.parsed / total) * 100).toFixed(1) : "0.0";
              return ` ${ctx.parsed} games (${pct}%)`;
            },
          },
        },
      },
    },
  });
}