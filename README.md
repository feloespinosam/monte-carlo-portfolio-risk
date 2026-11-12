# 📈 Monte Carlo Risk & Portfolio Optimizer

<p align="center">
  <strong>A full-stack quantitative finance application for portfolio risk analysis, Monte Carlo simulation, and mean-variance optimization.</strong>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Python-3776AB?style=for-the-badge&logo=python&logoColor=white" alt="Python" />
  <img src="https://img.shields.io/badge/FastAPI-009688?style=for-the-badge&logo=fastapi&logoColor=white" alt="FastAPI" />
  <img src="https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB" alt="React" />
  <img src="https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white" alt="Vite" />
  <img src="https://img.shields.io/badge/Chart.js-FF6384?style=for-the-badge&logo=chartdotjs&logoColor=white" alt="Chart.js" />
  <img src="https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white" alt="Docker" />
</p>

---

## 💡 Overview

**Monte Carlo Risk & Portfolio Optimizer** is a full-stack application for exploring how a multi-asset portfolio behaves under historical and simulated market conditions.

The user builds a portfolio of exactly **10 stocks** selected from a catalog of **6,000+ US-listed tickers**, configures the simulation horizon, number of paths, optimization objective, risk-free rate, and initial capital, and receives a complete analysis from a **single API call**:

- 2-year historical price and portfolio valuation performance
- Pearson correlation matrix of daily returns
- Optimal asset allocation (minimum variance or maximum Sharpe ratio)
- Monte Carlo simulation of future portfolio paths

The project bridges **quantitative finance, numerical optimization, data science, and full-stack development** in one interactive dashboard.

---

## ✨ Features

| Feature | Description |
| --- | --- |
| 🎲 Monte Carlo Simulation | Simulates thousands of future portfolio trajectories using correlated multivariate log-returns. |
| 📉 Risk Analysis | Probability of loss, median outcome, and 5th/95th percentile terminal values. |
| 🔗 Correlation Matrix | Pearson heatmap of daily returns across the 10 selected assets. |
| ⚖️ Portfolio Optimization | SLSQP solver for minimum variance or maximum Sharpe ratio allocations. |
| 🏦 Large Asset Universe | Search and select from 6,000+ tickers with sector metadata. |
| 💵 Historical Performance | 2-year historical valuation in USD with three chart modes and P/L statistics. |
| 🧩 Sector Distribution | Aggregated optimal weights by sector with per-ticker breakdown. |
| 🧭 Multi-page SPA | Sidebar navigation with shared state that survives route changes. |
| 🐳 Docker Support | Containerized frontend (Nginx) and backend (Uvicorn). |

---

## 🖥️ Application Sections

| Route | Page | Contents |
| --- | --- | --- |
| `/` | Home | Portfolio controls + 2-year historical prices and portfolio valuation |
| `/montecarlo` | Monte Carlo | Portfolio controls + simulated paths, percentile bands, and statistics |
| `/correlation-optimization` | Correlation & Optimization | Portfolio controls + correlation heatmap + sector distribution + optimal weights |

All three pages share the same configuration card (`PortfolioControls`). Results are stored in a React context above the router, so navigating between sections **does not clear the analysis**.

---

## 🏗️ Architecture

```text
┌──────────────────────────────────────────────┐
│            React 19 + TypeScript             │
│  Vite · Chart.js · React Router 7 · oxlint   │
└──────────────────────┬───────────────────────┘
                       │  POST /api/analyze
                       │  (single JSON payload)
                       ▼
┌──────────────────────────────────────────────┐
│                   FastAPI                    │
│          Pydantic validation layer           │
└──────────────────────┬───────────────────────┘
                       │
                       ▼
┌──────────────────────────────────────────────┐
│             Quantitative Engine              │
│                                              │
│  • Historical prices (2 years, daily)        │
│  • Simple & log return calculation           │
│  • Pearson correlation matrix                │
│  • Annualized covariance / volatility        │
│  • SLSQP portfolio optimization              │
│  • Multivariate Monte Carlo simulation       │
│  • Historical dollar valuation               │
└──────────────────────┬───────────────────────┘
                       │
                       ▼
┌──────────────────────────────────────────────┐
│            Market Data Provider              │
│                 yfinance                     │
└──────────────────────────────────────────────┘
```

