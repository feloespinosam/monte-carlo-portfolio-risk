import { createContext, useContext } from "react";
import type { PortfolioContextValue } from "../types/portfolio";

export const PortfolioContext = createContext<PortfolioContextValue | null>(
  null,
);

export function usePortfolio(): PortfolioContextValue {
  const context = useContext(PortfolioContext);
  if (!context) {
    throw new Error("usePortfolio must be used within a PortfolioProvider");
  }
  return context;
}
