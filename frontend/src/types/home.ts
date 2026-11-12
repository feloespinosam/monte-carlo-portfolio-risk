import type { AvailableTicker } from "./portfolio";
export type {
  HistoricalPricesVisualProps,
  HistoricalPriceViewMode,
} from "./historicalPrices";

export interface AssetSearchProps {
  selectedTickers: string[];
  availableTickers: AvailableTicker[];
  onAddTicker: (ticker: string) => boolean;
}
