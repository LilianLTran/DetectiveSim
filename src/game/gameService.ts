// ---------------------------------------------------------------------------
// gameService is the ONLY module React components are allowed to import from
// `game/`. It wraps engine.ts + caseRegistry.ts + save.ts behind a small,
// stable method surface. Every method here takes/returns plain state and
// display-ready view objects - never Condition/Effect/solution data.
//
// Migration path: when a backend exists, the *bodies* of these methods
// change to `fetch("/api/...")` calls while the method names and return
// types stay the same, so components never need to change.
// ---------------------------------------------------------------------------

import type {
  CaseData,
  GameState,
  LocationView,
  DialogueView,
  ItemView,
  RelationshipView,
  CaseMeta,
  GameActionResult,
  CardDeckView,
  CaseSummaryView,
  CaseListing,
  CaseTheme,
  TravelMapView,
} from "./types";
import * as engine from "./engine";
import { listCaseListings, getCaseDataById } from "./caseRegistry";
import { saveGameState, loadGameState, hasSavedGame } from "./save";

export interface DashboardInfo {
  caseTitle: string;
  day: number;
  date: string;
  time: string;
  period: string;
  locationName: string;
  weather: string;
}

// ---- Case selection -----------------------------------------------------------
// Which case is "active" is gameService's own state - components never see
// CaseData directly, they just call selectCase(id) once (from the homepage)
// and every other method operates on whichever case was selected last.

let activeCaseData: CaseData | null = null;

function requireCaseData(): CaseData {
  if (!activeCaseData) {
    throw new Error("No case selected. Call gameService.selectCase(caseId) first.");
  }
  return activeCaseData;
}

export function listCases(): CaseListing[] {
  return listCaseListings();
}

export function selectCase(caseId: string): void {
  activeCaseData = getCaseDataById(caseId);
}

// ---- Lifecycle ----------------------------------------------------------------

export function startNewGame(): GameState {
  const caseData = requireCaseData();
  const state = engine.createInitialGameState(caseData);
  saveGameState(caseData.meta.id, state);
  return state;
}

export function loadGame(): GameState | null {
  const caseData = requireCaseData();
  const state = loadGameState(caseData.meta.id);
  if (!state) return null;

  // A save made before a character existed in the case has no entry for
  // them in characterLocations, which makes them match no room ever -
  // effectively unfindable. Default any such character to their starting
  // location rather than leaving old saves permanently missing new cast.
  const characterLocations = { ...state.characterLocations };
  for (const character of caseData.characters) {
    if (!(character.id in characterLocations)) {
      characterLocations[character.id] = character.startingLocationId;
    }
  }
  return { ...state, characterLocations };
}

export function saveGame(state: GameState): void {
  saveGameState(requireCaseData().meta.id, state);
}

export function hasSavedGameAvailable(): boolean {
  return hasSavedGame(requireCaseData().meta.id);
}

// Maps CaseTheme's fields to the CSS custom property names they override.
const THEME_CSS_VARS: Record<keyof CaseTheme, string> = {
  bgDark: "--bg-dark",
  bgPanel: "--bg-panel",
  bgPanelAlt: "--bg-panel-alt",
  bgHover: "--bg-hover",
  borderSubtle: "--border-subtle",
  accent: "--gold",
  accentBright: "--gold-bright",
  textPrimary: "--text-primary",
  textSecondary: "--text-secondary",
};

/** Returns a { "--css-var": "value" } map for whichever colors the active
 * case's optional `theme` overrides, plus the case's cover image (if any) as
 * a --bg-image the root element's background layers over --bg-dark - empty
 * for a case that sets neither. Meant to be spread directly into a root
 * element's inline `style`. */
export function getCaseThemeStyle(): Record<string, string> {
  const caseData = requireCaseData();
  const style: Record<string, string> = {};

  const theme = caseData.theme;
  if (theme) {
    for (const key of Object.keys(theme) as (keyof CaseTheme)[]) {
      const value = theme[key];
      if (value) style[THEME_CSS_VARS[key]] = value;
    }
  }

  if (caseData.meta.coverImage) {
    style["--bg-image"] = `url(${caseData.meta.coverImage})`;
  }

  return style;
}

export function getCaseMeta(): CaseMeta {
  return requireCaseData().meta;
}

// ---- Location / explore ----------------------------------------------------

export function getLocationView(state: GameState): LocationView {
  return engine.getLocationView(requireCaseData(), state);
}

export function travelTo(state: GameState, locationId: string): GameActionResult {
  const caseData = requireCaseData();
  const result = engine.travelTo(caseData, state, locationId);
  saveGameState(caseData.meta.id, result.state);
  return result;
}

export function performExploreAction(state: GameState, actionId: string): GameActionResult {
  const caseData = requireCaseData();
  const result = engine.performExploreAction(caseData, state, actionId);
  saveGameState(caseData.meta.id, result.state);
  return result;
}

// ---- Dialogue ---------------------------------------------------------------

export function startDialogue(state: GameState, characterId: string, topic?: string): GameActionResult {
  const caseData = requireCaseData();
  const result = engine.startDialogue(caseData, state, characterId, topic);
  saveGameState(caseData.meta.id, result.state);
  return result;
}

export function chooseDialogueChoice(state: GameState, choiceId: string): GameActionResult {
  const caseData = requireCaseData();
  const result = engine.chooseDialogueChoice(caseData, state, choiceId);
  saveGameState(caseData.meta.id, result.state);
  return result;
}

export function getDialogueView(state: GameState): DialogueView {
  return engine.getDialogueView(requireCaseData(), state);
}

// ---- Items / relationships / notebook (read-only views) -----------------

export function getItemViews(state: GameState): ItemView[] {
  return requireCaseData()
    .items.filter((item) => state.discoveredItemIds.includes(item.id))
    .map((item) => ({
      id: item.id,
      name: item.name,
      description: item.description,
      image: item.image,
    }));
}

export function getRelationshipViews(state: GameState): RelationshipView[] {
  return engine.getRelationshipViews(requireCaseData(), state);
}

export function getDashboardInfo(state: GameState): DashboardInfo {
  const caseData = requireCaseData();
  const location = caseData.locations.find((l) => l.id === state.currentLocationId);
  return {
    caseTitle: caseData.meta.title,
    day: state.day,
    date: state.date,
    time: state.time,
    period: engine.getCurrentPeriodLabel(caseData, state),
    locationName: location?.name ?? state.currentLocationId,
    weather: caseData.settings.weather,
  };
}

export function getMapData() {
  const caseData = requireCaseData();
  return {
    mapImage: caseData.settings.mapImage,
    locations: caseData.locations.map((location) => ({
      id: location.id,
      name: location.name,
      mapZone: location.mapZone,
    })),
  };
}

export function getTravelMapView(state: GameState): TravelMapView {
  return engine.getTravelMapView(requireCaseData(), state);
}

export function getSubMapView(state: GameState, hubLocationId: string): TravelMapView {
  return engine.getSubMapView(requireCaseData(), state, hubLocationId);
}

export function getCaseSummaryView(state: GameState): CaseSummaryView {
  return engine.getCaseSummaryView(requireCaseData(), state);
}

// ---- Draw card ----------------------------------------------------------------

export function getCardDeckView(state: GameState): CardDeckView {
  return engine.getCardDeckView(requireCaseData(), state);
}

export function drawCard(state: GameState): GameActionResult {
  const caseData = requireCaseData();
  const result = engine.drawCard(caseData, state);
  saveGameState(caseData.meta.id, result.state);
  return result;
}
