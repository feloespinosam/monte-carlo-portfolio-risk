import { useState, useMemo, useEffect } from "react";
import "./App.css";
import stocksCleanedData from "./data/stocks_cleaned.json";
import {
  MonteCarloVisual,
  CorrelationMatrixVisual,
  PortfolioOptimizationVisual,
  type MonteCarloResponse,
  type CorrelationResponse,
  type OptimizeResponse,
  type AnalysisRequestPayload,
  type AnalysisResponse,
  type OptimizationObjective,
  type SectorAllocation,
} from "./assets";

const API_BASE = "http://localhost:8000";

const SECTOR_COLORS: Record<string, string> = {
  Technology: "#3b82f6", // blue
  "Health Care": "#ec4899", // pink
  Finance: "#10b981", // emerald
  "Consumer Discretionary": "#f59e0b", // amber
  "Consumer Staples": "#84cc16", // lime
  Industrials: "#8b5cf6", // purple
  Energy: "#ef4444", // red
  Utilities: "#06b6d4", // cyan
  "Real Estate": "#14b8a6", // teal
  Telecommunications: "#6366f1", // indigo
  "Basic Materials": "#d97706", // warm amber
  Miscellaneous: "#64748b", // slate
  Other: "#94a3b8", // gray
};

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

const getErrorDetail = (payload: unknown): string | null => {
  if (!payload || typeof payload !== "object" || !("detail" in payload)) {
    return null;
  }

  const detail = (payload as { detail: unknown }).detail;

  if (typeof detail === "string") {
    return detail;
  }

  if (Array.isArray(detail)) {
    return detail
      .map((item) => {
        if (
          item &&
          typeof item === "object" &&
          "msg" in item &&
          typeof (item as { msg: unknown }).msg === "string"
        ) {
          return (item as { msg: string }).msg;
        }
        return JSON.stringify(item);
      })
      .join("; ");
  }

  return null;
};

const parseApiError = async (response: Response): Promise<string> => {
  const body: unknown = await response.json().catch(() => null);
  const fallback = response.statusText || `HTTP ${response.status}`;
  return getErrorDetail(body) ?? fallback;
};

