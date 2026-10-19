import { useState, useMemo, useEffect } from "react";
import "./App.css";
import nasdaqData from "./data/NASDAQ.json";
import nyseData from "./data/NYSE.json";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { Line } from "react-chartjs-2";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

const API_BASE = "http://localhost:8000";

interface CorrelationResponse {
  tickers: string[];
  observations: number;
  method: string;
  correlation_matrix: Record<string, Record<string, number>>;
}

interface MonteCarloResponse {
  tickers: string[];
  days: number[];
  simulations: number;
  initial_portfolio_value: number;
  weights: Record<string, number>;
  trajectories: number[][];
  percentile_bands: Record<string, number[]>;
  statistics: {
    mean_terminal_value: number;
    median_terminal_value: number;
    probability_of_loss: number;
    percentile_5_terminal_value: number;
    percentile_95_terminal_value: number;
  };
}

interface OptimizeResponse {
  objective: "min_variance" | "max_sharpe";
  tickers: string[];
  weights: Record<string, number>;
  metrics: {
    expected_annual_return: number;
    annual_variance: number;
    annual_volatility: number;
    sharpe_ratio: number | null;
    risk_free_rate: number;
    weights_sum: number;
  };
  constraints: {
    long_only: boolean;
    minimum_weight: number;
    maximum_weight: number;
    weights_sum_to_one: boolean;
  };
}

const DEFAULT_TICKERS = [
  "TSLA",
  "AAPL",
  "MSFT",
  "AMZN",
  "GOOGL",
  "META",
  "NVDA",
  "NFLX",
  "AMD",
  "INTC",
];

