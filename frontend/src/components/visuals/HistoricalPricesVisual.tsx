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
} from "chart.js";
import { Line } from "react-chartjs-2";
import type {
  HistoricalPricesVisualProps,
  HistoricalPriceViewMode,
} from "../../types/historicalPrices";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
);

const TICKER_COLORS = [
  "#38bdf8", // Sky blue
  "#818cf8", // Indigo
  "#34d399", // Emerald
  "#f472b6", // Pink
  "#fbbf24", // Amber
  "#a78bfa", // Purple
  "#f87171", // Rose
  "#2dd4bf", // Teal
  "#fb923c", // Orange
  "#60a5fa", // Blue
];

const formatCurrency = (val: number): string =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(val);

export const HistoricalPricesVisual: React.FC<HistoricalPricesVisualProps> = ({
  data,
  initialInvestment = 10000,
  loading = false,
}) => {
  const [viewMode, setViewMode] =
    useState<HistoricalPriceViewMode>("portfolio");

  const chartData = useMemo<ChartData<"line"> | null>(() => {
    if (!data || !data.dates || data.dates.length === 0) return null;

    const labels = data.dates;
    const datasets: ChartData<"line">["datasets"] = [];

    if (viewMode === "portfolio") {
      datasets.push({
        label: `Portfolio Valuation ($${(data.initial_investment ?? initialInvestment).toLocaleString()})`,
        data: data.portfolio_values,
        borderColor: "#6366f1",
        backgroundColor: "rgba(99, 102, 241, 0.1)",
        borderWidth: 2.5,
        pointRadius: 0,
        fill: true,
        tension: 0.1,
      });
    } else if (viewMode === "all_tickers") {
      data.tickers.forEach((ticker, index) => {
        const series = data.normalized_values[ticker] ?? [];
        datasets.push({
          label: `${ticker} ($ growth)`,
          data: series,
          borderColor: TICKER_COLORS[index % TICKER_COLORS.length],
          borderWidth: 1.8,
          pointRadius: 0,
          fill: false,
          tension: 0.1,
        });
      });
    } else if (viewMode === "raw_prices") {
      data.tickers.forEach((ticker, index) => {
        const series = data.prices[ticker] ?? [];
        datasets.push({
          label: `${ticker} (Price USD)`,
          data: series,
          borderColor: TICKER_COLORS[index % TICKER_COLORS.length],
          borderWidth: 1.8,
          pointRadius: 0,
          fill: false,
          tension: 0.1,
        });
      });
    }

    return { labels, datasets };
  }, [data, viewMode, initialInvestment]);

  const chartOptions = useMemo<ChartOptions<"line">>(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      animation: false,
      plugins: {
        legend: {
          position: "top" as const,
          labels: {
            color: "#e2e8f0",
            font: { weight: "bold" },
            boxWidth: 14,
          },
        },
        tooltip: {
          mode: "index",
          intersect: false,
          callbacks: {
            label: (context) => {
              const label = context.dataset.label ?? "";
              const val = Number(context.parsed.y);
              return `${label}: ${formatCurrency(val)}`;
            },
          },
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
            callback: (value: string | number) => formatCurrency(Number(value)),
          },
          title: {
            display: true,
            text:
              viewMode === "raw_prices"
                ? "Stock Price (USD $)"
                : "Valuation (USD $)",
            color: "#94a3b8",
          },
        },
      },
    }),
    [viewMode],
  );

  const stats = data?.statistics;
  const isProfit = (stats?.total_profit_loss ?? 0) >= 0;

  return (
    <section className="dashboard-section">
      <div className="section-header">
        <div>
          <h2>2-Year Historical Price & Valuation Performance</h2>
          <p className="instruction">
            Historical trajectory of your portfolio and assets over the last 2
            years, based on an initial investment of{" "}
            <strong>
              {formatCurrency(data?.initial_investment ?? initialInvestment)}
            </strong>
            .
          </p>
        </div>

        <div className="display-options">
          <label htmlFor="historical-view-mode-select">View Mode:</label>
          <select
            id="historical-view-mode-select"
            value={viewMode}
            onChange={(event) =>
              setViewMode(event.target.value as HistoricalPriceViewMode)
            }
          >
            <option value="portfolio">Portfolio Valuation ($)</option>
            <option value="all_tickers">Tickers Scaled ($)</option>
            <option value="raw_prices">Raw Stock Prices ($)</option>
          </select>
        </div>
      </div>

      {stats && (
        <div className="stats-cards-grid">
          <div className="stat-card">
            <span className="stat-label">Initial Investment</span>
            <span className="stat-value">
              {formatCurrency(stats.initial_value)}
            </span>
            <span className="stat-sub">Starting capital (2 years ago)</span>
          </div>

          <div className="stat-card">
            <span className="stat-label">Final Valuation</span>
            <span className="stat-value">
              {formatCurrency(stats.final_value)}
            </span>
            <span className="stat-sub">Current portfolio value</span>
          </div>

          <div className={`stat-card ${isProfit ? "success" : "warning"}`}>
            <span className="stat-label">Total Profit / Loss</span>
            <span className="stat-value">
              {isProfit ? "+" : ""}
              {formatCurrency(stats.total_profit_loss)}
            </span>
            <span className="stat-sub">
              Net return: {isProfit ? "+" : ""}
              {(stats.total_return_pct * 100).toFixed(2)}%
            </span>
          </div>

          <div className="stat-card">
            <span className="stat-label">Min Portfolio Value</span>
            <span className="stat-value">
              {formatCurrency(stats.min_portfolio_value)}
            </span>
            <span className="stat-sub">2-year lowest point</span>
          </div>

          <div className="stat-card success">
            <span className="stat-label">Max Portfolio Value</span>
            <span className="stat-value">
              {formatCurrency(stats.max_portfolio_value)}
            </span>
            <span className="stat-sub">2-year peak valuation</span>
          </div>
        </div>
      )}

      <div className="chart-container">
        {chartData ? (
          <Line data={chartData} options={chartOptions} />
        ) : (
          <div className="chart-placeholder">
            {loading
              ? "Retrieving 2-year market history & computing valuations..."
              : "Run simulation to view historical 2-year prices"}
          </div>
        )}
      </div>
    </section>
  );
};
