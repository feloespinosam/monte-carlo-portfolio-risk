import { PortfolioControls } from "../components/portfolio/PortfolioControls";
import { HistoricalPricesVisual } from "../components/visuals/HistoricalPricesVisual";
import { usePortfolio } from "../context/PortfolioContext";

export function HomePage() {
  const { historicalData, initialInvestment, loading } = usePortfolio();

  return (
    <>
      <PortfolioControls />
      <HistoricalPricesVisual
        data={historicalData}
        initialInvestment={initialInvestment}
        loading={loading}
      />
    </>
  );
}
