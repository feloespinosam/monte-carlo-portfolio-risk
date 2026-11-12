import { BrowserRouter } from "react-router-dom";
import "./App.css";
import { PortfolioProvider } from "./context/PortfolioProvider";
import { AppRoutes } from "./routes/AppRoutes";

function App() {
  return (
    <BrowserRouter>
      <PortfolioProvider>
        <AppRoutes />
      </PortfolioProvider>
    </BrowserRouter>
  );
}

export default App;