The backend downloads prices **once** with `yfinance` and reuses the same dataset for correlation, optimization, Monte Carlo, and historical valuation.

---

## 🧠 Quantitative Methodology

### Returns

Daily **simple returns** are used for correlation and optimization:

$$
R_t = \frac{P_t}{P_{t-1}} - 1
$$

Daily **log returns** are used for the Monte Carlo simulation:

$$
r_t = \ln\left(\frac{P_t}{P_{t-1}}\right)
$$

### Portfolio Return and Variance

$$
R_p = \sum_{i=1}^{n} w_i R_i
$$

$$
\sigma_p^2 = \mathbf{w}^{T} \Sigma \mathbf{w}
$$

where:

- $R_p$ = portfolio return
- $w_i$ = weight of asset $i$
- $R_i$ = return of asset $i$
- $\mathbf{w}$ = weight vector
- $\Sigma$ = annualized covariance matrix
- $n$ = number of assets (10)

### Annualization

Daily estimates are annualized using **252 trading days**:

$$
\mu_{\text{annual}} = \mu_{\text{daily}} \times 252
\qquad
\Sigma_{\text{annual}} = \Sigma_{\text{daily}} \times 252
$$

### Sharpe Ratio

$$
\text{Sharpe} = \frac{E[R_p] - R_f}{\sigma_p}
$$

where $R_f$ is the user-provided risk-free rate.

### Portfolio Optimization

The optimal weights are computed server-side with **SciPy SLSQP** under these constraints:

- Long-only with a minimum allocation of **5%**: $w_i \ge 0.05$
- Maximum weight per asset: **100%**
- Fully invested: $\sum w_i = 1$

Objective options:

- **Minimum Variance:** minimize $\mathbf{w}^{T}\Sigma\mathbf{w}$
- **Maximum Sharpe:** maximize $\dfrac{\mathbf{w}^{T}\mu - R_f}{\sqrt{\mathbf{w}^{T}\Sigma\mathbf{w}}}$

### Monte Carlo Simulation

1. Daily log-return mean vector and covariance matrix are estimated from the 2-year history.
2. The covariance matrix is symmetrized and, if necessary, shifted by its smallest eigenvalue to ensure positive semi-definiteness.
3. Correlated daily log-returns are sampled with a multivariate normal distribution for every path and day.
4. Asset relatives are compounded and aggregated using the **optimized weights**.
5. Percentile bands (5, 25, 50, 75, 95) are computed across simulations for every day.

Portfolio paths start at a normalized value of **1.0**; the frontend displays them as relative performance.

### Historical Valuation

The 2-year chart values the portfolio in USD using the optimized weights and the configured initial investment:

$$
V_t = I \cdot \sum_{i=1}^{n} w_i \frac{P_{i,t}}{P_{i,0}}
$$

where $I$ is the initial investment.

---

## 🛠️ Tech Stack

### Backend & Data Science

| Technology | Role |
| --- | --- |
| **Python 3.12** | Core language |
| **FastAPI** | REST API and request validation |
| **Pydantic** | Schema validation and constraints |
| **NumPy** | Numerical simulation and linear algebra |
| **Pandas** | Historical data processing |
| **SciPy** | SLSQP portfolio optimization |
| **yfinance** | Market data retrieval |

### Frontend

| Technology | Role |
| --- | --- |
| **React 19** | UI and component state |
| **TypeScript 6** | Strict, type-safe development |
| **Vite 8** | Dev server and production build |
| **React Router 7** | Client-side routing |
| **Chart.js 4 + react-chartjs-2** | Interactive financial charts |
| **oxlint** | Linting |

### Infrastructure

- **Docker** and **Docker Compose**
- **Nginx** for serving the production frontend bundle

---

## 📂 Project Structure

