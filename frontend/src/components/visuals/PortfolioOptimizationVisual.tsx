import React from "react";
import type { PortfolioOptimizationVisualProps } from "../../types/correlationOptimization";
import { SectorDistributionVisual } from "./SectorDistributionVisual";

export const PortfolioOptimizationVisual: React.FC<
  PortfolioOptimizationVisualProps
> = ({ data, sectorAllocations = [], loading = false }) => {
  return (
    <section className="dashboard-section">
      <h2>4. Portfolio Optimization (Markowitz SLSQP)</h2>
      <p className="instruction">
        Objective:{" "}
        <strong>
          {data?.objective === "max_sharpe"
            ? "Maximum Sharpe Ratio (Highest risk-adjusted return)"
            : "Minimum Variance (Lowest portfolio volatility)"}
        </strong>{" "}
        | Minimum asset allocation weight: 5.0%
      </p>

      {data?.metrics && (
        <div className="metrics-banner">
          <div className="metric-item">
            <span className="metric-label">Expected Annual Return:</span>
            <span className="metric-num">
              {(data.metrics.expected_annual_return * 100).toFixed(2)}%
            </span>
          </div>
          <div className="metric-item">
            <span className="metric-label">Annual Volatility (σ):</span>
            <span className="metric-num">
              {(data.metrics.annual_volatility * 100).toFixed(2)}%
            </span>
          </div>
          <div className="metric-item">
            <span className="metric-label">Sharpe Ratio:</span>
            <span className="metric-num">
              {data.metrics.sharpe_ratio !== null
                ? data.metrics.sharpe_ratio.toFixed(3)
                : "N/A"}
            </span>
          </div>
          <div className="metric-item">
            <span className="metric-label">Annual Variance (σ²):</span>
            <span className="metric-num">
              {data.metrics.annual_variance.toFixed(4)}
            </span>
          </div>
          <div className="metric-item">
            <span className="metric-label">Total Weights Sum:</span>
            <span className="metric-num">
              {(data.metrics.weights_sum * 100).toFixed(1)}%
            </span>
          </div>
        </div>
      )}

      {data?.weights && sectorAllocations.length > 0 && (
        <SectorDistributionVisual allocations={sectorAllocations} />
      )}

      {data?.weights ? (
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
              {Object.entries(data.weights)
                .sort(([, a], [, b]) => b - a)
                .map(([ticker, weight]) => {
                  const percentage = weight * 100;
                  return (
                    <tr key={ticker}>
                      <td className="opt-ticker-cell">
                        <strong>{ticker}</strong>
                      </td>
                      <td className="opt-pct-cell">
                        {percentage.toFixed(2)}%
                      </td>
                      <td className="opt-val-cell">{weight.toFixed(6)}</td>
                      <td className="opt-bar-cell">
                        <div className="bar-track">
                          <div
                            className="bar-fill"
                            style={{
                              width: `${Math.min(100, Math.max(5, percentage))}%`,
                            }}
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
          {loading
            ? "Solving efficient frontier..."
            : "No optimization data available"}
        </div>
      )}
    </section>
  );
};
