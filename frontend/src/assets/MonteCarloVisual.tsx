import React, { useMemo, useState } from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  type ChartData,
  type ChartOptions,
  type LegendItem,
} from "chart.js";
import { Line } from "react-chartjs-2";
import type { MonteCarloResponse } from "./types";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
);

export interface MonteCarloVisualProps {
  data: MonteCarloResponse | null;
  loading?: boolean;
  initialDisplayPaths?: number;
}

export const MonteCarloVisual: React.FC<MonteCarloVisualProps> = ({
  data,
  loading = false,
  initialDisplayPaths = 40,
}) => {
  const [maxDisplayPaths, setMaxDisplayPaths] = useState<number>(initialDisplayPaths);

  const chartData = useMemo<ChartData<"line"> | null>(() => {
    if (!data) return null;

    const labels = data.days.map((d) => `Day ${d}`);
    const datasets: ChartData<"line">["datasets"] = [];

    // Individual sample trajectories
    const sampledTrajectories = data.trajectories.slice(0, maxDisplayPaths);
    sampledTrajectories.forEach((traj, idx) => {
      datasets.push({
        label: `Path ${idx + 1}`,
        data: traj,
        borderColor: "rgba(99, 102, 241, 0.18)",
        borderWidth: 1,
        pointRadius: 0,
        fill: false,
        tension: 0.1,
      });
    });

    // Key percentile bands
    if (data.percentile_bands) {
      if (data.percentile_bands["95"]) {
        datasets.push({
          label: "95th Percentile",
          data: data.percentile_bands["95"],
          borderColor: "#10b981",
          borderWidth: 2.5,
          borderDash: [5, 5],
          pointRadius: 0,
          fill: false,
        });
      }
      if (data.percentile_bands["50"]) {
        datasets.push({
          label: "Median (P50)",
          data: data.percentile_bands["50"],
          borderColor: "#3b82f6",
          borderWidth: 3,
          pointRadius: 0,
          fill: false,
        });
      }
      if (data.percentile_bands["5"]) {
        datasets.push({
          label: "5th Percentile",
          data: data.percentile_bands["5"],
          borderColor: "#ef4444",
          borderWidth: 2.5,
          borderDash: [5, 5],
          pointRadius: 0,
          fill: false,
        });
      }
    }

    return { labels, datasets };
  }, [data, maxDisplayPaths]);

  const chartOptions = useMemo<ChartOptions<"line">>(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      animation: false,
      plugins: {
        legend: {
          position: "top" as const,
          labels: {
            filter: (item: LegendItem) => {
              const text = item.text ?? "";
              return text.includes("Percentile") || text.includes("Median");
            },
            color: "#e2e8f0",
            font: { weight: "bold" },
          },
        },
        tooltip: {
          mode: "index",
          intersect: false,
        },
      },
      scales: {
        x: {
          grid: { color: "rgba(255, 255, 255, 0.05)" },
          ticks: { color: "#94a3b8", maxTicksLimit: 12 },
        },
        y: {
          grid: { color: "rgba(255, 255, 255, 0.05)" },
          ticks: {
            color: "#94a3b8",
            callback: (value: string | number) =>
              `${(Number(value) * 100).toFixed(0)}%`,
          },
          title: {
            display: true,
            text: "Relative Portfolio Value (Base 100%)",
            color: "#94a3b8",
          },
        },
      },
    }),
    [],
  );

  return (
    <section className="dashboard-section">
      <div className="section-header">
        <h2>2. Monte Carlo Simulation (Paths & Percentiles)</h2>
        <div className="display-options">
          <label htmlFor="display-paths-select">Displayed paths:</label>
          <select
            id="display-paths-select"
            value={maxDisplayPaths}
            onChange={(e) => setMaxDisplayPaths(Number(e.target.value))}
          >
            <option value={20}>20 paths</option>
            <option value={40}>40 paths</option>
            <option value={80}>80 paths</option>
            <option value={150}>150 paths</option>
          </select>
        </div>
      </div>

      {data?.statistics && (
        <div className="stats-cards-grid">
          <div className="stat-card">
            <span className="stat-label">Expected Terminal Value (Mean)</span>
            <span className="stat-value">
              {(data.statistics.mean_terminal_value * 100).toFixed(2)}%
            </span>
            <span className="stat-sub">
              Return: {((data.statistics.mean_terminal_value - 1) * 100).toFixed(2)}%
            </span>
          </div>
          <div className="stat-card">
            <span className="stat-label">Terminal Median</span>
            <span className="stat-value">
              {(data.statistics.median_terminal_value * 100).toFixed(2)}%
            </span>
            <span className="stat-sub">50th Percentile</span>
          </div>
          <div className="stat-card warning">
            <span className="stat-label">Probability of Loss</span>
            <span className="stat-value">
              {(data.statistics.probability_of_loss * 100).toFixed(2)}%
            </span>
            <span className="stat-sub">P(Return &lt; 0)</span>
          </div>
          <div className="stat-card">
            <span className="stat-label">5th Percentile (95% VaR)</span>
            <span className="stat-value">
              {(data.statistics.percentile_5_terminal_value * 100).toFixed(2)}%
            </span>
            <span className="stat-sub">Adverse scenario</span>
          </div>
          <div className="stat-card success">
            <span className="stat-label">95th Percentile</span>
            <span className="stat-value">
              {(data.statistics.percentile_95_terminal_value * 100).toFixed(2)}%
            </span>
            <span className="stat-sub">Optimistic scenario</span>
          </div>
        </div>
      )}

      <div className="chart-container">
        {chartData ? (
          <Line data={chartData} options={chartOptions} />
        ) : (
          <div className="chart-placeholder">
            {loading
              ? "Generating stochastic simulations..."
              : "Run simulation to view paths"}
          </div>
        )}
      </div>
    </section>
  );
};
