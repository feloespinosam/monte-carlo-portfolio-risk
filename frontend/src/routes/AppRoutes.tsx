import { Navigate, Route, Routes } from "react-router-dom";
import { CorrelationOptimizationPage } from "../pages/CorrelationOptimizationPage";
import { HomePage } from "../pages/HomePage";
import { MonteCarloPage } from "../pages/MonteCarloPage";
import { AppLayout } from "./AppLayout";
import { ROUTES } from "./sections";

export function AppRoutes() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route index element={<HomePage />} />
        <Route path={ROUTES.monteCarlo} element={<MonteCarloPage />} />
        <Route
          path={ROUTES.correlationOptimization}
          element={<CorrelationOptimizationPage />}
        />
        <Route path="*" element={<Navigate to={ROUTES.home} replace />} />
      </Route>
    </Routes>
  );
}
