import type {
  CorrelationResponse,
  HistoricalPricesResponse,
  MonteCarloResponse,
  OptimizationObjective,
  OptimizeResponse,
} from "./api";

export interface AvailableTicker {
  symbol: string;
  sector: string;
}

export interface SectorTickerWeight {
  ticker: string;
  weight: number;
}

export interface SectorAllocation {
  sector: string;
  weight: number;
  percentage: number;
  color: string;
  tickers: SectorTickerWeight[];
}

export interface PortfolioContextValue {
  selectedTickers: string[];
  daysToPredict: number;
  simulations: number;
  objective: OptimizationObjective;
  riskFreeRate: number;
  initialInvestment: number;

  mcData: MonteCarloResponse | null;
  corrData: CorrelationResponse | null;
  optData: OptimizeResponse | null;
  historicalData: HistoricalPricesResponse | null;
  sectorAllocations: SectorAllocation[];

  loading: boolean;
  errorMsg: string | null;

  allAvailableTickers: AvailableTicker[];

  setDaysToPredict: (value: number) => void;
  setSimulations: (value: number) => void;
  setObjective: (value: OptimizationObjective) => void;
  setRiskFreeRate: (value: number) => void;
  setInitialInvestment: (value: number) => void;

  addTicker: (ticker: string) => boolean;
  removeTicker: (ticker: string) => void;
  resetDefaultTickers: () => void;
  runAnalysis: () => Promise<void>;
}
