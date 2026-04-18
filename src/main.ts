import "@/styles/main.css";
import { results, tally } from "@/data/dataLoader";
import { renderSummaryBar } from "@/components/summaryBar";
import { renderGamesTable } from "@/components/gamesTable";
import { renderRunningTallyChart } from "@/components/charts/runningTallyChart";
import { renderMarginChart } from "@/components/charts/marginChart";
import { renderStreakBarChart } from "@/components/charts/streakBarChart";

if (import.meta.env.VITE_ADMIN_MODE === "true") {
  const header = document.querySelector("header");
  if (header) {
    const link = document.createElement("a");
    link.href = "/admin/";
    link.textContent = "Admin";
    link.className = "admin-link";
    header.appendChild(link);
  }
}

const summaryBarEl = document.getElementById("summary-bar");
const gamesTableEl = document.getElementById("games-table");
const streaksEl = document.getElementById("chart-streaks");
const runningTallyEl = document.getElementById("chart-running-tally");
const marginEl = document.getElementById("chart-margin");

if (summaryBarEl) renderSummaryBar(tally, summaryBarEl);
if (gamesTableEl) renderGamesTable(results, tally.runningHistory, gamesTableEl);
if (streaksEl instanceof HTMLCanvasElement) renderStreakBarChart(tally, streaksEl);
if (runningTallyEl instanceof HTMLCanvasElement) renderRunningTallyChart(tally, runningTallyEl);
if (marginEl instanceof HTMLCanvasElement) renderMarginChart(tally, marginEl);
