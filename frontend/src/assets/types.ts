export interface CorrelationResponse {
  tickers: string[];
  observations: number;
  method: string;
  correlation_matrix: Record<string, Record<string, number>>;
}

export interface MonteCarloStatistics {
  mean_terminal_value: number;
  median_terminal_value: number;
  probability_of_loss: number;
  percentile_5_terminal_value: number;
  percentile_95_terminal_value: number;
}

export interface MonteCarloResponse {
  tickers: string[];
  days: number[];
  simulations: number;
  initial_portfolio_value: number;
  weights: Record<string, number>;
  trajectories: number[][];
  percentile_bands: Record<string, number[]>;
  statistics: MonteCarloStatistics;
}

export interface OptimizationMetrics {
  expected_annual_return: number;
  annual_variance: number;
  annual_volatility: number;
  sharpe_ratio: number | null;
  risk_free_rate: number;
  weights_sum: number;
}

export interface OptimizationConstraints {
  long_only: boolean;
  minimum_weight: number;
  maximum_weight: number;
  weights_sum_to_one: boolean;
}

export interface OptimizeResponse {
  objective: "min_variance" | "max_sharpe";
  tickers: string[];
  weights: Record<string, number>;
  metrics: OptimizationMetrics;
  constraints: OptimizationConstraints;
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

export interface PortfolioRequestPayload {
  tickers: string[];
  days_to_predict: number;
  simulations: number;
}

export interface OptimizeRequestPayload {
  tickers: string[];
  objective: "min_variance" | "max_sharpe";
  risk_free_rate: number;
}

export interface MonteCarloRequestPayload {
  tickers: string[];
  days_to_predict: number;
  simulations: number;
  weights: Record<string, number>;
}
