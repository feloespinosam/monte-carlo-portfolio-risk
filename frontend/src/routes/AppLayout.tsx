import { Outlet } from "react-router-dom";
import { AppHeader } from "../components/layout/AppHeader";
import { Sidebar } from "../components/layout/Sidebar";

export function AppLayout() {
  return (
    <div className="portfolio-app">
      <Sidebar />
      <div className="app-content">
        <AppHeader />
        <main className="app-main">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