```text
Montecarlo RIsk portfolio/
├── backend/
│   ├── main.py                  # FastAPI app + quantitative engine
│   ├── dockerfile               # Python 3.12 + Uvicorn image
│   ├── requierements.txt        # Python dependencies (note the spelling)
│   ├── tickers.csv              # Full ticker universe source (not used at runtime)
│   └── lol.py                   # Cleaning script for tickers.csv (not used at runtime)
│
├── frontend/
│   ├── src/
│   │   ├── api/
│   │   │   └── portfolioApi.ts          # HTTP client for POST /api/analyze
│   │   ├── components/
│   │   │   ├── layout/
│   │   │   │   ├── AppHeader.tsx
│   │   │   │   └── Sidebar.tsx
│   │   │   ├── portfolio/
│   │   │   │   ├── AssetSearch.tsx
│   │   │   │   └── PortfolioControls.tsx
│   │   │   └── visuals/
│   │   │       ├── HistoricalPricesVisual.tsx
│   │   │       ├── MonteCarloVisual.tsx
│   │   │       ├── CorrelationMatrixVisual.tsx
│   │   │       ├── SectorDistributionVisual.tsx
│   │   │       └── PortfolioOptimizationVisual.tsx
│   │   ├── constants/
│   │   │   └── portfolio.ts              # API base, default tickers, sector colors
│   │   ├── context/
│   │   │   ├── PortfolioContext.ts        # Context + usePortfolio hook
│   │   │   └── PortfolioProvider.tsx      # Shared state and API orchestration
│   │   ├── data/
│   │   │   └── stocks_cleaned.json        # 6,304 unique tickers with sector metadata
│   │   ├── pages/
│   │   │   ├── HomePage.tsx
│   │   │   ├── MonteCarloPage.tsx
│   │   │   └── CorrelationOptimizationPage.tsx
│   │   ├── routes/
│   │   │   ├── AppLayout.tsx
│   │   │   ├── AppRoutes.tsx
│   │   │   └── sections.ts                # Single source of truth for routes
│   │   ├── types/                         # API contracts and component props
│   │   ├── utils/
│   │   │   └── portfolio.ts               # Ticker catalog and sector aggregation
│   │   ├── App.tsx
│   │   ├── App.css
│   │   ├── index.css
│   │   └── main.tsx
│   ├── Dockerfile                        # Multi-stage Node build + Nginx
│   ├── package.json
│   ├── vite.config.ts
│   └── tsconfig*.json
│
├── docker-compose.yml
├── AGENT_GUIDE.md               # Internal maintenance guide
├── .gitignore
└── README.md
```

> `frontend/dist`, `node_modules`, `.agents`, `backend/tickers.csv`, `backend/lol.py`, and `AGENT_GUIDE.md` are ignored by Git. The app does not depend on the last three at runtime.

---

## 🚀 Getting Started

### Prerequisites

- **Python 3.12+**
- **Node.js 22+** and npm
- **Git**
- Optional: **Docker Desktop**

### 1. Clone the repository

```bash
git clone <YOUR_REPOSITORY_URL>
cd "Montecarlo RIsk portfolio"
```

### 2. Start the backend

```bash
cd backend
python -m venv .venv
```

Activate the virtual environment:

```bash
# Windows (PowerShell)
.\.venv\Scripts\Activate.ps1

# macOS / Linux
source .venv/bin/activate
```

Install dependencies and start the API:

```bash
pip install -r requierements.txt
uvicorn main:app --reload --port 8000
```

- API: <http://localhost:8000>
- Swagger UI: <http://localhost:8000/docs>
- Health check: <http://localhost:8000/health>

### 3. Start the frontend

In a second terminal:

```bash
cd frontend
npm install
npm run dev
```

Open <http://localhost:5173>.

The frontend automatically runs an initial analysis on load using the default 10 tickers. Market data comes from Yahoo Finance, so the first request can take several seconds.

### 4. Production build (frontend)

```bash
cd frontend
npm run build
npm run preview
```

### 5. Docker Compose

From the repository root:

```bash
docker compose up --build
```

- Frontend (Nginx): <http://localhost:3000>
- Backend: <http://localhost:8000>

> **Known issue:** `backend/dockerfile` expects `requirements.txt`, but the dependency file is currently named `requierements.txt`. Rename it (or update the `COPY` instruction) before building the backend image:
>
> ```bash
> mv backend/requierements.txt backend/requirements.txt
> ```

To stop the stack:

