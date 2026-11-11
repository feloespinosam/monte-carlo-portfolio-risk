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
// Analysis (single-endpoint response)
// ---------------------------------------------------------------------------

export interface AnalysisResponse {
  tickers: string[];
  correlation: CorrelationResponse;
  optimization: OptimizeResponse;
  monte_carlo: MonteCarloResponse;
}

// ---------------------------------------------------------------------------
// UI view models
// ---------------------------------------------------------------------------

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
