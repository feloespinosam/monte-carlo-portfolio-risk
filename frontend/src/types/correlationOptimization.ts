import type { CorrelationResponse, OptimizeResponse } from "./api";
import type { SectorAllocation } from "./portfolio";

export interface CorrelationMatrixVisualProps {
  data: CorrelationResponse | null;
  loading?: boolean;
}

export interface SectorDistributionVisualProps {
  allocations: SectorAllocation[];
}

export interface PortfolioOptimizationVisualProps {
  data: OptimizeResponse | null;
  sectorAllocations?: SectorAllocation[];
  loading?: boolean;
}
