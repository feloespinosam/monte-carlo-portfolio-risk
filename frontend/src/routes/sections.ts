export const ROUTES = {
  home: "/",
  monteCarlo: "/montecarlo",
  correlationOptimization: "/correlation-optimization",
} as const;

export interface AppSection {
  path: string;
  label: string;
  end: boolean;
}

export const SECTIONS: AppSection[] = [
  { path: ROUTES.home, label: "Home", end: true },
  { path: ROUTES.monteCarlo, label: "Montecarlo", end: false },
  {
    path: ROUTES.correlationOptimization,
    label: "Correlation & Optimization",
    end: false,
  },
];
