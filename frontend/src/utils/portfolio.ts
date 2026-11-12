import stocksCleanedData from "../data/stocks_cleaned.json";
import { SECTOR_COLORS } from "../constants/portfolio";
import type { OptimizeResponse } from "../types/api";
import type {
  AvailableTicker,
  SectorAllocation,
} from "../types/portfolio";

interface StockRow {
  symbol?: string | null;
  sector?: string | null;
}

interface TickerCatalog {
  allAvailableTickers: AvailableTicker[];
  tickerToSectorMap: Map<string, string>;
}

export function buildTickerCatalog(): TickerCatalog {
  const rows = stocksCleanedData as StockRow[];
  const tickerMap = new Map<string, string>();

  rows.forEach((item) => {
    if (item.symbol && typeof item.symbol === "string") {
      const cleanSymbol = item.symbol.toUpperCase();
      if (!tickerMap.has(cleanSymbol)) {
        tickerMap.set(cleanSymbol, item.sector?.trim() || "Other");
      }
    }
  });

  const allAvailableTickers: AvailableTicker[] = Array.from(tickerMap.entries())
    .map(([symbol, sector]) => ({ symbol, sector }))
    .sort((a, b) => a.symbol.localeCompare(b.symbol));

  return { allAvailableTickers, tickerToSectorMap: tickerMap };
}

export function buildSectorAllocations(
  optData: OptimizeResponse | null,
  tickerToSectorMap: Map<string, string>,
): SectorAllocation[] {
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
}

export function filterSuggestions(
  searchTerm: string,
  availableTickers: AvailableTicker[],
  selectedTickers: string[],
): AvailableTicker[] {
  const trimmed = searchTerm.trim().toUpperCase();
  if (trimmed.length < 2) return [];

  const startsWith = availableTickers.filter(
    (item) =>
      item.symbol.startsWith(trimmed) && !selectedTickers.includes(item.symbol),
  );
  const contains = availableTickers.filter(
    (item) =>
      !item.symbol.startsWith(trimmed) &&
      item.symbol.includes(trimmed) &&
      !selectedTickers.includes(item.symbol),
  );

  return [...startsWith, ...contains].slice(0, 7);
}
