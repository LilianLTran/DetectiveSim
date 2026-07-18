import { Routes, Route } from "react-router-dom";
import { HomePageRoute } from "./pages/HomePageRoute";
import { CaseDashboardPage } from "./pages/CaseDashboardPage";
import { DrawCardPageRoute } from "./pages/DrawCardPageRoute";

// App.tsx only maps URLs to pages. Each page owns its own state and talks
// to gameService directly - this file has no game logic of its own.
export default function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePageRoute />} />
      <Route path="/case/:caseId" element={<CaseDashboardPage />} />
      <Route path="/case/:caseId/draw-card" element={<DrawCardPageRoute />} />
    </Routes>
  );
}
