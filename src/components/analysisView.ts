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
import { COLOURS } from "@/styles/design";
import type { GameResult, Player } from "@/types/domain";
import type { PlayerTally } from "@/types/tally";

Chart.register(
  BarController,
  BarElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
);

export interface AnalysisNav {
  prev: string | null;
  next: string | null;
}

/**
 * Renders the single-game breakdown: header, per-category table and bar chart,
 * each score shown against that player's all-time category average.
 *
 * Averages come from the tally's per-player category records, so differences
 * here match the main page exactly. Replaces `el`'s contents and creates a
 * Chart.js instance.
 */
export function renderAnalysisView(
  el: HTMLElement,
  result: GameResult,
  players: Record<Player, PlayerTally>,
  nav?: AnalysisNav,
): void {
  const { gameId, categories, totals: { wifey: totalWifey, hubby: totalHubby }, winner, tiebreaker, margin } =
    result;

  const winnerText =
    winner === "draw" ? "Draw" : winner === "wifey" ? "Wifey" : "Hubby";
  const winnerClass =
    winner === "draw"
      ? "winner--draw"
      : winner === "wifey"
        ? "winner--wifey"
        : "winner--hubby";
  const marginText =
    winner === "draw" || tiebreaker ? "0" : String(Math.abs(margin));

  const prevBtn = nav?.prev
    ? `<a href="${nav.prev}" class="analysis-nav-btn" title="Previous game">&#8249;</a>`
    : `<span class="analysis-nav-btn analysis-nav-btn--disabled">&#8249;</span>`;
  const nextBtn = nav?.next
    ? `<a href="${nav.next}" class="analysis-nav-btn" title="Next game">&#8250;</a>`
    : `<span class="analysis-nav-btn analysis-nav-btn--disabled">&#8250;</span>`;
  const totalWinnerClass =
    winner === "draw"
      ? "winner--draw"
      : winner === "wifey"
        ? "winner--wifey"
        : "winner--hubby";
  const totalWinnerRowClass =
    winner === "draw"
      ? "row--draw"
      : winner === "wifey"
        ? "row--wifey"
        : "row--hubby";
  const totalWinnerText =
    winner === "draw" ? "Draw" : winner === "wifey" ? "Wifey" : "Hubby";

  // Per-category averages across every game containing that category (needed for table and chart)
  const averagesOf = (player: Player): Record<string, number> =>
    Object.fromEntries(Object.entries(players[player].categories).map(([cat, rec]) => [cat, rec.avg]));
  const wifeyByCategory = averagesOf("wifey");
  const hubbyByCategory = averagesOf("hubby");

  const tableRows =
    categories
      .map((c) => {
        const catWinnerClass =
          c.winner === "draw"
            ? "winner--draw"
            : c.winner === "wifey"
              ? "winner--wifey"
              : "winner--hubby";
        const catWinnerRowClass =
          c.winner === "draw"
            ? "row--draw"
            : c.winner === "wifey"
              ? "row--wifey"
              : "row--hubby";
        const catWinnerText =
          c.winner === "draw"
            ? "Draw"
            : c.winner === "wifey"
              ? "Wifey"
              : "Hubby";

        // Calculate difference from average for each player
        const wifeyAvg = wifeyByCategory[c.category] ?? 0;
        const hubbyAvg = hubbyByCategory[c.category] ?? 0;
        const wifeyDiff = c.wifey - wifeyAvg;
        const hubbyDiff = c.hubby - hubbyAvg;
        const wifeyDiffStr =
          wifeyDiff >= 0 ? `+${wifeyDiff.toFixed(1)}` : wifeyDiff.toFixed(1);
        const hubbyDiffStr =
          hubbyDiff >= 0 ? `+${hubbyDiff.toFixed(1)}` : hubbyDiff.toFixed(1);

        return `
        <tr class=${catWinnerRowClass}>
          <td>${c.category}</td>
          <td class="col-right col-wifey">${c.wifey}<br><span class="category-diff">(${wifeyDiffStr})</span></td>
          <td class="col-right col-hubby">${c.hubby}<br><span class="category-diff">(${hubbyDiffStr})</span></td>
          <td class="col-right ${catWinnerClass}">${catWinnerText}</td>
          <td class="col-right ${catWinnerClass}">${c.margin}</td>
        </tr>`;
      })
      .join("") +
    // totals
    (() => {
      const avgTotalWifey = categories.reduce(
        (sum, c) => sum + (wifeyByCategory[c.category] ?? 0),
        0,
      );
      const avgTotalHubby = categories.reduce(
        (sum, c) => sum + (hubbyByCategory[c.category] ?? 0),
        0,
      );
      const wifeyTotalDiff = totalWifey - avgTotalWifey;
      const hubbyTotalDiff = totalHubby - avgTotalHubby;
      const wifeyTotalDiffStr =
        wifeyTotalDiff >= 0
          ? `+${wifeyTotalDiff.toFixed(1)}`
          : wifeyTotalDiff.toFixed(1);
      const hubbyTotalDiffStr =
        hubbyTotalDiff >= 0
          ? `+${hubbyTotalDiff.toFixed(1)}`
          : hubbyTotalDiff.toFixed(1);
      return `<tr class=table-row--total ${totalWinnerRowClass}>
        <td><strong><i>TOTAL</i></strong></td>
        <td class="col-right col-wifey">${totalWifey}<br><span class="category-diff">(${wifeyTotalDiffStr})</span></td>
        <td class="col-right col-hubby">${totalHubby}<br><span class="category-diff">(${hubbyTotalDiffStr})</span></td>
        <td class="col-right ${totalWinnerClass}">${totalWinnerText}</td>
        <td class="col-right ${totalWinnerClass}">${Math.abs(margin)}</td>
      </tr>`;
    })();
  el.innerHTML = `
    <div class="analysis-header">
      <div class="analysis-game-nav">
        ${prevBtn}
        <h2>Game #${gameId}</h2>
        ${nextBtn}
      </div>
      <div class="analysis-result">
      <span class="${winnerClass}">${winnerText}</span>
      ${tiebreaker ? `<span class="analysis-tiebreaker">(tiebreaker)</span>` : ""}
      ${winner !== "draw" ? `<span class="analysis-margin">by ${marginText}</span>` : ""}
      </div>
      <div class="analysis-totals">
        <span class="col-wifey">Wifey </span><span>${totalWifey}</span>
        <span class="analysis-totals-sep">·</span>
        <span class="col-hubby">Hubby </span><span>${totalHubby}</span>
      </div>
    </div>

    <div class="analysis-table-wrap">
      <table class="analysis-table">
        <thead>
          <tr>
            <th>Category</th>
            <th class="col-right col-wifey">Wifey</th>
            <th class="col-right col-hubby">Hubby</th>
            <th class="col-right">Winner</th>
            <th class="col-right">Margin</th>
          </tr>
        </thead>
        <tbody>${tableRows}</tbody>
      </table>
    </div>

    <div class="analysis-chart-wrap">
      <canvas id="analysis-chart-${gameId}"></canvas>
    </div>`;

  // Size the chart container to fit all category bars
  const chartWrap = el.querySelector<HTMLElement>(".analysis-chart-wrap")!;
  chartWrap.style.height = `${categories.length * 60 + 60}px`;

  const canvas = document.getElementById(
    `analysis-chart-${gameId}`,
  ) as HTMLCanvasElement | null;
  if (!canvas) return;

  // Prepare data for datasets
  const wifeyValues = categories.map((c) => c.wifey);
  const hubbyValues = categories.map((c) => c.hubby);

  // Draw value labels at the base of each bar (just right of the axis)
  const dataLabelsPlugin: Plugin<"bar"> = {
    id: "dataLabels",
    afterDatasetsDraw(chart) {
      const { ctx } = chart;
      // Only label the first two datasets (actual game values)
      for (let di = 0; di < 2; di++) {
        const ds = chart.data.datasets[di];
        if (!ds) continue;
        const meta = chart.getDatasetMeta(di);
        meta.data.forEach((el, i) => {
          const value = ds.data[i] as number;
          const bar = el as unknown as { base: number; y: number };
          ctx.save();
          ctx.fillStyle = COLOURS.chartText;
          ctx.font = "11px system-ui, -apple-system, sans-serif";
          ctx.textAlign = "left";
          ctx.textBaseline = "middle";
          ctx.fillText(String(value), bar.base + 4, bar.y);
          ctx.restore();
        });
      }
    },
  };

  // Draw black dashed vertical lines at average values on top of each bar
  const averageLinesPlugin: Plugin<"bar"> = {
    id: "averageLines",
    afterDatasetsDraw(chart) {
      const { ctx, scales } = chart;
      if (!scales.x) return;

      const xScale = scales.x;

      // Draw average lines for wifey (dataset 0) and hubby (dataset 1)
      [0, 1].forEach((datasetIndex) => {
        const meta = chart.getDatasetMeta(datasetIndex);
        if (!meta.data || meta.hidden) return;

        meta.data.forEach((element, categoryIndex) => {
          const categoryName = categories[categoryIndex]?.category;
          if (!categoryName) return;

          const avg =
            datasetIndex === 0
              ? (wifeyByCategory[categoryName] ?? 0)
              : (hubbyByCategory[categoryName] ?? 0);

          const xPos = xScale.getPixelForValue(avg);

          const bar = element as unknown as { y: number };
          const barHeight = 12; // Approximate bar height for line extent

          ctx.save();
          ctx.strokeStyle = "#000000";
          ctx.lineWidth = 2;
          ctx.setLineDash([4, 3]);
          ctx.beginPath();
          ctx.moveTo(xPos, bar.y - barHeight);
          ctx.lineTo(xPos, bar.y + barHeight);
          ctx.stroke();
          ctx.restore();
        });
      });
    },
  };

  // Find the absolute highest value across all actual scores and averages
  const wifeyAverages = categories.map((c) => wifeyByCategory[c.category] ?? 0);
  const hubbyAverages = categories.map((c) => hubbyByCategory[c.category] ?? 0);

  const maxActualValue = Math.max(...wifeyValues, ...hubbyValues);
  const maxAverageValue = Math.max(...wifeyAverages, ...hubbyAverages);

  // Basic max for consistency to ensure the chart always has a defined upper bound
  const basicMax: number = 60;

  // Determine if the highest average is greater than the highest actual score
  const calculatedMax = Math.max(maxActualValue, maxAverageValue);

  // Padding to allow slight overshoot for neateness (exclude basicMax because round numbers)
  const xAxisMax = Math.max(basicMax, Math.ceil(calculatedMax * 1.05));

  new Chart(canvas, {
    type: "bar",
    plugins: [dataLabelsPlugin, averageLinesPlugin],
    data: {
      labels: categories.map((c) => c.category),
      datasets: [
        {
          label: "Wifey",
          data: wifeyValues,
          backgroundColor: COLOURS.wifeyFill,
          borderColor: COLOURS.wifey,
          borderWidth: 2,
          borderRadius: 3,
        },
        {
          label: "Hubby",
          data: hubbyValues,
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
          max: xAxisMax,
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
          callbacks: {
            afterLabel(context) {
              const categoryName = categories[context.dataIndex]?.category;
              const value = context.parsed.x;
              if (!categoryName || value === null || value === undefined)
                return "";

              if (context.datasetIndex === 0) {
                // Wifey actual vs avg
                const avg = wifeyByCategory[categoryName] ?? 0;
                const diff = (value - avg).toFixed(1);
                const sign = parseFloat(diff) >= 0 ? "+" : "";
                return `Average: ${avg.toFixed(1)}\nDifference: ${sign}${diff}`;
              } else if (context.datasetIndex === 1) {
                // Hubby actual vs avg
                const avg = hubbyByCategory[categoryName] ?? 0;
                const diff = (value - avg).toFixed(1);
                const sign = parseFloat(diff) >= 0 ? "+" : "";
                return `Average: ${avg.toFixed(1)}\nDifference: ${sign}${diff}`;
              }

              return "";
            },
          },
        },
      },
    },
  });
}
