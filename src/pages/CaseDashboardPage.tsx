import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import type { GameState, EndingResult, Accusation } from "../game/types";
import * as gameService from "../game/gameService";
import { DashboardHeader } from "../components/DashboardHeader";
import { MapPreview } from "../components/MapPreview";
import { RoomPanel } from "../components/RoomPanel";
import { DialoguePanel } from "../components/DialoguePanel";
import { EvidencePanel } from "../components/EvidencePanel";
import { RelationshipPanel } from "../components/RelationshipPanel";
import { InventoryPanel } from "../components/InventoryPanel";
import { AccusationPanel } from "../components/AccusationPanel";
import { NotebookPanel } from "../components/NotebookPanel";
import { DrawCardPanel } from "../components/DrawCardPanel";
import { CaseSummaryPanel } from "../components/CaseSummaryPanel";

// This owns GameState for whichever case the URL names. It never inspects
// the story rules directly - every state change comes back from a
// gameService call, and every piece of UI below only renders the view
// objects that come with it.
export function CaseDashboardPage() {
  const { caseId } = useParams<{ caseId: string }>();
  const navigate = useNavigate();

  const [state, setState] = useState<GameState | null>(null);
  const [ending, setEnding] = useState<EndingResult | null>(null);
  const [messages, setMessages] = useState<string[]>([]);
  // Captured on the click that triggers a message (capture phase runs before
  // the click handler that calls setMessages), so the toast can appear at
  // the cursor instead of a fixed corner.
  const cursorPosRef = useRef({ x: 0, y: 0 });

  // Re-runs whenever the URL's :caseId changes (including browser
  // back/forward between two different cases), not just on first mount.
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
    setEnding(null);
    setMessages([]);
  }, [caseId, navigate]);

  function handleBackToTitle() {
    navigate("/");
  }

  if (!state) {
    return <div className="app-loading">Loading case file...</div>;
  }

  function applyResult(result: { state: GameState; messages: string[] }) {
    setState(result.state);
    if (result.messages.length > 0) setMessages(result.messages);
  }

  function handleExplore(actionId: string) {
    applyResult(gameService.performExploreAction(state!, actionId));
  }

  function handleTalk(characterId: string) {
    applyResult(gameService.startDialogue(state!, characterId));
  }

  function handleChooseDialogue(choiceId: string) {
    applyResult(gameService.chooseDialogueChoice(state!, choiceId));
  }

  function handleOpenDrawCard() {
    navigate(`/case/${caseId}/draw-card`);
  }

  function handleOpenMap() {
    navigate(`/case/${caseId}/travel`);
  }

  function handleAccuse(accusation: Accusation) {
    const outcome = gameService.accuse(state!, accusation);
    setState(outcome.state);
    setEnding(outcome.ending);
  }

  function handleNewGame() {
    setEnding(null);
    setMessages([]);
    setState(gameService.startNewGame());
  }

  const locationView = gameService.getLocationView(state);
  const dialogueView = gameService.getDialogueView(state);
  const evidenceViews = gameService.getEvidenceViews(state);
  const relationshipViews = gameService.getRelationshipViews(state);
  const notebookEntries = gameService.getNotebookEntries(state);
  const dashboardInfo = gameService.getDashboardInfo(state);
  const mapData = gameService.getMapData();
  const accusationOptions = gameService.getAccusationOptions();
  const cardDeckView = gameService.getCardDeckView(state);
  const caseSummaryView = gameService.getCaseSummaryView(state);
  const themeStyle = gameService.getCaseThemeStyle();

  return (
    <div
      className="app"
      style={themeStyle}
      onClickCapture={(e) => {
        cursorPosRef.current = { x: e.clientX, y: e.clientY };
      }}
    >
      <DashboardHeader info={dashboardInfo} onRestartGame={handleNewGame} onQuitToTitle={handleBackToTitle} />

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

      <main className="app-grid">
        <div className="app-grid__left">
          <CaseSummaryPanel summary={caseSummaryView} />
          <EvidencePanel evidence={evidenceViews} />
        </div>

        <div className="app-grid__center">
          <RoomPanel location={locationView} onExplore={handleExplore} onTalk={handleTalk} />
          <DialoguePanel dialogue={dialogueView} onChoose={handleChooseDialogue} />
        </div>

        <div className="app-grid__right">
          <MapPreview mapImage={mapData.mapImage} locationName={dashboardInfo.locationName} onOpenMap={handleOpenMap} />
          <InventoryPanel evidence={evidenceViews} />
          <NotebookPanel entries={notebookEntries} />
          <DrawCardPanel deck={cardDeckView} onOpenDrawCard={handleOpenDrawCard} />
        </div>

        <div className="app-grid__bottom">
          <RelationshipPanel relationships={relationshipViews} />
          <AccusationPanel options={accusationOptions} ending={ending} onAccuse={handleAccuse} />
        </div>
      </main>

      {ending && (
        <button className="action-button app__restart" onClick={handleNewGame}>
          Start New Game
        </button>
      )}
    </div>
  );
}
