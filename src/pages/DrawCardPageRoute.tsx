import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import * as gameService from "../game/gameService";
import { DrawCardPage } from "../components/DrawCardPage";

/** Route wrapper for the dummy draw-card page. Re-selects the case from the
 * URL (in case this page was reached via a fresh reload/direct link, not
 * navigation from the dashboard) before rendering the placeholder. */
export function DrawCardPageRoute() {
  const { caseId } = useParams<{ caseId: string }>();
  const navigate = useNavigate();
  const [ready, setReady] = useState(false);

  // `ready` only flips true after selectCase has actually run, so the
  // render below never reads case-dependent data (like the theme) before
  // gameService has a case selected.
  useEffect(() => {
    setReady(false);
    if (!caseId) return;
    try {
      gameService.selectCase(caseId);
    } catch {
      navigate("/", { replace: true });
      return;
    }
    setReady(true);
  }, [caseId, navigate]);

  if (!caseId || !ready) return null;

  return (
    <div className="app" style={gameService.getCaseThemeStyle()}>
      <DrawCardPage onBack={() => navigate(`/case/${caseId}`)} />
    </div>
  );
}
