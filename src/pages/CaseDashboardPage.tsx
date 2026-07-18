import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import type { GameState } from "../game/types";
import * as gameService from "../game/gameService";
import { DashboardHeader } from "../components/DashboardHeader";
import { MapPreview } from "../components/MapPreview";
import { MapModal } from "../components/MapModal";
import { RoomPanel } from "../components/RoomPanel";
import { LocationActionsPreview } from "../components/LocationActionsPreview";
import { LocationActionsModal } from "../components/LocationActionsModal";
import { DialogueModal } from "../components/DialogueModal";
import { InventoryPreview } from "../components/InventoryPreview";
import { InventoryModal } from "../components/InventoryModal";
import { DrawCardPanel } from "../components/DrawCardPanel";
import { SpecialActionPanel } from "../components/SpecialActionPanel";
import { CaseSummaryPanel } from "../components/CaseSummaryPanel";
import { SidebarActionsPreview } from "../components/SidebarActionsPreview";
import { SidebarActionsModal } from "../components/SidebarActionsModal";

// This owns GameState for whichever case the URL names. It never inspects
// the story rules directly - every state change comes back from a
// gameService call, and every piece of UI below only renders the view
// objects that come with it.
export function CaseDashboardPage() {
  const { caseId } = useParams<{ caseId: string }>();
  const navigate = useNavigate();

  const [state, setState] = useState<GameState | null>(null);
  const [messages, setMessages] = useState<string[]>([]);
  const [isMapOpen, setIsMapOpen] = useState(false);
  // Set while viewing a location's inner subMap; undefined means the outer map.
  const [mapHubId, setMapHubId] = useState<string | undefined>(undefined);
  // Which of the Explore Area / People Here modals is open, if any.
  const [locationModal, setLocationModal] = useState<"explore" | "people" | null>(null);
  // Which of the Relationships / Current Lead modals is open, if any.
  const [sidebarModal, setSidebarModal] = useState<"relationships" | "lead" | null>(null);
  const [isInventoryOpen, setIsInventoryOpen] = useState(false);
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
    setMessages([]);
    setIsMapOpen(false);
    setMapHubId(undefined);
    setLocationModal(null);
    setSidebarModal(null);
    setIsInventoryOpen(false);
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

  function handleSpecialAction() {
    setMessages(["This feature isn't implemented yet."]);
  }

  function handleOpenMap() {
    setMapHubId(undefined);
    setIsMapOpen(true);
  }

  function handleOpenSubMap(locationId: string) {
    setMapHubId(locationId);
  }

  function handleMapBack() {
    // From an inner map, back goes up to the outer map, not straight to
    // closing the modal - only the outer map (no mapHubId) closes it.
    if (mapHubId) {
      setMapHubId(undefined);
    } else {
      setIsMapOpen(false);
    }
  }

  function handleCloseMap() {
    setIsMapOpen(false);
    setMapHubId(undefined);
  }

  function handleSelectLocationOnMap(locationId: string) {
    const result = gameService.travelTo(state!, locationId);
    if (result.state.currentLocationId !== state!.currentLocationId) {
      // Travel succeeded - close the modal so the dashboard shows the new room.
      setState(result.state);
      handleCloseMap();
      return;
    }
    // Travel was rejected (e.g. a locked location) - stay open and show why.
    setState(result.state);
    setMessages(result.messages);
  }

  function handleNewGame() {
    setMessages([]);
    setIsMapOpen(false);
    setMapHubId(undefined);
    setLocationModal(null);
    setSidebarModal(null);
    setIsInventoryOpen(false);
    setState(gameService.startNewGame());
  }

  const locationView = gameService.getLocationView(state);
  const dialogueView = gameService.getDialogueView(state);
  const evidenceViews = gameService.getEvidenceViews(state);
  const relationshipViews = gameService.getRelationshipViews(state);
  const dashboardInfo = gameService.getDashboardInfo(state);
  const mapData = gameService.getMapData();
  const cardDeckView = gameService.getCardDeckView(state);
  const caseSummaryView = gameService.getCaseSummaryView(state);
  const themeStyle = gameService.getCaseThemeStyle();
  const travelMapView = isMapOpen
    ? (mapHubId ? gameService.getSubMapView(state, mapHubId) : gameService.getTravelMapView(state))
    : null;

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
          <SidebarActionsPreview
            relationshipCount={relationshipViews.length}
            onOpenRelationships={() => setSidebarModal("relationships")}
            onOpenLead={() => setSidebarModal("lead")}
          />
        </div>

        <div className="app-grid__center">
          <RoomPanel location={locationView} />
          <InventoryPreview itemCount={evidenceViews.length} evidence={evidenceViews} onOpen={() => setIsInventoryOpen(true)} />
        </div>

        <div className="app-grid__right">
          <MapPreview mapImage={mapData.mapImage} locationName={dashboardInfo.locationName} onOpenMap={handleOpenMap} />
          <LocationActionsPreview
            exploreCount={locationView.exploreActions.length}
            peopleCount={locationView.peopleHere.length}
            onOpenExplore={() => setLocationModal("explore")}
            onOpenPeople={() => setLocationModal("people")}
          />
          <SpecialActionPanel onUse={handleSpecialAction} />
          <DrawCardPanel deck={cardDeckView} onOpenDrawCard={handleOpenDrawCard} />
        </div>
      </main>

      {isMapOpen && travelMapView && (
        <MapModal
          mapImage={travelMapView.mapImage}
          locations={travelMapView.locations}
          canGoBack={mapHubId !== undefined}
          onSelectLocation={handleSelectLocationOnMap}
          onOpenSubMap={handleOpenSubMap}
          onBack={handleMapBack}
          onClose={handleCloseMap}
        />
      )}

      {locationModal && (
        <LocationActionsModal
          mode={locationModal}
          location={locationView}
          onExplore={handleExplore}
          onTalk={handleTalk}
          onClose={() => setLocationModal(null)}
        />
      )}

      {sidebarModal && (
        <SidebarActionsModal
          mode={sidebarModal}
          relationships={relationshipViews}
          currentLead={caseSummaryView.currentLead}
          onClose={() => setSidebarModal(null)}
        />
      )}

      {isInventoryOpen && <InventoryModal evidence={evidenceViews} onClose={() => setIsInventoryOpen(false)} />}

      <DialogueModal dialogue={dialogueView} locationImage={locationView.image} onChoose={handleChooseDialogue} />
    </div>
  );
}
