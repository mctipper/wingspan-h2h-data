/**
 * Shared Chart.js setup: component registration and the dark-theme styling
 * every chart uses, so colours, fonts and axis conventions live in one place.
 *
 * Importing this module registers the Chart.js components (once — Chart.js
 * de-duplicates), so chart modules import `Chart` from here, not "chart.js".
 */
import {
  Chart,
  BarController,
  BarElement,
  CategoryScale,
  Filler,
  Legend,
  LinearScale,
  LineController,
  LineElement,
  PointElement,
  Tooltip,
} from "chart.js";
import { COLOURS } from "@/styles/design";
import { PLAYER_LABEL } from "@/components/outcome";

Chart.register(
  BarController,
  BarElement,
  LineController,
  LineElement,
  PointElement,
  CategoryScale,
  LinearScale,
  Filler,
  Tooltip,
  Legend,
);

export { Chart };

const AXIS_FONT = { size: 11 } as const;

/** Tooltip chrome (colours and border); spread into `plugins.tooltip` alongside chart-specific callbacks. */
export const TOOLTIP_THEME = {
  backgroundColor: COLOURS.tooltipBg,
  titleColor: COLOURS.tooltipTitle,
  bodyColor: COLOURS.tooltipBody,
  borderColor: COLOURS.tooltipBorder,
  borderWidth: 1,
} as const;

/** Tick styling for any axis; spread in and add `stepSize`/`callback` as needed. */
export const AXIS_TICKS = { color: COLOURS.chartText, font: AXIS_FONT } as const;

/** Gridline styling for value axes. */
export const AXIS_GRID = { color: COLOURS.chartGrid } as const;

/** Axis title in the chart text style. */
export function axisTitle(text: string): { display: true; text: string; color: string; font: typeof AXIS_FONT } {
  return { display: true, text, color: COLOURS.chartText, font: AXIS_FONT };
}

/** The x axis of every time-series chart: one point per game, tick labels hidden. */
export const GAME_AXIS = { ticks: { display: false }, title: axisTitle("Game #") } as const;

/**
 * Title for a value axis signed by player: hubby below zero, wifey above,
 * e.g. "← Hubby   Wins   Wifey →".
 */
export function divergingAxisTitle(metric: string): ReturnType<typeof axisTitle> {
  return axisTitle(`← ${PLAYER_LABEL.hubby}   ${metric}   ${PLAYER_LABEL.wifey} →`);
}

/** Colour of whoever a signed value favours (positive = wifey, negative = hubby, zero = draw). */
export function leadColour(value: number): string {
  return value > 0 ? COLOURS.wifey : value < 0 ? COLOURS.hubby : COLOURS.draw;
}

/** Tick label with an explicit "+" for positive values, so the wifey side reads as a lead. */
export function signedTick(value: number | string): string {
  return Number(value) > 0 ? `+${Number(value)}` : String(value);
}
