import type { TooltipItem } from "chart.js";
import { COLOURS } from "@/styles/design";
import {
  AXIS_GRID,
  AXIS_TICKS,
  Chart,
  GAME_AXIS,
  TOOLTIP_THEME,
  divergingAxisTitle,
  leadColour,
  signedTick,
} from "@/components/charts/chartTheme";

export interface DivergingLineChartOptions {
  /** Dataset label (screen readers / legend) */
  label: string;
  /** One label per point — the game id */
  labels: string[];
  /** Signed series: positive = wifey ahead, negative = hubby ahead */
  data: number[];
  /** Middle word of the y-axis title, e.g. "Wins" → "← Hubby   Wins   Wifey →" */
  axisMetric: string;
  /** Gridline interval; axis bounds are rounded out to a multiple of it */
  axisStep: number;
  /** Headroom added beyond the data extremes before rounding */
  axisPadding: number;
  /** Tooltip body for the point at `index` with value `value` */
  tooltipLabel: (value: number, index: number) => string | string[];
}

/**
 * A line over games for a value signed by player, filled towards zero with a
 * wifey-to-hubby gradient and points coloured by who leads. The y axis is
 * symmetric in style (not range): each bound is the data extreme (or 0) plus
 * `axisPadding`, rounded outward to `axisStep`.
 *
 * Side effect: creates a Chart.js instance on `el`.
 */
export function renderDivergingLineChart(el: HTMLCanvasElement, options: DivergingLineChartOptions): void {
  const { label, labels, data, axisMetric, axisStep, axisPadding, tooltipLabel } = options;

  const yAxisMax = Math.ceil((Math.max(...data, 0) + axisPadding) / axisStep) * axisStep;
  const yAxisMin = Math.floor((Math.min(...data, 0) - axisPadding) / axisStep) * axisStep;
  const pointColours = data.map(leadColour);

  new Chart(el, {
    type: "line",
    data: {
      labels,
      datasets: [
        {
          label,
          data,
          borderColor: COLOURS.wifey,
          backgroundColor: (ctx) => {
            const { ctx: c, chartArea } = ctx.chart;
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
          pointBackgroundColor: pointColours,
          pointBorderColor: pointColours,
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
          ...TOOLTIP_THEME,
          callbacks: {
            title: (items: TooltipItem<"line">[]) => `After ${items[0]?.label ?? ""} games`,
            label: (ctx: TooltipItem<"line">) => tooltipLabel(ctx.parsed.y ?? 0, ctx.dataIndex),
          },
        },
      },
      scales: {
        x: GAME_AXIS,
        y: {
          max: yAxisMax,
          min: yAxisMin,
          ticks: { ...AXIS_TICKS, stepSize: axisStep, callback: signedTick },
          grid: AXIS_GRID,
          title: divergingAxisTitle(axisMetric),
        },
      },
    },
  });
}
