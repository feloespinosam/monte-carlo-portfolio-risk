import { usePortfolio } from "../../context/PortfolioContext";
import type { OptimizationObjective } from "../../types/api";
import { AssetSearch } from "./AssetSearch";

export function PortfolioControls() {
  const {
    selectedTickers,
    allAvailableTickers,
    daysToPredict,
    simulations,
    objective,
    riskFreeRate,
    initialInvestment,
    loading,
    errorMsg,
    setDaysToPredict,
    setSimulations,
    setObjective,
    setRiskFreeRate,
    setInitialInvestment,
    addTicker,
    removeTicker,
    resetDefaultTickers,
    runAnalysis,
  } = usePortfolio();

  return (
    <section className="config-card">
      <h2>1. Asset Selection ({selectedTickers.length}/10)</h2>
      <p className="instruction">
        The quantitative model requires a portfolio of{" "}
        <strong>exactly 10 distinct assets</strong>.
      </p>

      <AssetSearch
        selectedTickers={selectedTickers}
        availableTickers={allAvailableTickers}
        onAddTicker={addTicker}
      />

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
          ⚠️ You have {selectedTickers.length} tickers selected. Add or remove
          until you have exactly 10.
        </div>
      )}

      <div className="controls-grid">
        <div className="control-group">
          <label>Forecast Horizon (Trading days):</label>
          <input
            type="number"
            min={5}
            max={504}
            value={daysToPredict}
            onChange={(event) => setDaysToPredict(Number(event.target.value))}
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
            onChange={(event) => setSimulations(Number(event.target.value))}
          />
          <span className="field-hint">Min: 100 | Max: 5000</span>
        </div>

        <div className="control-group">
          <label>Optimization Objective:</label>
          <select
            value={objective}
            onChange={(event) =>
              setObjective(event.target.value as OptimizationObjective)
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
            onChange={(event) => setRiskFreeRate(Number(event.target.value))}
          />
          <span className="field-hint">
            Example: 0.04 = 4.0% annualized
          </span>
        </div>

        <div className="control-group">
          <label>Initial Investment (USD $):</label>
          <input
            type="number"
            min={1}
            step={500}
            value={initialInvestment}
            onChange={(event) =>
              setInitialInvestment(Math.max(1, Number(event.target.value)))
            }
          />
          <span className="field-hint">
            Portfolio dollar capital (e.g. $10,000)
          </span>
        </div>
      </div>

      <div className="actions-bar">
        <button
          type="button"
          className="btn-primary"
          onClick={() => void runAnalysis()}
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
  );
}
