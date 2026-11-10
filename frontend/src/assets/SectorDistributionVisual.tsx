import React from "react";
import type { SectorAllocation } from "./types";

export interface SectorDistributionVisualProps {
  allocations: SectorAllocation[];
}

export const SectorDistributionVisual: React.FC<SectorDistributionVisualProps> = ({
  allocations,
}) => {
  if (allocations.length === 0) {
    return null;
  }

  return (
    <div className="sector-distribution-card">
      <div className="sector-distribution-header">
        <h3>Sector Weight Distribution</h3>
        <span className="sector-subtitle">
          Proportional breakdown of optimal portfolio allocation
        </span>
      </div>

      {/* Multi-color stacked proportional bar */}
      <div className="sector-progress-bar">
        {allocations.map((item) => (
          <div
            key={item.sector}
            className="sector-progress-segment"
            style={{
              width: `${item.percentage}%`,
              backgroundColor: item.color,
            }}
            title={`${item.sector}: ${item.percentage.toFixed(2)}% (${item.tickers.map((t) => t.ticker).join(", ")})`}
          >
            {item.percentage >= 7 && (
              <span className="sector-segment-label">
                {item.percentage.toFixed(1)}%
              </span>
            )}
          </div>
        ))}
      </div>

      {/* Sector legend with tags and percentages */}
      <div className="sector-legend">
        {allocations.map((item) => (
          <div key={item.sector} className="sector-legend-item">
            <span
              className="sector-legend-dot"
              style={{ backgroundColor: item.color }}
            />
            <span className="sector-legend-name">{item.sector}</span>
            <span className="sector-legend-pct">
              {item.percentage.toFixed(2)}%
            </span>
            <span className="sector-legend-tickers">
              ({item.tickers.map((t) => t.ticker).join(", ")})
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};
