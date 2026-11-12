import { PortfolioControls } from "../components/portfolio/PortfolioControls";
import { CorrelationMatrixVisual } from "../components/visuals/CorrelationMatrixVisual";
import { PortfolioOptimizationVisual } from "../components/visuals/PortfolioOptimizationVisual";
import { usePortfolio } from "../context/PortfolioContext";

export function CorrelationOptimizationPage() {
  const { corrData, optData, sectorAllocations, loading } = usePortfolio();

  return (
    <>
      <PortfolioControls />
      <CorrelationMatrixVisual data={corrData} loading={loading} />
      <PortfolioOptimizationVisual
        data={optData}
        sectorAllocations={sectorAllocations}
        loading={loading}
      />
    </>
  );
}
