import {
  Chart,
  BarController,
  BarElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
  type Plugin,
} from "chart.js";
import { parseGame } from "@/data/parser";
import { COLOURS } from "@/styles/design";
import type { RawGame } from "@/types/raw";

Chart.register(BarController, BarElement, CategoryScale, LinearScale, Tooltip, Legend);

export interface AnalysisNav {
  prev: string | null;
  next: string | null;
}

export function renderAnalysisView(
  el: HTMLElement,
  game: RawGame,
  nav?: AnalysisNav,
  allGames?: RawGame[]
): void {
  const result = parseGame(game);
  const { categories, totalWifey, totalHubby, winner, tiebreaker, margin } = result;

  const winnerText =
    winner === "draw" ? "Draw" : winner === "wifey" ? "Wifey" : "Hubby";
  const winnerClass =
    winner === "draw" ? "winner--draw" : winner === "wifey" ? "winner--wifey" : "winner--hubby";
  const marginText =
    winner === "draw" || tiebreaker ? "0" : String(Math.abs(margin));

  const prevBtn = nav?.prev
    ? `<a href="${nav.prev}" class="analysis-nav-btn" title="Previous game">&#8249;</a>`
    : `<span class="analysis-nav-btn analysis-nav-btn--disabled">&#8249;</span>`;
  const nextBtn = nav?.next
    ? `<a href="${nav.next}" class="analysis-nav-btn" title="Next game">&#8250;</a>`
    : `<span class="analysis-nav-btn analysis-nav-btn--disabled">&#8250;</span>`;

  const tableRows = categories
    .map((c) => {
      const catWinnerClass =
        c.winner === "draw" ? "winner--draw" : c.winner === "wifey" ? "winner--wifey" : "winner--hubby";
      const catWinnerText =
        c.winner === "draw" ? "Draw" : c.winner === "wifey" ? "Wifey" : "Hubby";
      return `
        <tr>
          <td>${c.category}</td>
          <td class="col-right col-hubby">${c.hubby}</td>
          <td class="col-right col-wifey">${c.wifey}</td>
          <td class="col-right ${catWinnerClass}">${catWinnerText}</td>
          <td class="col-right">${c.margin}</td>
        </tr>`;
    })
    .join("");

  el.innerHTML = `
    <div class="analysis-header">
      <div class="analysis-game-nav">
        ${prevBtn}
        <h2>Game #${game.game_id}</h2>
        ${nextBtn}
      </div>
      <div class="analysis-result">
        <span class="${winnerClass}">${winnerText}</span>
        ${tiebreaker ? `<span class="analysis-tiebreaker">(tiebreaker)</span>` : ""}
        ${winner !== "draw" ? `<span class="analysis-margin">by ${marginText}</span>` : ""}
      </div>
      <div class="analysis-totals">
        <span class="col-wifey">Wifey ${totalWifey}</span>
        <span class="analysis-totals-sep">·</span>
        <span class="col-hubby">Hubby ${totalHubby}</span>
      </div>
    </div>

    <div class="analysis-chart-wrap">
      <canvas id="analysis-chart-${game.game_id}"></canvas>
    </div>

    <div class="analysis-table-wrap">
      <table class="analysis-table">
        <thead>
          <tr>
            <th>Category</th>
            <th class="col-right col-hubby">Hubby</th>
            <th class="col-right col-wifey">Wifey</th>
            <th class="col-right">Winner</th>
            <th class="col-right">Margin</th>
          </tr>
        </thead>
        <tbody>${tableRows}</tbody>
      </table>
    </div>`;

  // Size the chart container to fit all category bars
  const chartWrap = el.querySelector<HTMLElement>(".analysis-chart-wrap")!;
  chartWrap.style.height = `${categories.length * 60 + 60}px`;

  const canvas = document.getElementById(
    `analysis-chart-${game.game_id}`
  ) as HTMLCanvasElement | null;
  if (!canvas) return;

  const wifeyAvg = categories.reduce((s, c) => s + c.wifey, 0) / categories.length;
  const hubbyAvg = categories.reduce((s, c) => s + c.hubby, 0) / categories.length;

  // Draw value labels at the base of each bar (just right of the axis)
  const dataLabelsPlugin: Plugin<"bar"> = {
    id: "dataLabels",
    afterDatasetsDraw(chart) {
      const { ctx } = chart;
      chart.data.datasets.forEach((_ds, di) => {
        const meta = chart.getDatasetMeta(di);
        meta.data.forEach((el, i) => {
          const value = chart.data.datasets[di]!.data[i] as number;
          const bar = el as unknown as { base: number; y: number };
          ctx.save();
          ctx.fillStyle = COLOURS.chartText;
          ctx.font = "11px system-ui, -apple-system, sans-serif";
          ctx.textAlign = "left";
          ctx.textBaseline = "middle";
          ctx.fillText(String(value), bar.base + 4, bar.y);
          ctx.restore();
        });
      });
    },
  };

  // Draw soft dashed average reference lines for each player
  const avgLinesPlugin: Plugin<"bar"> = {
    id: "avgLines",
    afterDatasetsDraw(chart) {
      const { ctx, chartArea, scales } = chart;
      if (!chartArea) return;
      const xScale = scales["x"]!;
      (
        [
          [wifeyAvg, COLOURS.wifey],
          [hubbyAvg, COLOURS.hubby],
        ] as [number, string][]
      ).forEach(([avg, colour]) => {
        const x = xScale.getPixelForValue(avg);
        ctx.save();
        ctx.strokeStyle = colour + "55";
        ctx.lineWidth = 1.5;
        ctx.setLineDash([4, 3]);
        ctx.beginPath();
        ctx.moveTo(x, chartArea.top);
        ctx.lineTo(x, chartArea.bottom);
        ctx.stroke();
        ctx.restore();
      });
    },
  };

  new Chart(canvas, {
    type: "bar",
    plugins: [dataLabelsPlugin, avgLinesPlugin],
    data: {
      labels: categories.map((c) => c.category),
      datasets: [
        {
          label: "Wifey",
          data: categories.map((c) => c.wifey),
          backgroundColor: COLOURS.wifeyFill,
          borderColor: COLOURS.wifey,
          borderWidth: 2,
          borderRadius: 3,
        },
        {
          label: "Hubby",
          data: categories.map((c) => c.hubby),
          backgroundColor: COLOURS.hubbyFill,
          borderColor: COLOURS.hubby,
          borderWidth: 2,
          borderRadius: 3,
        },
      ],
    },
    options: {
      indexAxis: "y",
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        x: {
          beginAtZero: true,
          grid: { color: COLOURS.chartGrid },
          ticks: { color: COLOURS.chartText, font: { size: 11 } },
        },
        y: {
          grid: { display: false },
          ticks: { color: COLOURS.chartText, font: { size: 11 } },
        },
      },
      plugins: {
        legend: { labels: { color: COLOURS.chartText } },
        tooltip: {
          backgroundColor: COLOURS.tooltipBg,
          titleColor: COLOURS.tooltipTitle,
          bodyColor: COLOURS.tooltipBody,
          borderColor: COLOURS.tooltipBorder,
          borderWidth: 1,
        },
      },
    },
  });
}
