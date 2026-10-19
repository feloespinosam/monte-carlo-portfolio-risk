# 📈 Monte Carlo Portfolio Risk Simulator

<p align="center">
  <strong>A quantitative finance web application for portfolio risk analysis, Monte Carlo simulations, and investment optimization.</strong>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Python-3776AB?style=for-the-badge&logo=python&logoColor=white" alt="Python" />
  <img src="https://img.shields.io/badge/FastAPI-009688?style=for-the-badge&logo=fastapi&logoColor=white" alt="FastAPI" />
  <img src="https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB" alt="React" />
  <img src="https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white" alt="Docker" />
</p>

---

## 💡 About the Project

**Monte Carlo Portfolio Risk Simulator** is a full-stack application designed to explore portfolio behavior under different market scenarios.

By combining historical stock market data, statistical modeling, Monte Carlo simulation, and portfolio optimization, the application helps users understand investment risk and explore alternative asset allocations.

The goal is to bridge **quantitative finance, data science, and full-stack development** in one interactive application.

## ✨ Features

| Feature                   | Description                                                                             |
| ------------------------- | --------------------------------------------------------------------------------------- |
| 🎲 Monte Carlo Simulation | Generate multiple potential portfolio performance paths.                                |
| 📊 Risk Analysis          | Explore simulated portfolio outcomes and downside scenarios.                            |
| 🔗 Correlation Matrix     | Analyze relationships between stocks using historical returns.                          |
| ⚖️ Portfolio Optimization | Calculate asset allocations using minimum variance and maximum Sharpe ratio objectives. |
| 📈 Data Visualization     | Explore portfolio analytics through an interactive frontend.                            |
| 🏦 Stock Selection        | Build portfolios using 10 unique stock tickers.                                         |

## 🧠 Quantitative Finance

The simulator explores several core financial modeling concepts:

- **Historical Returns:** Calculate daily asset returns from historical market prices.
- **Covariance Matrix:** Model asset volatility and relationships between returns.
- **Multivariate Sampling:** Generate correlated random returns for multiple assets.
- **Monte Carlo Paths:** Simulate potential future portfolio trajectories.
- **Minimum Variance Optimization:** Find portfolio weights that minimize portfolio variance.
- **Maximum Sharpe Ratio:** Optimize portfolio weights based on risk-adjusted return.

### 📐 Portfolio Modeling

Portfolio returns depend on the allocation assigned to each asset:

\[
R*p = \sum*{i=1}^{n} w_i R_i
\]

Where:

- \(R_p\) = portfolio return
- \(w_i\) = weight assigned to asset \(i\)
- \(R_i\) = return of asset \(i\)
- \(n\) = number of assets

Portfolio variance incorporates the covariance between assets:

\[
\sigma_p^2 = \mathbf{w}^{T}\Sigma\mathbf{w}
\]

Where \(\mathbf{w}\) represents portfolio weights and \(\Sigma\) is the covariance matrix.

## 🛠️ Tech Stack

### Backend & Data Science

- **Python** — Core programming language
- **FastAPI** — REST API development
- **NumPy** — Numerical computation and simulation
- **Pandas** — Historical financial data processing
- **yfinance** — Market data retrieval
- **SciPy** — Numerical portfolio optimization

### Frontend

- **React** — User interface
- **TypeScript** — Type-safe application development

### Infrastructure

- **Docker** — Containerization
- **Docker Compose** — Multi-container application orchestration

## 🏗️ Architecture

```text
┌──────────────────────────────┐
│       React + TypeScript     │
│       Interactive UI         │
└──────────────┬───────────────┘
               │ HTTP / JSON
               ▼
┌──────────────────────────────┐
│          FastAPI             │
│         REST API             │
└──────────────┬───────────────┘
               │
               ▼
┌──────────────────────────────┐
│      Financial Engine        │
│                              │
│  • Historical market data    │
│  • Return calculations       │
│  • Monte Carlo simulation    │
│  • Correlation analysis      │
│  • Portfolio optimization    │
└──────────────┬───────────────┘
               │
               ▼
┌──────────────────────────────┐
│     Market Data Provider     │
│           yfinance           │
└──────────────────────────────┘
```

## 🚀 Getting Started

### Prerequisites

Make sure you have installed:

- [Git](https://git-scm.com/)
- [Docker Desktop](https://www.docker.com/products/docker-desktop/)

### 1. Clone the repository

```bash
git clone <YOUR_REPOSITORY_URL>
cd <YOUR_PROJECT_FOLDER>
```

### 2. Build and run the application

From the directory containing `docker-compose.yml`, run:

```bash
docker compose up --build
```

### 3. Stop the application

Press `Ctrl + C` in the terminal. To stop and remove the Compose containers and network, run:

```bash
docker compose down
```

## 🔌 API Documentation

The backend uses FastAPI to expose endpoints for portfolio analytics.

Current API functionality includes:

- Monte Carlo portfolio analysis
- Correlation matrix calculation
- Portfolio optimization

When the backend is running locally, open:

```text
http://localhost:8000/docs
```

This opens the interactive Swagger documentation, provided the backend is configured to use port `8000`.

## 📂 Project Structure

```text
MonteCarloRiskPortfolio/
├── backend/
│   ├── Dockerfile
│   ├── requirements.txt
│   └── ...
├── frontend/
│   ├── Dockerfile
│   └── src/
│       └── App.tsx
├── docker-compose.yml
├── .gitignore
└── README.md
```

## 🎯 Project Goals

This project combines concepts from:

- Quantitative finance
- Financial risk modeling
- Numerical optimization
- Statistical simulation
- REST API development
- Interactive data visualization
- Containerized application deployment

It is an ongoing exploration of how financial mathematics and modern web technologies can work together to make portfolio analysis more accessible.

## ⚠️ Disclaimer

This application is intended for educational and analytical purposes only. Monte Carlo simulations rely on assumptions and historical data that may not reflect future market conditions.

Simulated results are not guarantees of future performance and should not be interpreted as financial advice.

---

<p align="center">
  <strong>Built with Python, React, and a passion for quantitative finance. 🚀</strong>
</p>
