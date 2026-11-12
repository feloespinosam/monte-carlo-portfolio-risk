export const API_BASE = "http://localhost:8000";

export const DEFAULT_TICKERS = [
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

export const SECTOR_COLORS: Record<string, string> = {
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
