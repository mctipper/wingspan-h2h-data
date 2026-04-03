import {
  Chart,
  LineController,
  LineElement,
  PointElement,
  CategoryScale,
  LinearScale,
  Filler,
  Tooltip,
} from "chart.js";
import type { Tally } from "@/types/tally";
import { COLOURS } from "@/design";

Chart.register(LineController, LineElement, PointElement, CategoryScale, LinearScale, Filler, Tooltip);

export function renderMarginChart(tally: Tally, el: HTMLCanvasElement): void {
  const { runningHistory } = tally;

  const labels = runningHistory.map((e) => String(e.gameId));
  const data = runningHistory.map((e) => e.cumulativeMargin);
  // Per-game signed margin (positive = wifey won, negative = hubby won)
  const perGameMargin = runningHistory.map((e, i) =>
    i === 0 ? e.cumulativeMargin : e.cumulativeMargin - runningHistory[i - 1]!.cumulativeMargin
  );

  const pointColors = data.map((v) => (v > 0 ? COLOURS.wifey : v < 0 ? COLOURS.hubby : COLOURS.draw));

  new Chart(el, {
    type: "line",
    data: {
      labels,
      datasets: [
        {
          label: "Cumulative margin",
          data,
          borderColor: COLOURS.wifey,
          backgroundColor: (ctx) => {
            const chart = ctx.chart;
            const { ctx: c, chartArea } = chart;
            if (!chartArea) return "transparent";
            const grad = c.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
            grad.addColorStop(0, COLOURS.wifey + "55");
            grad.addColorStop(0.5, "transparent");
            grad.addColorStop(1, COLOURS.hubby + "55");
            return grad;
          },
          borderWidth: 2,
          pointRadius: 3,
          pointHoverRadius: 5,
          pointBackgroundColor: pointColors,
          pointBorderColor: pointColors,
          tension: 0.2,
          fill: "origin",
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: "index", intersect: false },
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
              const gameNum = items[0]?.label ?? "";
              return `After ${gameNum} games`;
            },
            label(ctx) {
              const v = ctx.parsed.y ?? 0;
              const i = ctx.dataIndex;
              const gm = perGameMargin[i] ?? 0;
              const lines: string[] = [];
              if (v > 0) lines.push(`Wifey ahead by ${v} pts cumulative`);
              else if (v < 0) lines.push(`Hubby ahead by ${Math.abs(v)} pts cumulative`);
              else lines.push("Tied cumulative");
              if (gm > 0) lines.push(`Wifey won by ${gm} pts this game`);
              else if (gm < 0) lines.push(`Hubby won by ${Math.abs(gm)} pts this game`);
              else lines.push("Draw this game");
              return lines;
            },
          },
        },
      },
      scales: {
        x: {
          ticks: { display: false },
          grid: { color: COLOURS.chartGrid },
          title: { display: true, text: "Game #", color: COLOURS.chartText, font: { size: 11 } },
        },
        y: {
          ticks: {
            color: COLOURS.chartText,
            font: { size: 11 },
            callback: (v) => (Number(v) > 0 ? `+${Number(v)}` : String(v)),
          },
          grid: { color: COLOURS.chartGrid },
          title: { display: true, text: "← Hubby   Margin   Wifey →", color: COLOURS.chartText, font: { size: 11 } },
        },
      },
    },
  });
}