function App() {
  const [selectedTickers, setSelectedTickers] =
    useState<string[]>(DEFAULT_TICKERS);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [isDropdownOpen, setIsDropdownOpen] = useState<boolean>(false);

  // Simulation and optimization parameters
  const [daysToPredict, setDaysToPredict] = useState<number>(252);
  const [simulations, setSimulations] = useState<number>(500);
  const [objective, setObjective] = useState<OptimizationObjective>(
    "min_variance",
  );
  const [riskFreeRate, setRiskFreeRate] = useState<number>(0.04);

  // Data states populated from the backend API
  const [mcData, setMcData] = useState<MonteCarloResponse | null>(null);
  const [corrData, setCorrData] = useState<CorrelationResponse | null>(null);
  const [optData, setOptData] = useState<OptimizeResponse | null>(null);

  // Loading and error states
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Consolidated unique list of available tickers with sector info
  const allAvailableTickers = useMemo(() => {
    const tickerMap = new Map<string, string>();
    stocksCleanedData.forEach(
      (item: { symbol?: string | null; sector?: string | null }) => {
        if (item.symbol && typeof item.symbol === "string") {
          const cleanSymbol = item.symbol.toUpperCase();
          if (!tickerMap.has(cleanSymbol)) {
            tickerMap.set(cleanSymbol, item.sector ?? "");
          }
        }
      },
    );

    return Array.from(tickerMap.entries())
      .map(([symbol, sector]) => ({ symbol, sector }))
      .sort((a, b) => a.symbol.localeCompare(b.symbol));
  }, []);

  // Map of symbol -> sector for quick lookup
  const tickerToSectorMap = useMemo(() => {
    const map = new Map<string, string>();
    stocksCleanedData.forEach(
      (item: { symbol?: string | null; sector?: string | null }) => {
        if (item.symbol && typeof item.symbol === "string") {
          map.set(item.symbol.toUpperCase(), item.sector?.trim() || "Other");
        }
      },
    );
    return map;
  }, []);

  // Sector breakdown of optimal portfolio weights
  const sectorAllocations = useMemo<SectorAllocation[]>(() => {
    if (!optData?.weights) return [];

    const sectorTotals: Record<
      string,
      { weight: number; tickers: { ticker: string; weight: number }[] }
    > = {};

    Object.entries(optData.weights).forEach(([ticker, weight]) => {
      const sector = tickerToSectorMap.get(ticker.toUpperCase()) || "Other";
      if (!sectorTotals[sector]) {
        sectorTotals[sector] = { weight: 0, tickers: [] };
      }
      sectorTotals[sector].weight += weight;
      sectorTotals[sector].tickers.push({ ticker, weight });
    });

    return Object.entries(sectorTotals)
      .map(([sector, data]) => ({
        sector,
        weight: data.weight,
        percentage: data.weight * 100,
        color: SECTOR_COLORS[sector] || "#94a3b8",
        tickers: data.tickers.sort((a, b) => b.weight - a.weight),
      }))
      .sort((a, b) => b.percentage - a.percentage);
  }, [optData?.weights, tickerToSectorMap]);

  // Search suggestions when at least 2 characters are entered
  const suggestions = useMemo(() => {
    const trimmed = searchTerm.trim().toUpperCase();
    if (trimmed.length < 2) return [];

    const startsWith = allAvailableTickers.filter(
      (item) =>
        item.symbol.startsWith(trimmed) && !selectedTickers.includes(item.symbol),
    );
    const contains = allAvailableTickers.filter(
      (item) =>
        !item.symbol.startsWith(trimmed) &&
        item.symbol.includes(trimmed) &&
        !selectedTickers.includes(item.symbol),
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
      alert(
        "Exactly 10 tickers are required. Remove one before adding another.",
      );
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
      setErrorMsg(
        "You must select exactly 10 distinct tickers according to backend requirements.",
      );
      return;
    }

    setLoading(true);
    setErrorMsg(null);

    const payload: AnalysisRequestPayload = {
      tickers: selectedTickers,
      days_to_predict: Number(daysToPredict),
      simulations: Number(simulations),
      objective,
      risk_free_rate: Number(riskFreeRate),
    };

    try {
      const response = await fetch(`${API_BASE}/api/analyze`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`Analysis Error: ${await parseApiError(response)}`);
      }

      const data: AnalysisResponse = await response.json();

      setCorrData(data.correlation);
      setOptData(data.optimization);
      setMcData(data.monte_carlo);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setErrorMsg(err.message);
      } else {
        setErrorMsg("Failed to connect to backend API.");
      }
    } finally {
      setLoading(false);
    }
  };

  // Initial automatic load
  useEffect(() => {
    executeAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="portfolio-app">
      {/* Header */}
      <header className="app-header">
        <div className="header-content">
          <h1>Monte Carlo Risk & Portfolio Optimizer</h1>
          <p className="subtitle">
            Multi-asset risk simulator, correlation analysis, and
            mean-variance/Sharpe optimization
          </p>
        </div>
      </header>

      <main className="app-main">
        {/* Section 1: Asset Selection & Search */}
        <section className="config-card">
          <h2>1. Asset Selection ({selectedTickers.length}/10)</h2>
          <p className="instruction">
            The quantitative model requires a portfolio of{" "}
            <strong>exactly 10 distinct assets</strong>.
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
                {suggestions.map((item) => (
                  <li
                    key={item.symbol}
                    onClick={() => addTicker(item.symbol)}
                    className="suggestion-item"
                  >
                    <div className="suggestion-info">
                      <span className="ticker-badge">{item.symbol}</span>
                      {item.sector && (
                        <span className="ticker-sector">{item.sector}</span>
                      )}
                    </div>
                    <span className="ticker-action">+ Add to portfolio</span>
                  </li>
                ))}
              </ul>
            )}

            {isDropdownOpen &&
              searchTerm.trim().length >= 2 &&
              suggestions.length === 0 && (
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
              ⚠️ You have {selectedTickers.length} tickers selected. Add or
              remove until you have exactly 10.
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
              <span className="field-hint">
                Min: 5 | Max: 504 (252 ≈ 1 year)
              </span>
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
                onChange={(e) =>
                  setObjective(e.target.value as OptimizationObjective)
                }
              >
                <option value="min_variance">
                  Minimum Variance (Min Risk)
                </option>
                <option value="max_sharpe">
                  Maximum Sharpe Ratio (Max Return/Risk)
                </option>
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
              <span className="field-hint">
                Example: 0.04 = 4.0% annualized
              </span>
            </div>
          </div>

          <div className="actions-bar">
            <button
              type="button"
              className="btn-primary"
              onClick={executeAll}
              disabled={loading || selectedTickers.length !== 10}
            >
              {loading
                ? "Computing quantitative models..."
                : "▶ Run Simulation & Optimization"}
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

        {/* Section 2: Monte Carlo Simulation Visual Component */}
        <MonteCarloVisual data={mcData} loading={loading} />

        {/* Section 3: Daily Returns Correlation Matrix Visual Component */}
        <CorrelationMatrixVisual data={corrData} loading={loading} />

        {/* Section 4: Portfolio Optimization Visual Component */}
        <PortfolioOptimizationVisual
          data={optData}
          sectorAllocations={sectorAllocations}
          loading={loading}
        />
      </main>
    </div>
  );
}

export default App;