```bash
docker compose down
```

---

## 🔌 API Reference

The backend exposes a **single unified analysis endpoint**. All four analyses are computed from the same price download.

### `POST /api/analyze`

```http
POST http://localhost:8000/api/analyze
Content-Type: application/json
```

#### Request body

| Field | Type | Default | Constraints |
| --- | --- | --- | --- |
| `tickers` | `string[]` | 10 large-cap defaults | Exactly 10, distinct, non-empty; normalized to uppercase |
| `days_to_predict` | `integer` | `252` | `5`–`504` |
| `simulations` | `integer` | `1000` | `100`–`5000` |
| `objective` | `string` | `"min_variance"` | `"min_variance"` or `"max_sharpe"` |
| `risk_free_rate` | `float` | `0.0` | `0`–`1` (annualized) |
| `initial_investment` | `float` | `10000.0` | `> 0` |

The backend also accepts `investment_amount` as an alias for `initial_investment`. The frontend ships with `500` simulations and a `0.04` risk-free rate by default.

#### Example request

```json
{
  "tickers": ["TSLA", "AAPL", "MSFT", "AMZN", "GOOGL", "META", "NVDA", "NFLX", "AMD", "INTC"],
  "days_to_predict": 252,
  "simulations": 500,
  "objective": "min_variance",
  "risk_free_rate": 0.04,
  "initial_investment": 10000
}
```

#### Response shape

Abridged example — array contents are shortened with `"..."`.

```json
{
  "tickers": ["TSLA", "AAPL", "..."],
  "initial_investment": 10000,
  "investment_amount": 10000,
  "historical_prices": {
    "dates": ["2024-11-12", "..."],
    "tickers": ["TSLA", "AAPL", "..."],
    "initial_investment": 10000,
    "portfolio_values": [10000, 10050.25, "..."],
    "prices": { "TSLA": [210.5, 215.2, "..."] },
    "normalized_values": { "TSLA": [10000, 10223.2, "..."] },
    "allocated_values": { "TSLA": [500, 511.16, "..."] },
    "statistics": {
      "initial_value": 10000,
      "final_value": 14500,
      "total_profit_loss": 4500,
      "total_return_pct": 0.45,
      "min_portfolio_value": 9800,
      "max_portfolio_value": 15000
    }
  },
  "correlation": {
    "tickers": ["TSLA", "AAPL", "..."],
    "observations": 500,
    "method": "Pearson correlation of daily simple returns",
    "correlation_matrix": { "TSLA": { "AAPL": 0.42, "MSFT": 0.38 } }
  },
  "optimization": {
    "objective": "min_variance",
    "tickers": ["TSLA", "AAPL", "..."],
    "weights": { "TSLA": 0.05, "AAPL": 0.12 },
    "metrics": {
      "expected_annual_return": 0.12,
      "annual_variance": 0.04,
      "annual_volatility": 0.2,
      "sharpe_ratio": 0.4,
      "risk_free_rate": 0.04,
      "weights_sum": 1.0
    },
    "constraints": {
      "long_only": true,
      "minimum_weight": 0.05,
      "maximum_weight": 1.0,
      "weights_sum_to_one": true
    }
  },
  "monte_carlo": {
    "tickers": ["TSLA", "AAPL", "..."],
    "weights": { "TSLA": 0.05, "AAPL": 0.12 },
    "days": [0, 1, 2, "..."],
    "simulations": 500,
    "initial_portfolio_value": 1.0,
    "trajectories": [[1.0, 1.01, "..."]],
    "percentile_bands": { "5": [], "25": [], "50": [], "75": [], "95": [] },
    "statistics": {
      "mean_terminal_value": 1.1,
      "median_terminal_value": 1.08,
      "probability_of_loss": 0.3,
      "percentile_5_terminal_value": 0.8,
      "percentile_95_terminal_value": 1.4
    }
  }
}
```

#### Other endpoints

| Method | Path | Description |
| --- | --- | --- |
| `GET` | `/` | API status and available endpoints |
| `GET` | `/health` | Health check (`{"status": "ok"}`) |
| `GET` | `/docs` | Interactive Swagger UI |

#### Error handling

