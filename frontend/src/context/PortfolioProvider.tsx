import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { analyzePortfolio } from "../api/portfolioApi";
import { DEFAULT_TICKERS } from "../constants/portfolio";
import { PortfolioContext } from "./PortfolioContext";
import type {
  CorrelationResponse,
  HistoricalPricesResponse,
  MonteCarloResponse,
  OptimizationObjective,
  OptimizeResponse,
} from "../types/api";
import type { PortfolioContextValue } from "../types/portfolio";
import {
  buildSectorAllocations,
  buildTickerCatalog,
} from "../utils/portfolio";

interface PortfolioProviderProps {
  children: ReactNode;
}

export function PortfolioProvider({ children }: PortfolioProviderProps) {
  const [selectedTickers, setSelectedTickers] =
    useState<string[]>(DEFAULT_TICKERS);
  const [daysToPredict, setDaysToPredict] = useState<number>(252);
  const [simulations, setSimulations] = useState<number>(500);
  const [objective, setObjective] =
    useState<OptimizationObjective>("min_variance");
  const [riskFreeRate, setRiskFreeRate] = useState<number>(0.04);
  const [initialInvestment, setInitialInvestment] = useState<number>(10000);

  const [mcData, setMcData] = useState<MonteCarloResponse | null>(null);
  const [corrData, setCorrData] = useState<CorrelationResponse | null>(null);
  const [optData, setOptData] = useState<OptimizeResponse | null>(null);
  const [historicalData, setHistoricalData] =
    useState<HistoricalPricesResponse | null>(null);

  const [loading, setLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const { allAvailableTickers, tickerToSectorMap } = useMemo(
    () => buildTickerCatalog(),
    [],
  );

  const sectorAllocations = useMemo(
    () => buildSectorAllocations(optData, tickerToSectorMap),
    [optData, tickerToSectorMap],
  );

  const addTicker = useCallback(
    (tickerToAdd: string): boolean => {
      const clean = tickerToAdd.trim().toUpperCase();
      if (!clean) return false;

      if (selectedTickers.includes(clean)) {
        alert("Asset is already selected.");
        return false;
      }

      if (selectedTickers.length >= 10) {
        alert(
          "Exactly 10 tickers are required. Remove one before adding another.",
        );
        return false;
      }

      setSelectedTickers((current) => [...current, clean]);
      return true;
    },
    [selectedTickers],
  );

  const removeTicker = useCallback((tickerToRemove: string) => {
    setSelectedTickers((current) =>
      current.filter((ticker) => ticker !== tickerToRemove),
    );
  }, []);

  const resetDefaultTickers = useCallback(() => {
    setSelectedTickers(DEFAULT_TICKERS);
  }, []);

  const runAnalysis = useCallback(async () => {
    if (selectedTickers.length !== 10) {
      setErrorMsg(
        "You must select exactly 10 distinct tickers according to backend requirements.",
      );
      return;
    }

    setLoading(true);
    setErrorMsg(null);

    try {
      const analysis = await analyzePortfolio({
        tickers: selectedTickers,
        days_to_predict: Number(daysToPredict),
        simulations: Number(simulations),
        objective,
        risk_free_rate: Number(riskFreeRate),
        initial_investment: Number(initialInvestment),
      });

      setCorrData(analysis.correlation);
      setOptData(analysis.optimization);
      setMcData(analysis.monte_carlo);
      setHistoricalData(analysis.historical_prices);
    } catch (error: unknown) {
      if (error instanceof Error) {
        setErrorMsg(error.message);
      } else {
        setErrorMsg("Failed to connect to backend API.");
      }
    } finally {
      setLoading(false);
    }
  }, [selectedTickers, daysToPredict, simulations, objective, riskFreeRate, initialInvestment]);

  // Initial automatic load, executed only once even in React StrictMode.
  const hasAutoRun = useRef(false);
  useEffect(() => {
    if (hasAutoRun.current) return;
    hasAutoRun.current = true;
    void runAnalysis();
  }, [runAnalysis]);

  const value: PortfolioContextValue = {
    selectedTickers,
    daysToPredict,
    simulations,
    objective,
    riskFreeRate,
    initialInvestment,
    mcData,
    corrData,
    optData,
    historicalData,
    sectorAllocations,
    loading,
    errorMsg,
    allAvailableTickers,
    setDaysToPredict,
    setSimulations,
    setObjective,
    setRiskFreeRate,
    setInitialInvestment,
    addTicker,
    removeTicker,
    resetDefaultTickers,
    runAnalysis,
  };

  return (
    <PortfolioContext.Provider value={value}>
      {children}
    </PortfolioContext.Provider>
  );
}
