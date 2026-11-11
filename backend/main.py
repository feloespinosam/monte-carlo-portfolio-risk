from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field, field_validator
import yfinance as yf
import numpy as np
import pandas as pd
from typing import Literal
from scipy.optimize import minimize

app = FastAPI(
    title="Monte Carlo Portfolio Risk Simulator",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class AnalysisRequest(BaseModel):
    tickers: list[str] = Field(
        default=["TSLA", "AAPL", "MSFT", "AMZN", "GOOGL", "META", "NVDA", "NFLX", "AMD", "INTC"], min_length=10, max_length=10
    )
    days_to_predict: int = Field(default=252, ge=5, le=504)
    simulations: int = Field(default=1000, ge=100, le=5000)
    objective: Literal["min_variance", "max_sharpe"] = "min_variance"
    risk_free_rate: float = Field(default=0.0, ge=0.0, le=1.0)

    @field_validator("tickers")
    @classmethod
    def validate_tickers(cls, tickers):
        cleaned = [ticker.strip().upper() for ticker in tickers]

        if any(not ticker for ticker in cleaned):
            raise ValueError("Los tickers no pueden estar vacíos.")

        if len(set(cleaned)) != 10:
            raise ValueError("Debes enviar 10 tickers diferentes.")

        return cleaned

def get_historical_data(tickers: list[str]) -> pd.DataFrame:
    """Download adjusted historical prices for all assets."""

    try:
        data = yf.download(
            tickers=tickers,
            period="2y",
            interval="1d",
            auto_adjust=True,
            progress=False,
            threads=True,
        )

        if data.empty:
            raise ValueError("No se recibieron precios históricos.")

        # With multiple tickers, yfinance normally returns
        # a MultiIndex with a 'Close' level.
        if isinstance(data.columns, pd.MultiIndex):
            if "Close" not in data.columns.get_level_values(0):
                raise ValueError("No se encontró la columna Close.")

            prices = data["Close"]
        else:
            prices = data[["Close"]].rename(
                columns={"Close": tickers[0]}
            )

        prices = prices.reindex(columns=tickers)
        prices = prices.apply(pd.to_numeric, errors="coerce")
        prices = prices.replace([np.inf, -np.inf], np.nan)

        # Require all assets to have prices on the same dates.
        prices = prices.dropna(axis=0, how="any")

        if len(prices) < 60:
            raise ValueError(
                "No hay suficientes datos históricos comunes. "
                "Se requieren al menos 60 observaciones."
            )

        if (prices <= 0).any().any():
            raise ValueError("Los precios deben ser positivos.")

        return prices

    except Exception as exc:
        raise HTTPException(
            status_code=502,
            detail=f"Error obteniendo precios históricos: {str(exc)}",
        ) from exc

def get_returns(prices: pd.DataFrame) -> pd.DataFrame:
    """Calculate daily simple returns."""

    returns = prices.pct_change().dropna()

    if returns.empty or not np.isfinite(returns.to_numpy()).all():
        raise HTTPException(
            status_code=422,
            detail="No se pudieron calcular rendimientos válidos.",
        )

    return returns


def get_correlation(returns: pd.DataFrame) -> pd.DataFrame:
    """Pearson correlation matrix."""

    corr = returns.corr()

    if not np.isfinite(corr.to_numpy()).all():
        raise HTTPException(
            status_code=422,
            detail="No se pudo calcular una matriz de correlación válida.",
        )

    return corr

def calculate_optimal_weights(
    returns: pd.DataFrame,
    objective: Literal["min_variance", "max_sharpe"],
    risk_free_rate: float,
) -> np.ndarray:
    n_assets = returns.shape[1]

    # Historical daily returns and covariance.
    mean_daily = returns.mean().to_numpy()
    covariance_daily = returns.cov().to_numpy()

    # Annualize estimates.
    mean_annual = mean_daily * 252
    covariance_annual = covariance_daily * 252

    initial_weights = np.full(n_assets, 1.0 / n_assets)

    def portfolio_variance(weights):
        return float(weights @ covariance_annual @ weights)

    def negative_sharpe(weights):
        expected_return = float(weights @ mean_annual)
        variance = portfolio_variance(weights)
        volatility = np.sqrt(max(variance, 0.0))

        if volatility < 1e-12:
            return 1e6

        return -(expected_return - risk_free_rate) / volatility

    if objective == "min_variance":
        objective_function = portfolio_variance
    else:
        objective_function = negative_sharpe

    min_weight = 0.05

    result = minimize(
        objective_function,
        initial_weights,
        method="SLSQP",
        bounds=[(min_weight, 1.0)] * n_assets,
        constraints=[
            {
                "type": "eq",
                "fun": lambda weights: np.sum(weights) - 1.0,
            }
        ],
        options={"maxiter": 2000, "ftol": 1e-12},
    )

    if not result.success:
        raise HTTPException(
            status_code=422,
            detail=f"No se encontró una solución: {result.message}",
        )

    # Clean up numerical errors and normalize.
    optimal_weights = np.clip(result.x, min_weight, 1.0)
    optimal_weights /= optimal_weights.sum()

    return optimal_weights

def build_correlation_matrix_payload(
    tickers: list[str],
    corr: pd.DataFrame,
) -> dict[str, dict[str, float]]:
    """Serialize the Pearson correlation matrix by ticker pair."""

    return {
        ticker: {
            other: round(float(corr.loc[ticker, other]), 6)
            for other in tickers
        }
        for ticker in tickers
    }

def compute_portfolio_metrics(
    weights: np.ndarray,
    returns: pd.DataFrame,
    risk_free_rate: float,
) -> dict:
    """Annualized return, variance, volatility and Sharpe for a weight vector."""

    mean_annual = returns.mean().to_numpy() * 252
    covariance_annual = returns.cov().to_numpy() * 252

    expected_return = float(weights @ mean_annual)
    variance = float(weights @ covariance_annual @ weights)
    volatility = float(np.sqrt(max(variance, 0.0)))

    sharpe = (
        (expected_return - risk_free_rate) / volatility
        if volatility > 1e-12
        else None
    )

    return {
        "expected_annual_return": round(expected_return, 8),
        "annual_variance": round(variance, 8),
        "annual_volatility": round(volatility, 8),
        "sharpe_ratio": (
            round(sharpe, 8)
            if sharpe is not None
            else None
        ),
        "risk_free_rate": risk_free_rate,
        "weights_sum": round(float(weights.sum()), 8),
    }

def simulate_portfolio(
    prices: pd.DataFrame,
    weights: np.ndarray,
    n_days: int,
    n_sims: int,
) -> dict:
    """Run the Monte Carlo simulation for a given weight vector."""

    n_assets = prices.shape[1]

    # Historical daily log-return parameters.
    log_returns = np.log(prices / prices.shift(1)).dropna()
    mean_daily = log_returns.mean().to_numpy()
    covariance_daily = log_returns.cov().to_numpy()

    # Numerical stabilization for multivariate normal sampling.
    covariance_daily = (
        covariance_daily + covariance_daily.T
    ) / 2

    min_eigenvalue = np.linalg.eigvalsh(covariance_daily).min()

    if min_eigenvalue < 0:
        covariance_daily += (
            abs(min_eigenvalue) + 1e-12
        ) * np.eye(n_assets)

    rng = np.random.default_rng()

    # Shape: (simulation, day, asset)
    daily_log_returns = rng.multivariate_normal(
        mean=mean_daily,
        cov=covariance_daily,
        size=(n_sims, n_days),
        check_valid="raise",
    )

    # Simulated cumulative log returns for each asset.
    cumulative_log_returns = np.cumsum(
        daily_log_returns,
        axis=1,
    )

    # Relative asset prices, starting from 1.0.
    asset_relatives = np.exp(cumulative_log_returns)

    # Portfolio value paths using the optimized weights.
    # Shape before concatenate: (n_sims, n_days)
    portfolio_paths = np.concatenate(
        [
            np.ones((n_sims, 1)),
            np.einsum("sda,a->sd", asset_relatives, weights),
        ],
        axis=1,
    )

    # Final portfolio values and returns.
    terminal_values = portfolio_paths[:, -1]
    terminal_returns = terminal_values - 1.0

    # Percentile bands across simulations, for each day.
    percentiles = {
        str(p): np.percentile(
            portfolio_paths,
            p,
            axis=0,
        ).round(6).tolist()
        for p in [5, 25, 50, 75, 95]
    }

    # Each trajectory is one series for the frontend.
    trajectories = portfolio_paths.round(6).tolist()

    return {
        "days": list(range(n_days + 1)),
        "simulations": n_sims,
        "initial_portfolio_value": 1.0,
        "trajectories": trajectories,
        "percentile_bands": percentiles,
        "statistics": {
            "mean_terminal_value": round(
                float(np.mean(terminal_values)), 6
            ),
            "median_terminal_value": round(
                float(np.median(terminal_values)), 6
            ),
            "probability_of_loss": round(
                float(np.mean(terminal_returns < 0)), 6
            ),
            "percentile_5_terminal_value": round(
                float(np.percentile(terminal_values, 5)), 6
            ),
            "percentile_95_terminal_value": round(
                float(np.percentile(terminal_values, 95)), 6
            ),
        },
    }

# ENDPOINT: FULL ANALYSIS (correlation + optimization + Monte Carlo)

@app.post("/api/analyze")
def analyze_endpoint(request: AnalysisRequest):
    """Una sola descarga de precios alimenta los tres cálculos."""

    # 1. Download prices once and derive daily returns.
    prices = get_historical_data(request.tickers)
    returns = get_returns(prices)
    corr = get_correlation(returns)

    # 2. Optimal weights are always calculated server-side.
    optimal_weights = calculate_optimal_weights(
        returns=returns,
        objective=request.objective,
        risk_free_rate=request.risk_free_rate,
    )

    # Same rounded weights source for optimization and Monte Carlo.
    weights_payload = {
        ticker: round(float(weight), 8)
        for ticker, weight in zip(request.tickers, optimal_weights)
    }

    # 3. Annualized portfolio metrics.
    metrics = compute_portfolio_metrics(
        weights=optimal_weights,
        returns=returns,
        risk_free_rate=request.risk_free_rate,
    )

    # 4. Monte Carlo uses the unrounded optimal weight array.
    simulation = simulate_portfolio(
        prices=prices,
        weights=optimal_weights,
        n_days=request.days_to_predict,
        n_sims=request.simulations,
    )

    return {
        "tickers": request.tickers,
        "correlation": {
            "tickers": request.tickers,
            "observations": len(returns),
            "method": "Pearson correlation of daily simple returns",
            "correlation_matrix": build_correlation_matrix_payload(
                request.tickers,
                corr,
            ),
        },
        "optimization": {
            "objective": request.objective,
            "tickers": request.tickers,
            "weights": weights_payload,
            "metrics": metrics,
            "constraints": {
                "long_only": True,
                "minimum_weight": 0.05,
                "maximum_weight": 1.0,
                "weights_sum_to_one": True,
            },
        },
        "monte_carlo": {
            "tickers": request.tickers,
            "weights": weights_payload,
            **simulation,
        },
    }

@app.get("/")
def root():
    return {
        "message": "Portfolio Monte Carlo API is running",
        "endpoints": [
            "/api/analyze",
        ],
    }

@app.get("/health")
async def health():
    return {
        "status": "ok"
    }
