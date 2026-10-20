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

class PortfolioRequest(BaseModel):
    tickers: list[str] = Field(
        default=["TSLA", "AAPL", "MSFT", "AMZN", "GOOGL", "META", "NVDA", "NFLX", "AMD", "INTC"], min_length=10, max_length=10
    )
    days_to_predict: int = Field(default=252, ge=5, le=504)
    simulations: int = Field(default=1000, ge=100, le=5000)

    @field_validator("tickers")
    @classmethod
    def validate_tickers(cls, tickers):
        cleaned = [ticker.strip().upper() for ticker in tickers]

        if any(not ticker for ticker in cleaned):
            raise ValueError("Los tickers no pueden estar vacíos.")

        if len(set(cleaned)) != 10:
            raise ValueError("Debes enviar 10 tickers diferentes.")

        return cleaned

class OptimizeRequest(BaseModel):
    tickers: list[str] = Field(
        ..., min_length=10, max_length=10
    )
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

class MonteCarloRequest(PortfolioRequest):
    weights: dict[str, float] | None = None

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

def get_covariance(returns: pd.DataFrame) -> pd.DataFrame:
    """Annualization is not applied here: covariance is daily."""

    covariance = returns.cov()

    if not np.isfinite(covariance.to_numpy()).all():
        raise HTTPException(
            status_code=422,
            detail="No se pudo calcular la matriz de covarianza.",
        )

    return covariance

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

# 3. ENDPOINT: CORRELATION MATRIX

@app.post("/api/correlation")
def correlation_endpoint(request: PortfolioRequest):
    prices = get_historical_data(request.tickers)
    returns = get_returns(prices)
    corr = get_correlation(returns)

    return {
        "tickers": request.tickers,
        "observations": len(returns),
        "method": "Pearson correlation of daily simple returns",
        "correlation_matrix": {
            ticker: {other: round(float(corr.loc[ticker, other]), 6) for other in request.tickers} for ticker in request.tickers
        },
    }

# 4. ENDPOINT: MONTE CARLO SIMULATION


@app.post("/api/monte-carlo")
def monte_carlo_endpoint(request: MonteCarloRequest):
    prices = get_historical_data(request.tickers)
    returns = get_returns(prices)

    tickers = request.tickers
    n_assets = len(tickers)
    n_days = request.days_to_predict
    n_sims = request.simulations

    # 1. Obtener y validar los pesos del portafolio.
    # Si no se proporcionan (None o omitido), se utiliza equiponderación como fallback seguro.
    if request.weights is None:
        weights = np.full(n_assets, 1.0 / n_assets, dtype=float)
    else:
        if set(request.weights.keys()) != set(tickers):
            raise HTTPException(
                status_code=422,
                detail="Los pesos deben corresponder exactamente a los tickers seleccionados.",
            )

        try:
            weights = np.array(
                [request.weights[ticker] for ticker in tickers],
                dtype=float,
            )
        except (ValueError, TypeError) as exc:
            raise HTTPException(
                status_code=422,
                detail=f"Valores de ponderación no numéricos: {exc}",
            ) from exc

        if not np.isfinite(weights).all() or (weights < 0).any():
            raise HTTPException(
                status_code=422,
                detail="Los pesos deben ser finitos y no negativos.",
            )

        weights_sum = float(weights.sum())
        if not np.isclose(weights_sum, 1.0, atol=1e-4):
            raise HTTPException(
                status_code=422,
                detail=f"La suma de los pesos ({weights_sum:.6f}) debe ser aproximadamente 1.0.",
            )

        # Normalizar para compensar pequeñas imprecisiones o redondeos de serialización float
        weights = weights / weights_sum

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
        "tickers": tickers,
        "days": list(range(n_days + 1)),
        "simulations": n_sims,
        "initial_portfolio_value": 1.0,
        "weights": {
            ticker: round(float(weight), 8)
            for ticker, weight in zip(tickers, weights)
        },
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

@app.post("/api/optimize")
def optimize_endpoint(request: OptimizeRequest):
    # 1. Download historical prices and calculate daily returns.
    prices = get_historical_data(request.tickers)
    returns = get_returns(prices)

    tickers = request.tickers

    # 2. Calculate optimal portfolio weights.
    optimal_weights = calculate_optimal_weights(
        returns=returns,
        objective=request.objective,
        risk_free_rate=request.risk_free_rate,
    )

    # 3. Calculate annualized portfolio metrics.
    mean_annual = returns.mean().to_numpy() * 252
    covariance_annual = returns.cov().to_numpy() * 252

    rf = request.risk_free_rate

    expected_return = float(
        optimal_weights @ mean_annual
    )

    variance = float(
        optimal_weights @ covariance_annual @ optimal_weights
    )

    volatility = float(
        np.sqrt(max(variance, 0.0))
    )

    sharpe = (
        (expected_return - rf) / volatility
        if volatility > 1e-12
        else None
    )

    # 4. Return the optimization results.
    return {
        "objective": request.objective,
        "tickers": tickers,
        "weights": {
            ticker: round(float(weight), 8)
            for ticker, weight in zip(tickers, optimal_weights)
        },
        "metrics": {
            "expected_annual_return": round(expected_return, 8),
            "annual_variance": round(variance, 8),
            "annual_volatility": round(volatility, 8),
            "sharpe_ratio": (
                round(sharpe, 8)
                if sharpe is not None
                else None
            ),
            "risk_free_rate": rf,
            "weights_sum": round(
                float(optimal_weights.sum()), 8
            ),
        },
        "constraints": {
            "long_only": True,
            "minimum_weight": 0.05,
            "maximum_weight": 1.0,
            "weights_sum_to_one": True,
        },
    }

@app.get("/")
def root():
    return {
        "message": "Portfolio Monte Carlo API is running",
        "endpoints": [
            "/api/correlation",
            "/api/monte-carlo",
            "/api/optimize",
        ],
    }