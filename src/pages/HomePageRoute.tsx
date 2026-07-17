import { useNavigate } from "react-router-dom";
import * as gameService from "../game/gameService";
import { HomePage } from "../components/HomePage";

/** Thin routing wrapper: HomePage itself stays route-agnostic (just cases +
 * onSelectCase), this is the only place that turns a selection into a URL. */
export function HomePageRoute() {
  const navigate = useNavigate();

  return <HomePage cases={gameService.listCases()} onSelectCase={(caseId) => navigate(`/case/${caseId}`)} />;
}
