import { PortfolioControls } from "../components/portfolio/PortfolioControls";
import { MonteCarloVisual } from "../components/visuals/MonteCarloVisual";
import { usePortfolio } from "../context/PortfolioContext";

export function MonteCarloPage() {
  const { mcData, loading } = usePortfolio();

  return (
    <>
      <PortfolioControls />
      <MonteCarloVisual data={mcData} loading={loading} />
    </>
  );
}
