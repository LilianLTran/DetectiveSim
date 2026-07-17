import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import type { GameState } from "../game/types";
import * as gameService from "../game/gameService";
import { DashboardHeader } from "../components/DashboardHeader";
import { TravelPage } from "../components/TravelPage";

/** Route wrapper for the full-page map. Loads the same persisted GameState
 * the dashboard uses (not a copy that drifts) so the highlighted "current
 * location" and which travel succeeds/fails stays consistent with it. */
export function TravelPageRoute() {
  const { caseId, hubLocationId } = useParams<{ caseId: string; hubLocationId?: string }>();
  const navigate = useNavigate();

  const [state, setState] = useState<GameState | null>(null);
  const [messages, setMessages] = useState<string[]>([]);
  // Captured on the click that triggers a message (capture phase runs before
  // the click handler that calls setMessages), so the toast can appear at
  // the cursor instead of a fixed corner.
  const cursorPosRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    if (!caseId) return;
    try {
      gameService.selectCase(caseId);
    } catch {
      navigate("/", { replace: true });
      return;
    }
    const loaded = gameService.loadGame();
    setState(loaded ?? gameService.startNewGame());
    setMessages([]);
  }, [caseId, navigate]);

  function handleBack() {
    // From an inner map, back goes up to the outer map, not straight to the
    // dashboard - only the outer map (no hubLocationId) backs out that far.
    if (hubLocationId) {
      navigate(`/case/${caseId}/travel`);
    } else {
      navigate(`/case/${caseId}`);
    }
  }

  function handleOpenSubMap(locationId: string) {
    navigate(`/case/${caseId}/travel/${locationId}`);
  }

  function handleQuitToTitle() {
    navigate("/");
  }

  function handleRestartGame() {
    gameService.startNewGame();
    // A restart resets the current location, so head back to the dashboard
    // to see it rather than staying on the map picking a now-stale location.
    navigate(`/case/${caseId}`);
  }

  if (!caseId || !state) return null;

  function handleSelectLocation(locationId: string) {
    const result = gameService.travelTo(state!, locationId);
    if (result.state.currentLocationId !== state!.currentLocationId) {
      // Travel succeeded - go straight back to the dashboard to see the new room.
      navigate(`/case/${caseId}`);
      return;
    }
    // Travel was rejected (e.g. a locked location) - stay here and show why.
    setState(result.state);
    setMessages(result.messages);
  }

  const travelMapView = hubLocationId
    ? gameService.getSubMapView(state, hubLocationId)
    : gameService.getTravelMapView(state);
  const dashboardInfo = gameService.getDashboardInfo(state);
  const themeStyle = gameService.getCaseThemeStyle();

  return (
    <div
      className="app"
      style={themeStyle}
      onClickCapture={(e) => {
        cursorPosRef.current = { x: e.clientX, y: e.clientY };
      }}
    >
      <DashboardHeader info={dashboardInfo} onRestartGame={handleRestartGame} onQuitToTitle={handleQuitToTitle} />

      {messages.length > 0 && (
        <div
          className="toast"
          style={{ left: cursorPosRef.current.x + 14, top: cursorPosRef.current.y + 14 }}
          onClick={() => setMessages([])}
        >
          {messages.map((m, i) => (
            <p key={i}>{m}</p>
          ))}
        </div>
      )}
      <TravelPage
        mapImage={travelMapView.mapImage}
        locations={travelMapView.locations}
        onSelectLocation={handleSelectLocation}
        onOpenSubMap={handleOpenSubMap}
        onBack={handleBack}
      />
    </div>
  );
}