function App() {
  const [selectedTickers, setSelectedTickers] = useState<string[]>(DEFAULT_TICKERS);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [isDropdownOpen, setIsDropdownOpen] = useState<boolean>(false);

  // Simulation and optimization parameters
  const [daysToPredict, setDaysToPredict] = useState<number>(252);
  const [simulations, setSimulations] = useState<number>(500);
  const [objective, setObjective] = useState<"min_variance" | "max_sharpe">("min_variance");
  const [riskFreeRate, setRiskFreeRate] = useState<number>(0.04);
  const [maxDisplayPaths, setMaxDisplayPaths] = useState<number>(40);

  // Data states
  const [mcData, setMcData] = useState<MonteCarloResponse | null>(null);
  const [corrData, setCorrData] = useState<CorrelationResponse | null>(null);
  const [optData, setOptData] = useState<OptimizeResponse | null>(null);

  // Loading and error states
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Consolidated unique list of available tickers
  const allAvailableTickers = useMemo(() => {
    const list = Array.from(new Set([...nasdaqData, ...nyseData]));
    return list.sort();
  }, []);

  // Search suggestions when at least 2 characters are entered
  const suggestions = useMemo(() => {
    const trimmed = searchTerm.trim().toUpperCase();
    if (trimmed.length < 2) return [];

    const startsWith = allAvailableTickers.filter(
      (t) => t.startsWith(trimmed) && !selectedTickers.includes(t)
    );
    const contains = allAvailableTickers.filter(
      (t) => !t.startsWith(trimmed) && t.includes(trimmed) && !selectedTickers.includes(t)
    );

    return [...startsWith, ...contains].slice(0, 7);
  }, [searchTerm, allAvailableTickers, selectedTickers]);

  const addTicker = (tickerToAdd: string) => {
    const clean = tickerToAdd.trim().toUpperCase();
    if (!clean) return;
    if (selectedTickers.includes(clean)) {
      alert("Asset is already selected.");
      return;
    }
    if (selectedTickers.length >= 10) {
      alert("Exactly 10 tickers are required. Remove one before adding another.");
      return;
    }
    setSelectedTickers([...selectedTickers, clean]);
    setSearchTerm("");
    setIsDropdownOpen(false);
  };

  const removeTicker = (tickerToRemove: string) => {
    setSelectedTickers(selectedTickers.filter((t) => t !== tickerToRemove));
  };

  const resetDefaultTickers = () => {
    setSelectedTickers(DEFAULT_TICKERS);
  };

  const executeAll = async () => {
    if (selectedTickers.length !== 10) {
      setErrorMsg("You must select exactly 10 distinct tickers according to backend requirements.");
      return;
    }

    setLoading(true);
    setErrorMsg(null);

    const portfolioPayload = {
      tickers: selectedTickers,
      days_to_predict: Number(daysToPredict),
      simulations: Number(simulations),
    };

    const optimizePayload = {
      tickers: selectedTickers,
      objective: objective,
      risk_free_rate: Number(riskFreeRate),
    };

    try {
      const [corrRes, mcRes, optRes] = await Promise.all([
        fetch(`${API_BASE}/api/correlation`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(portfolioPayload),
        }),
        fetch(`${API_BASE}/api/monte-carlo`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(portfolioPayload),
        }),
        fetch(`${API_BASE}/api/optimize`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(optimizePayload),
        }),
      ]);

      if (!corrRes.ok) {
        const err = await corrRes.json().catch(() => ({}));
        throw new Error(`Correlation Error: ${err.detail || corrRes.statusText}`);
      }
      if (!mcRes.ok) {
        const err = await mcRes.json().catch(() => ({}));
        throw new Error(`Monte Carlo Error: ${err.detail || mcRes.statusText}`);
      }
      if (!optRes.ok) {
        const err = await optRes.json().catch(() => ({}));
        throw new Error(`Optimization Error: ${err.detail || optRes.statusText}`);
      }

      const corrJson = await corrRes.json();
      const mcJson = await mcRes.json();
      const optJson = await optRes.json();

      setCorrData(corrJson);
      setMcData(mcJson);
      setOptData(optJson);
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to connect to backend APIs.");
    } finally {
      setLoading(false);
    }
  };

  // Initial automatic load
  useEffect(() => {
    executeAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Chart.js data configuration for Monte Carlo
  const chartData = useMemo(() => {
    if (!mcData) return null;

    const labels = mcData.days.map((d) => `Day ${d}`);
    const datasets: any[] = [];

    // Individual sample trajectories
    const sampledTrajectories = mcData.trajectories.slice(0, maxDisplayPaths);
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
    if (mcData.percentile_bands) {
      if (mcData.percentile_bands["95"]) {
        datasets.push({
          label: "95th Percentile",
          data: mcData.percentile_bands["95"],
          borderColor: "#10b981",
          borderWidth: 2.5,
          borderDash: [5, 5],
          pointRadius: 0,
          fill: false,
        });
      }
      if (mcData.percentile_bands["50"]) {
        datasets.push({
          label: "Median (P50)",
          data: mcData.percentile_bands["50"],
          borderColor: "#3b82f6",
          borderWidth: 3,
          pointRadius: 0,
          fill: false,
        });
      }
      if (mcData.percentile_bands["5"]) {
        datasets.push({
          label: "5th Percentile",
          data: mcData.percentile_bands["5"],
          borderColor: "#ef4444",
          borderWidth: 2.5,
          borderDash: [5, 5],
          pointRadius: 0,
          fill: false,
        });
      }
    }

    return { labels, datasets };
  }, [mcData, maxDisplayPaths]);

  const chartOptions: any = {
    responsive: true,
    maintainAspectRatio: false,
    animation: false,
    plugins: {
      legend: {
        position: "top" as const,
        labels: {
          filter: (item: any) =>
            item.text.includes("Percentile") || item.text.includes("Median"),
          color: "#e2e8f0",
          font: { weight: "600" },
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
          callback: (value: any) => `${(Number(value) * 100).toFixed(0)}%`,
        },
        title: {
          display: true,
          text: "Relative Portfolio Value (Base 100%)",
          color: "#94a3b8",
        },
      },
    },
  };

  const getHeatmapColor = (val: number) => {
    if (val >= 1) return "rgba(59, 130, 246, 0.9)";
    if (val >= 0.7) return "rgba(16, 185, 129, 0.75)";
    if (val >= 0.4) return "rgba(52, 211, 153, 0.45)";
    if (val >= 0.1) return "rgba(251, 191, 36, 0.35)";
    if (val >= -0.1) return "rgba(148, 163, 184, 0.25)";
    return "rgba(239, 68, 68, 0.55)";
  };

  return (
    <div className="portfolio-app">
      {/* Header */}
      <header className="app-header">
        <div className="header-content">
          <h1>Monte Carlo Risk & Portfolio Optimizer</h1>
          <p className="subtitle">
            Multi-asset risk simulator, correlation analysis, and mean-variance/Sharpe optimization
          </p>
        </div>
      </header>

      <main className="app-main">
        {/* Section 1: Asset Selection & Search */}
        <section className="config-card">
          <h2>1. Asset Selection ({selectedTickers.length}/10)</h2>
          <p className="instruction">
            The quantitative model requires a portfolio of <strong>exactly 10 distinct assets</strong>.
          </p>

          {/* Search bar with dynamic suggestions */}
          <div className="search-container">
            <div className="search-input-wrapper">
              <span className="search-icon">🔍</span>
              <input
                type="text"
                className="search-input"
                placeholder="Type at least 2 letters to search NASDAQ / NYSE (e.g., AP, TS, NV)..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setIsDropdownOpen(true);
                }}
                onFocus={() => setIsDropdownOpen(true)}
              />
              {searchTerm && (
                <button
                  type="button"
                  className="clear-search-btn"
                  onClick={() => setSearchTerm("")}
                >
                  ✕
                </button>
              )}
            </div>

            {/* Dropdown with up to 7 suggestions */}
            {isDropdownOpen && suggestions.length > 0 && (
              <ul className="suggestions-dropdown">
                {suggestions.map((ticker) => (
                  <li
                    key={ticker}
                    onClick={() => addTicker(ticker)}
                    className="suggestion-item"
                  >
                    <span className="ticker-badge">{ticker}</span>
                    <span className="ticker-action">+ Add to portfolio</span>
                  </li>
                ))}
              </ul>
            )}

            {isDropdownOpen && searchTerm.trim().length >= 2 && suggestions.length === 0 && (
              <div className="no-suggestions">
                No matching assets available
              </div>
            )}
          </div>

          {/* Selected asset chips */}
          <div className="selected-tickers-container">
            {selectedTickers.map((ticker) => (
              <div key={ticker} className="ticker-chip">
                <span>{ticker}</span>
                <button
                  type="button"
                  onClick={() => removeTicker(ticker)}
                  title={`Remove ${ticker}`}
                  className="chip-remove"
                >
                  ×
                </button>
              </div>
            ))}
          </div>

          {selectedTickers.length !== 10 && (
            <div className="ticker-warning">
              ⚠️ You have {selectedTickers.length} tickers selected. Add or remove until you have exactly 10.
            </div>
          )}

          {/* Simulation Controls */}
          <div className="controls-grid">
            <div className="control-group">
              <label>Forecast Horizon (Trading days):</label>
              <input
                type="number"
                min={5}
                max={504}
                value={daysToPredict}
                onChange={(e) => setDaysToPredict(Number(e.target.value))}
              />
              <span className="field-hint">Min: 5 | Max: 504 (252 ≈ 1 year)</span>
            </div>

            <div className="control-group">
              <label>Number of Simulations:</label>
              <input
                type="number"
                min={100}
                max={5000}
                step={100}
                value={simulations}
                onChange={(e) => setSimulations(Number(e.target.value))}
              />
              <span className="field-hint">Min: 100 | Max: 5000</span>
            </div>

            <div className="control-group">
              <label>Optimization Objective:</label>
              <select
                value={objective}
                onChange={(e) => setObjective(e.target.value as any)}
              >
                <option value="min_variance">Minimum Variance (Min Risk)</option>
                <option value="max_sharpe">Maximum Sharpe Ratio (Max Return/Risk)</option>
              </select>
            </div>

            <div className="control-group">
              <label>Risk-Free Rate:</label>
              <input
                type="number"
                min={0}
                max={1}
                step={0.01}
                value={riskFreeRate}
                onChange={(e) => setRiskFreeRate(Number(e.target.value))}
              />
              <span className="field-hint">Example: 0.04 = 4.0% annualized</span>
            </div>
          </div>

          <div className="actions-bar">
            <button
              type="button"
              className="btn-primary"
              onClick={executeAll}
              disabled={loading || selectedTickers.length !== 10}
            >
              {loading ? "Computing quantitative models..." : "▶ Run Simulation & Optimization"}
            </button>
            <button
              type="button"
              className="btn-secondary"
              onClick={resetDefaultTickers}
              disabled={loading}
            >
              Reset to Initial Top 10
            </button>
          </div>

          {errorMsg && <div className="error-banner">❌ {errorMsg}</div>}
        </section>

        {/* Section 2: Monte Carlo Simulation Chart */}
        <section className="dashboard-section">
          <div className="section-header">
            <h2>2. Monte Carlo Simulation (Paths & Percentiles)</h2>
            <div className="display-options">
              <label>Displayed paths:</label>
              <select
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

          {mcData?.statistics && (
            <div className="stats-cards-grid">
              <div className="stat-card">
                <span className="stat-label">Expected Terminal Value (Mean)</span>
                <span className="stat-value">
                  {(mcData.statistics.mean_terminal_value * 100).toFixed(2)}%
                </span>
                <span className="stat-sub">
                  Return: {((mcData.statistics.mean_terminal_value - 1) * 100).toFixed(2)}%
                </span>
              </div>
              <div className="stat-card">
                <span className="stat-label">Terminal Median</span>
                <span className="stat-value">
                  {(mcData.statistics.median_terminal_value * 100).toFixed(2)}%
                </span>
                <span className="stat-sub">50th Percentile</span>
              </div>
              <div className="stat-card warning">
                <span className="stat-label">Probability of Loss</span>
                <span className="stat-value">
                  {(mcData.statistics.probability_of_loss * 100).toFixed(2)}%
                </span>
                <span className="stat-sub">P(Return &lt; 0)</span>
              </div>
              <div className="stat-card">
                <span className="stat-label">5th Percentile (95% VaR)</span>
                <span className="stat-value">
                  {(mcData.statistics.percentile_5_terminal_value * 100).toFixed(2)}%
                </span>
                <span className="stat-sub">Adverse scenario</span>
              </div>
              <div className="stat-card success">
                <span className="stat-label">95th Percentile</span>
                <span className="stat-value">
                  {(mcData.statistics.percentile_95_terminal_value * 100).toFixed(2)}%
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
                {loading ? "Generating stochastic simulations..." : "Run simulation to view paths"}
              </div>
            )}
          </div>
        </section>

        {/* Section 3: Correlation Matrix */}
        <section className="dashboard-section">
          <h2>3. Daily Returns Correlation Matrix (Pearson)</h2>
          <p className="instruction">
            Observations analyzed: {corrData?.observations ?? 0} common historical trading dates.
          </p>

          {corrData?.correlation_matrix ? (
            <div className="matrix-table-wrapper">
              <table className="correlation-table">
                <thead>
                  <tr>
                    <th className="sticky-col">Asset</th>
                    {corrData.tickers.map((ticker) => (
                      <th key={ticker}>{ticker}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {corrData.tickers.map((rowTicker) => (
                    <tr key={rowTicker}>
                      <td className="sticky-col ticker-row-header">{rowTicker}</td>
                      {corrData.tickers.map((colTicker) => {
                        const val = corrData.correlation_matrix[rowTicker]?.[colTicker] ?? 0;
                        return (
                          <td
                            key={colTicker}
                            style={{ backgroundColor: getHeatmapColor(val) }}
                            className="corr-cell"
                            title={`Correlation between ${rowTicker} and ${colTicker}: ${val.toFixed(4)}`}
                          >
                            {val.toFixed(2)}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="table-placeholder">
              {loading ? "Downloading historical prices and estimating correlations..." : "No correlation data available"}
            </div>
          )}
        </section>

        {/* Section 4: Portfolio Optimization Table */}
        <section className="dashboard-section">
          <h2>4. Portfolio Optimization (Markowitz SLSQP)</h2>
          <p className="instruction">
            Objective:{" "}
            <strong>
              {optData?.objective === "max_sharpe"
                ? "Maximum Sharpe Ratio (Highest risk-adjusted return)"
                : "Minimum Variance (Lowest portfolio volatility)"}
            </strong>{" "}
            | Minimum asset allocation weight: 5.0%
          </p>

          {optData?.metrics && (
            <div className="metrics-banner">
              <div className="metric-item">
                <span className="metric-label">Expected Annual Return:</span>
                <span className="metric-num">
                  {(optData.metrics.expected_annual_return * 100).toFixed(2)}%
                </span>
              </div>
              <div className="metric-item">
                <span className="metric-label">Annual Volatility (σ):</span>
                <span className="metric-num">
                  {(optData.metrics.annual_volatility * 100).toFixed(2)}%
                </span>
              </div>
              <div className="metric-item">
                <span className="metric-label">Sharpe Ratio:</span>
                <span className="metric-num">
                  {optData.metrics.sharpe_ratio !== null
                    ? optData.metrics.sharpe_ratio.toFixed(3)
                    : "N/A"}
                </span>
              </div>
              <div className="metric-item">
                <span className="metric-label">Annual Variance (σ²):</span>
                <span className="metric-num">
                  {optData.metrics.annual_variance.toFixed(4)}
                </span>
              </div>
              <div className="metric-item">
                <span className="metric-label">Total Weights Sum:</span>
                <span className="metric-num">
                  {(optData.metrics.weights_sum * 100).toFixed(1)}%
                </span>
              </div>
            </div>
          )}

          {optData?.weights ? (
            <div className="optimization-table-wrapper">
              <table className="optimization-table">
                <thead>
                  <tr>
                    <th>Ticker</th>
                    <th>Optimal Weight (%)</th>
                    <th>Numerical Weight</th>
                    <th>Visual Allocation</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(optData.weights)
                    .sort(([, a], [, b]) => b - a)
                    .map(([ticker, weight]) => {
                      const pct = weight * 100;
                      return (
                        <tr key={ticker}>
                          <td className="opt-ticker-cell">
                            <strong>{ticker}</strong>
                          </td>
                          <td className="opt-pct-cell">{pct.toFixed(2)}%</td>
                          <td className="opt-val-cell">{weight.toFixed(6)}</td>
                          <td className="opt-bar-cell">
                            <div className="bar-track">
                              <div
                                className="bar-fill"
                                style={{ width: `${Math.min(100, Math.max(5, pct))}%` }}
                              />
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="table-placeholder">
              {loading ? "Solving efficient frontier..." : "No optimization data available"}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

export default App;
