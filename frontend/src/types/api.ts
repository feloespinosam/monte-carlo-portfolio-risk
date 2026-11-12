// ---------------------------------------------------------------------------
// Shared API contracts
// ---------------------------------------------------------------------------

export type OptimizationObjective = "min_variance" | "max_sharpe";

/** Payload único enviado a POST /api/analyze. */
export interface AnalysisRequestPayload {
  tickers: string[];
  days_to_predict: number;
  simulations: number;
  objective: OptimizationObjective;
  risk_free_rate: number;
  initial_investment: number;
}

// ---------------------------------------------------------------------------
// Correlation
// ---------------------------------------------------------------------------

export interface CorrelationResponse {
  tickers: string[];
  observations: number;
  method: string;
  correlation_matrix: Record<string, Record<string, number>>;
}

// ---------------------------------------------------------------------------
// Portfolio optimization
// ---------------------------------------------------------------------------

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
  objective: OptimizationObjective;
  tickers: string[];
  weights: Record<string, number>;
  metrics: OptimizationMetrics;
  constraints: OptimizationConstraints;
}

// ---------------------------------------------------------------------------
// Monte Carlo simulation
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Historical Prices & Portfolio Performance (2 years)
// ---------------------------------------------------------------------------

export interface HistoricalPricesStatistics {
  initial_value: number;
  final_value: number;
  total_profit_loss: number;
  total_return_pct: number;
  min_portfolio_value: number;
  max_portfolio_value: number;
}

export interface HistoricalPricesResponse {
  dates: string[];
  tickers: string[];
  initial_investment: number;
  portfolio_values: number[];
  prices: Record<string, number[]>;
  normalized_values: Record<string, number[]>;
  allocated_values: Record<string, number[]>;
  statistics: HistoricalPricesStatistics;
}

// ---------------------------------------------------------------------------
// Analysis (single-endpoint response)
// ---------------------------------------------------------------------------

export interface AnalysisResponse {
  tickers: string[];
  initial_investment: number;
  investment_amount?: number;
  historical_prices: HistoricalPricesResponse;
  correlation: CorrelationResponse;
  optimization: OptimizeResponse;
  monte_carlo: MonteCarloResponse;
}
