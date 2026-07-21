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
import { ActionModal } from "../components/ActionModal";
import { DialogueModal } from "../components/DialogueModal";
import { SceneNotice } from "../components/SceneNotice";
import { InventoryModal } from "../components/InventoryModal";
import { DrawCardPanel } from "../components/DrawCardPanel";
import { SpecialActionPanel } from "../components/SpecialActionPanel";
import { CaseSummaryPanel } from "../components/CaseSummaryPanel";
import { CurrentLeadPanel } from "../components/CurrentLeadPanel";
import { SidebarActionsPreview } from "../components/SidebarActionsPreview";
import { SidebarActionsModal } from "../components/SidebarActionsModal";
import { SaveSlotsModal } from "../components/SaveSlotsModal";
import { TimeSkipPanel } from "../components/TimeSkipPanel";
import { TimeSkipModal } from "../components/TimeSkipModal";

// caseSummary.premise is authored with a blank line between sentences for
// CaseSummaryPanel's spacing; SceneNotice's small scrollable card wants the
// same text tighter, one line break instead of a blank line between them.
function toSceneNoticeSpacing(text: string): string {
  return text.replace(/\n{2,}/g, "\n");
}

// This owns GameState for whichever case the URL names. It never inspects
// the story rules directly - every state change comes back from a
// gameService call, and every piece of UI below only renders the view
// objects that come with it.
export function CaseDashboardPage() {
  const { caseId } = useParams<{ caseId: string }>();
  const navigate = useNavigate();

  const [state, setState] = useState<GameState | null>(null);
  const [messages, setMessages] = useState<string[]>([]);
  const [sceneNotice, setSceneNotice] = useState<{ image?: string; messages: string[] } | null>(null);
  const [isMapOpen, setIsMapOpen] = useState(false);
  // Set while viewing a location's inner subMap; undefined means the outer map.
  const [mapHubId, setMapHubId] = useState<string | undefined>(undefined);
  // Which of the Explore Area / People Here modals is open, if any.
  const [locationModal, setLocationModal] = useState<"explore" | "people" | null>(null);
  const [isRelationshipsOpen, setIsRelationshipsOpen] = useState(false);
  const [isInventoryOpen, setIsInventoryOpen] = useState(false);
  const [isSaveSlotsOpen, setIsSaveSlotsOpen] = useState(false);
  const [isTimeSkipOpen, setIsTimeSkipOpen] = useState(false);
  // saveSlotViews below reads fresh from localStorage on every render, but
  // saving/deleting a slot doesn't touch any other piece of state - nothing
  // would otherwise tell React to re-render and pick up the change. Bumping
  // this is a pure "please re-render" signal; its value is never read.
  const [, refreshSaveSlots] = useState(0);
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
    if (loaded) {
      setState(loaded);
    } else {
      // Genuinely fresh case (no save yet) - starting is itself a game
      // state change, so it gets the same full-screen scene treatment as
      // travel/explore, using the case's premise as placeholder text.
      const freshState = gameService.startNewGame();
      setState(freshState);
      setSceneNotice({
        image: gameService.getLocationView(freshState).image,
        messages: [toSceneNoticeSpacing(gameService.getCaseSummaryView(freshState).premise)],
      });
    }
    setMessages([]);
    setIsMapOpen(false);
    setMapHubId(undefined);
    setLocationModal(null);
    setIsRelationshipsOpen(false);
    setIsInventoryOpen(false);
    setIsSaveSlotsOpen(false);
    setIsTimeSkipOpen(false);
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

  // Shared by travel/explore (and, eventually, drawing a card): shows a
  // full-screen SceneNotice when the action genuinely changed GameState -
  // every engine success path spreads a fresh state object, every
  // no-op/rejection path returns the same previousState reference back
  // untouched, so this reference comparison is a reliable, zero-cost
  // "did anything actually happen?" signal with no engine bookkeeping
  // needed. A no-op/rejection falls back to the existing toast, unchanged.
  // Dialogue intentionally stays on `applyResult` above - it already gets
  // full-screen treatment via DialogueModal.
  function applySceneAction(previousState: GameState, result: { state: GameState; messages: string[] }) {
    setState(result.state);
    if (result.state !== previousState) {
      setMessages([]);
      if (result.messages.length > 0) {
        setSceneNotice({ image: gameService.getLocationView(result.state).image, messages: result.messages });
      }
    } else {
      setSceneNotice(null);
      if (result.messages.length > 0) setMessages(result.messages);
    }
  }

  function handleExplore(actionId: string) {
    applySceneAction(state!, gameService.performExploreAction(state!, actionId));
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

  function handleUseItem(_itemId: string) {
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
    const previousState = state!;
    const result = gameService.travelTo(previousState, locationId);
    setState(result.state);
    if (result.state !== previousState) {
      // Travel succeeded - close the modal and show the arrival scene.
      setMessages([]);
      setSceneNotice({ image: gameService.getLocationView(result.state).image, messages: result.messages });
      handleCloseMap();
      return;
    }
    // Travel was rejected (e.g. a locked location) - stay open and show why.
    setSceneNotice(null);
    setMessages(result.messages);
  }

  function handleNewGame() {
    setMessages([]);
    setIsMapOpen(false);
    setMapHubId(undefined);
    setLocationModal(null);
    setIsRelationshipsOpen(false);
    setIsInventoryOpen(false);
    setIsSaveSlotsOpen(false);
    setIsTimeSkipOpen(false);
    const freshState = gameService.startNewGame();
    setState(freshState);
    setSceneNotice({
      image: gameService.getLocationView(freshState).image,
      messages: [toSceneNoticeSpacing(gameService.getCaseSummaryView(freshState).premise)],
    });
  }

  function handleSaveToSlot(slotIndex: number) {
    gameService.saveToSlot(state!, slotIndex);
    refreshSaveSlots((n) => n + 1);
  }

  function handleLoadFromSlot(slotIndex: number) {
    const loaded = gameService.loadFromSlot(slotIndex);
    if (!loaded) return;
    setMessages([]);
    setIsMapOpen(false);
    setMapHubId(undefined);
    setLocationModal(null);
    setIsRelationshipsOpen(false);
    setIsInventoryOpen(false);
    setIsSaveSlotsOpen(false);
    setState(loaded);
    setSceneNotice({
      image: gameService.getLocationView(loaded).image,
      messages: [`Loaded slot ${slotIndex + 1}.`],
    });
  }

  function handleRemoveSlot(slotIndex: number) {
    gameService.clearSlot(slotIndex);
    refreshSaveSlots((n) => n + 1);
  }

  function handleSkipTime(minutes: number) {
    const previousState = state!;
    const result = gameService.skipTime(previousState, minutes);
    setState(result.state);
    setMessages([]);
    setSceneNotice({ image: gameService.getLocationView(result.state).image, messages: result.messages });
    setIsTimeSkipOpen(false);
  }

  const locationView = gameService.getLocationView(state);
  const dialogueView = gameService.getDialogueView(state);
  const itemViews = gameService.getItemViews(state);
  const relationshipViews = gameService.getRelationshipViews(state);
  const dashboardInfo = gameService.getDashboardInfo(state);
  const mapData = gameService.getMapData();
  const cardDeckView = gameService.getCardDeckView(state);
  const caseSummaryView = gameService.getCaseSummaryView(state);
  const themeStyle = gameService.getCaseThemeStyle();
  const travelMapView = isMapOpen
    ? (mapHubId ? gameService.getSubMapView(state, mapHubId) : gameService.getTravelMapView(state))
    : null;
  const saveSlotViews = isSaveSlotsOpen ? gameService.listSlots() : [];

  return (
    <div
      className="app"
      style={themeStyle}
      onClickCapture={(e) => {
        cursorPosRef.current = { x: e.clientX, y: e.clientY };
      }}
    >
      <DashboardHeader
        info={dashboardInfo}
        onRestartGame={handleNewGame}
        onQuitToTitle={handleBackToTitle}
        onManageSaves={() => setIsSaveSlotsOpen(true)}
      />

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
            inventoryCount={itemViews.length}
            onOpenRelationships={() => setIsRelationshipsOpen(true)}
            onOpenInventory={() => setIsInventoryOpen(true)}
          />
        </div>

        <div className="app-grid__center">
          <RoomPanel location={locationView} />
          <CurrentLeadPanel currentLead={caseSummaryView.currentLead} />
        </div>

        <div className="app-grid__right">
          <MapPreview mapImage={mapData.mapImage} locationName={dashboardInfo.locationName} onOpenMap={handleOpenMap} />
          <LocationActionsPreview
            exploreCount={locationView.exploreActions.filter((action) => !action.disabled).length}
            peopleCount={locationView.peopleHere.length}
            onOpenExplore={() => setLocationModal("explore")}
            onOpenPeople={() => setLocationModal("people")}
          />
          <SpecialActionPanel onUse={handleSpecialAction} />
          <TimeSkipPanel onOpenTimeSkip={() => setIsTimeSkipOpen(true)} />
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

      {locationModal === "explore" && (
        <ActionModal location={locationView} onExplore={handleExplore} onClose={() => setLocationModal(null)} />
      )}

      {locationModal === "people" && (
        <LocationActionsModal location={locationView} onTalk={handleTalk} onClose={() => setLocationModal(null)} />
      )}

      {isRelationshipsOpen && (
        <SidebarActionsModal
          relationships={relationshipViews}
          onClose={() => setIsRelationshipsOpen(false)}
        />
      )}

      {isInventoryOpen && (
        <InventoryModal items={itemViews} onUseItem={handleUseItem} onClose={() => setIsInventoryOpen(false)} />
      )}

      {isSaveSlotsOpen && (
        <SaveSlotsModal
          slots={saveSlotViews}
          onSaveToSlot={handleSaveToSlot}
          onLoadFromSlot={handleLoadFromSlot}
          onRemoveSlot={handleRemoveSlot}
          onClose={() => setIsSaveSlotsOpen(false)}
        />
      )}

      {isTimeSkipOpen && (
        <TimeSkipModal
          currentDay={dashboardInfo.day}
          currentDate={dashboardInfo.date}
          currentTime={dashboardInfo.time}
          onPreview={(minutes) => gameService.previewTimeSkip(state, minutes)}
          onSkipTime={handleSkipTime}
          onClose={() => setIsTimeSkipOpen(false)}
        />
      )}

      <DialogueModal dialogue={dialogueView} locationImage={locationView.image} onChoose={handleChooseDialogue} />

      {sceneNotice && (
        <SceneNotice
          image={sceneNotice.image}
          messages={sceneNotice.messages}
          onDismiss={() => setSceneNotice(null)}
        />
      )}
    </div>
  );
}