- `422` — invalid payload or infeasible optimization
- `502` — market data download failure
- FastAPI validation errors return `detail` as either a string or a list; the frontend handles both formats.

---

## 🧭 Frontend Architecture

### Bootstrap

```tsx
<BrowserRouter>
  <PortfolioProvider>
    <AppRoutes />
  </PortfolioProvider>
</BrowserRouter>
```

`PortfolioProvider` lives **above** the router, so ticker selection, configuration, and analysis results persist across navigation.

### Data flow

```text
PortfolioControls
      │
      ├── addTicker / removeTicker / resetDefaultTickers
      ├── setDaysToPredict / setSimulations / setObjective
      ├── setRiskFreeRate / setInitialInvestment
      │
      └── runAnalysis()
              │
              ▼
       POST /api/analyze
              │
              ▼
   historical_prices · correlation · optimization · monte_carlo
              │
              ▼
       PortfolioProvider (React context)
              │
              ├── historicalData ──► HistoricalPricesVisual (Home)
              ├── mcData ──────────► MonteCarloVisual (Montecarlo)
              ├── corrData ────────► CorrelationMatrixVisual
              ├── optData ─────────► PortfolioOptimizationVisual
              └── sectorAllocations ► SectorDistributionVisual
```

Key rules:

- Pages and visuals **never call `fetch` directly**; everything goes through `runAnalysis()`.
- Navigation paths come from `ROUTES` in `routes/sections.ts`.
- The initial analysis runs once on mount, with a `StrictMode` guard to avoid duplicate requests.

### Frontend scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start the Vite dev server |
| `npm run build` | Type-check (`tsc -b`) and build for production |
| `npm run preview` | Preview the production build |
| `npm run lint` | Run oxlint |

---

## ⚙️ Configuration

The API base URL is currently hardcoded in `frontend/src/constants/portfolio.ts`:

```ts
export const API_BASE = "http://localhost:8000";
```

For a real deployment, replace it with a Vite environment variable:

```ts
export const API_BASE =
  import.meta.env.VITE_API_BASE ?? "http://localhost:8000";
```

```env
# frontend/.env
VITE_API_BASE=https://your-api.example.com
```

Other configurable defaults:

- `DEFAULT_TICKERS` and `SECTOR_COLORS` in `frontend/src/constants/portfolio.ts`
- Initial horizon, simulations, objective, risk-free rate, and investment in `PortfolioProvider.tsx`
- Backend validation ranges in `backend/main.py`

---

## ⚠️ Known Limitations

- **External market data:** `yfinance` relies on Yahoo Finance and may be rate-limited, delayed, or temporarily unavailable.
- **Initial request cost:** the app automatically downloads 2 years of prices on load, so the first analysis can take several seconds.
- **Docker dependency filename:** `backend/dockerfile` references `requirements.txt`, but the repository file is `requierements.txt` (see the Docker section).
- **SPA routing in production:** when running behind Nginx, configure a fallback to `index.html` so routes such as `/montecarlo` work on refresh:
  ```nginx
  location / {
    try_files $uri $uri/ /index.html;
  }
  ```
- **Open CORS:** the backend allows all origins, which is suitable for local development but should be restricted in production.
- **No automated tests:** there is currently no backend or frontend test suite; validation is done through the Swagger UI and the frontend build/lint commands.
- **Bundle size:** the production build includes Chart.js and may trigger Vite's chunk-size warning; lazy loading pages/charts can reduce it.

---

## 🎯 Project Goals

This project combines concepts from:

- Quantitative finance and risk modeling
- Numerical optimization (mean-variance, Sharpe maximization)
- Statistical simulation with correlated returns
- REST API design with FastAPI and Pydantic
- Interactive data visualization with React and Chart.js
- Containerized deployment with Docker

---

## ⚠️ Disclaimer

This application is intended for **educational and analytical purposes only**. Monte Carlo simulations and optimization results rely on historical data and modeling assumptions that may not reflect future market conditions.

Nothing in this application constitutes financial advice. Simulated or historical results are not guarantees of future performance.

---

<p align="center">
  <strong>Built with Python, React, and a passion for quantitative finance. 🚀</strong>
</p>
