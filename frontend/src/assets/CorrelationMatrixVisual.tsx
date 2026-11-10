import React from "react";
import type { CorrelationResponse } from "./types";

export interface CorrelationMatrixVisualProps {
  data: CorrelationResponse | null;
  loading?: boolean;
}

const getHeatmapColor = (val: number): string => {
  if (val >= 1) return "rgba(59, 130, 246, 0.9)";
  if (val >= 0.7) return "rgba(16, 185, 129, 0.75)";
  if (val >= 0.4) return "rgba(52, 211, 153, 0.45)";
  if (val >= 0.1) return "rgba(251, 191, 36, 0.35)";
  if (val >= -0.1) return "rgba(148, 163, 184, 0.25)";
  return "rgba(239, 68, 68, 0.55)";
};

export const CorrelationMatrixVisual: React.FC<CorrelationMatrixVisualProps> = ({
  data,
  loading = false,
}) => {
  return (
    <section className="dashboard-section">
      <h2>3. Daily Returns Correlation Matrix (Pearson)</h2>
      <p className="instruction">
        Observations analyzed: {data?.observations ?? 0} common historical trading dates.
      </p>

      {data?.correlation_matrix ? (
        <div className="matrix-table-wrapper">
          <table className="correlation-table">
            <thead>
              <tr>
                <th className="sticky-col">Asset</th>
                {data.tickers.map((ticker) => (
                  <th key={ticker}>{ticker}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.tickers.map((rowTicker) => (
                <tr key={rowTicker}>
                  <td className="sticky-col ticker-row-header">{rowTicker}</td>
                  {data.tickers.map((colTicker) => {
                    const val = data.correlation_matrix[rowTicker]?.[colTicker] ?? 0;
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
          {loading
            ? "Downloading historical prices and estimating correlations..."
            : "No correlation data available"}
        </div>
      )}
    </section>
  );
};
