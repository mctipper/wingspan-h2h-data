import type { Tally } from "@/types/tally";
import { PLAYER_LABEL } from "@/components/outcome";
import { renderDivergingLineChart } from "@/components/charts/divergingLineChart";

/**
 * Plots the cumulative points margin after each game; the tooltip also shows
 * that game's own margin. Creates a Chart.js instance on `el`.
 */
export function renderMarginChart(tally: Tally, el: HTMLCanvasElement): void {
  const { runningHistory } = tally;

  const data = runningHistory.map((e) => e.cumulativeMargin);
  // Per-game signed margin (positive = wifey won, negative = hubby won)
  const perGameMargin = data.map((v, i) => (i === 0 ? v : v - data[i - 1]!));

  renderDivergingLineChart(el, {
    label: "Cumulative margin",
    labels: runningHistory.map((e) => String(e.gameId)),
    data,
    axisMetric: "Margin",
    axisStep: 100,
    axisPadding: 100,
    tooltipLabel: (v, i) => {
      const gm = perGameMargin[i] ?? 0;
      const lines: string[] = [];
      if (v > 0) lines.push(`${PLAYER_LABEL.wifey} ahead by ${v} pts cumulative`);
      else if (v < 0) lines.push(`${PLAYER_LABEL.hubby} ahead by ${Math.abs(v)} pts cumulative`);
      else lines.push("Tied cumulative");
      if (gm > 0) lines.push(`${PLAYER_LABEL.wifey} won by ${gm} pts this game`);
      else if (gm < 0) lines.push(`${PLAYER_LABEL.hubby} won by ${Math.abs(gm)} pts this game`);
      else lines.push("Draw this game");
      return lines;
    },
  });
}
