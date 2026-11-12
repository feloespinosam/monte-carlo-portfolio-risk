import type { MonteCarloResponse } from "./api";

export interface MonteCarloVisualProps {
  data: MonteCarloResponse | null;
  loading?: boolean;
  initialDisplayPaths?: number;
}
