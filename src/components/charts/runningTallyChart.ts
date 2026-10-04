import type { Tally } from "@/types/tally";
import { PLAYER_LABEL } from "@/components/outcome";
import { renderDivergingLineChart } from "@/components/charts/divergingLineChart";

/** Plots the running win difference (wifey − hubby) after each game. Creates a Chart.js instance on `el`. */
export function renderRunningTallyChart(tally: Tally, el: HTMLCanvasElement): void {
  const { runningHistory } = tally;

  renderDivergingLineChart(el, {
    label: `Win difference (${PLAYER_LABEL.wifey} − ${PLAYER_LABEL.hubby})`,
    labels: runningHistory.map((e) => String(e.gameId)),
    data: runningHistory.map((e) => e.cumulativeWins.wifey - e.cumulativeWins.hubby),
    axisMetric: "Wins",
    axisStep: 10,
    axisPadding: 5,
    tooltipLabel: (v) => {
      if (v > 0) return `${PLAYER_LABEL.wifey} ahead by ${v}`;
      if (v < 0) return `${PLAYER_LABEL.hubby} ahead by ${Math.abs(v)}`;
      return "Tied";
    },
  });
}
