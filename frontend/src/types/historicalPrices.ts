import type { HistoricalPricesResponse } from "./api";

export type HistoricalPriceViewMode =
  | "portfolio"
  | "all_tickers"
  | "raw_prices";

export interface HistoricalPricesVisualProps {
  data: HistoricalPricesResponse | null;
  initialInvestment?: number;
  loading?: boolean;
}
