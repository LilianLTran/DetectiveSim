// ---------------------------------------------------------------------------
// The game engine: all story rules live here (condition checks, effect
// application, dialogue traversal). Nothing in this file is React-aware.
// gameService.ts is the only caller of this module today; later, a backend
// could re-implement this same file's public functions server-side without
// touching React or case.json's shape.
// ---------------------------------------------------------------------------

import type {
  CaseData,
  GameState,
  LocationData,
  CharacterData,
  ExploreActionData,
  DialogueNode,
  Condition,
  Effect,
  LocationView,
  ExploreActionView,
  CharacterView,
  DialogueView,
  DialogueChoiceView,
  GameActionResult,
  RelationshipState,
  RelationshipView,
  CardDeckView,
  CaseSummaryView,
  MapHotspotView,
  TravelMapView,
  LocationPath,
} from "./types";

// ---- Lookups ----------------------------------------------------------------

function getLocation(caseData: CaseData, locationId: string): LocationData {
  const location = caseData.locations.find((l) => l.id === locationId);
  if (!location) throw new Error(`Unknown location: ${locationId}`);
  return location;
}

function getCharacter(caseData: CaseData, characterId: string): CharacterData {
  const character = caseData.characters.find((c) => c.id === characterId);
  if (!character) throw new Error(`Unknown character: ${characterId}`);
  return character;
}

function getExploreAction(caseData: CaseData, actionId: string): ExploreActionData {
  const action = caseData.exploreActions.find((a) => a.id === actionId);
  if (!action) throw new Error(`Unknown explore action: ${actionId}`);
  return action;
}

function getDialogueNode(caseData: CaseData, nodeId: string): DialogueNode {
  const node = caseData.dialogueNodes.find((n) => n.id === nodeId);
  if (!node) throw new Error(`Unknown dialogue node: ${nodeId}`);
  return node;
}

function getRelationship(state: GameState, characterId: string): RelationshipState {
  return state.relationships[characterId] ?? {};
}

function getRelationshipMetricValue(state: GameState, characterId: string, metric: string): number {
  return getRelationship(state, characterId)[metric] ?? 0;
}

// Used for a relationshipMetrics entry that doesn't specify its own `color`,
// assigned by position so the common case (trust first) keeps its familiar
// green without every case having to author every color by hand.
const DEFAULT_METRIC_COLORS = ["#4caf6e", "#c0463f", "#4a90d9", "#c9a24b", "#9b59b6", "#e67e22"];

/** Undirected lookup - a "from"/"to" pair in case.json matches travel in
 * either direction, so authors only need one entry per pair of locations. */
function findWalkPath(caseData: CaseData, fromId: string, toId: string): LocationPath | undefined {
  return (caseData.paths ?? []).find(
    (p) => (p.from === fromId && p.to === toId) || (p.to === fromId && p.from === toId)
  );
}

// ---- Initial state ----------------------------------------------------------

export function createInitialGameState(caseData: CaseData): GameState {
  const characterLocations: Record<string, string> = {};
  const relationships: Record<string, RelationshipState> = {};

  for (const character of caseData.characters) {
    characterLocations[character.id] = character.startingLocationId;
    relationships[character.id] = { ...character.startingRelationship };
  }

  return {
    caseId: caseData.meta.id,
    currentLocationId: caseData.settings.startingLocationId,
    characterLocations,
    discoveredItemIds: [],
    completedExploreActionIds: [],
    drawnCardIds: [],
    metCharacterIds: [],
    visitedLocationIds: [caseData.settings.startingLocationId],
    activeDialogueId: null,
    activeDialogueCharacterId: null,
    relationships,
    flags: {},
    notebook: [],
    day: caseData.settings.startingDay,
    date: caseData.settings.startingDate,
    time: caseData.settings.startingTime,
  };
}

// ---- Conditions ---------------------------------------------------------------

export function checkCondition(caseData: CaseData, state: GameState, condition: Condition): boolean {
  switch (condition.type) {
    case "always":
      return true;
    case "hasItem":
      return state.discoveredItemIds.includes(condition.itemId);
    case "hasFlag":
      return (state.flags[condition.flag] ?? false) === (condition.value ?? true);
    case "relationshipAtLeast":
      return getRelationshipMetricValue(state, condition.characterId, condition.metric) >= condition.value;
    case "currentLocation":
      return state.currentLocationId === condition.locationId;
    case "actionCompleted":
      return state.completedExploreActionIds.includes(condition.actionId);
    case "hasMetCharacter":
      return state.metCharacterIds.includes(condition.characterId);
    case "hasVisitedLocation":
      return state.visitedLocationIds.includes(condition.locationId);
    case "not":
      return !checkCondition(caseData, state, condition.condition);
    case "all":
      return condition.conditions.every((c) => checkCondition(caseData, state, c));
    case "any":
      return condition.conditions.some((c) => checkCondition(caseData, state, c));
  }
}

export function checkConditions(caseData: CaseData, state: GameState, conditions?: Condition[]): boolean {
  if (!conditions || conditions.length === 0) return true;
  return conditions.every((c) => checkCondition(caseData, state, c));
}

// ---- Effects ------------------------------------------------------------------

/** Applies a single effect, returning the new state plus any message it produced. */
export function applyEffect(caseData: CaseData, state: GameState, effect: Effect): GameActionResult {
  switch (effect.type) {
    case "addItem": {
      if (state.discoveredItemIds.includes(effect.itemId)) {
        return { state, messages: [] };
      }
      return {
        state: {
          ...state,
          discoveredItemIds: [...state.discoveredItemIds, effect.itemId],
        },
        messages: [],
      };
    }
    case "setFlag": {
      if (state.flags[effect.flag] === effect.value) return { state, messages: [] };
      return {
        state: { ...state, flags: { ...state.flags, [effect.flag]: effect.value } },
        messages: [],
      };
    }
    case "changeRelationship": {
      const current = getRelationship(state, effect.characterId);
      const next = clamp((current[effect.metric] ?? 0) + effect.amount, 0, 100);
      return {
        state: {
          ...state,
          relationships: {
            ...state.relationships,
            [effect.characterId]: { ...current, [effect.metric]: next },
          },
        },
        messages: [],
      };
    }
    case "travelTo": {
      getLocation(caseData, effect.locationId); // validates the id exists
      return { state: { ...state, currentLocationId: effect.locationId }, messages: [] };
    }
    case "setCharacterLocation": {
      return {
        state: {
          ...state,
          characterLocations: {
            ...state.characterLocations,
            [effect.characterId]: effect.locationId,
          },
        },
        messages: [],
      };
    }
    case "completeExploreAction": {
      if (state.completedExploreActionIds.includes(effect.actionId)) return { state, messages: [] };
      return {
        state: {
          ...state,
          completedExploreActionIds: [...state.completedExploreActionIds, effect.actionId],
        },
        messages: [],
      };
    }
    case "addNotebookEntry": {
      if (state.notebook.some((entry) => entry.id === effect.entryId)) return { state, messages: [] };
      return {
        state: {
          ...state,
          notebook: [
            ...state.notebook,
            { id: effect.entryId, text: effect.text, category: effect.category, addedAtDay: state.day },
          ],
        },
        messages: [],
      };
    }
    case "advanceTime": {
      return { state: advanceGameClock(state, effect.minutes), messages: [] };
    }
    case "showMessage": {
      return { state, messages: [effect.text] };
    }
  }
}

export function applyEffects(caseData: CaseData, state: GameState, effects?: Effect[]): GameActionResult {
  if (!effects || effects.length === 0) return { state, messages: [] };
  let currentState = state;
  const messages: string[] = [];
  for (const effect of effects) {
    const result = applyEffect(caseData, currentState, effect);
    currentState = result.state;
    messages.push(...result.messages);
  }
  return { state: currentState, messages };
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

/** Parses a "HH:MM AM/PM" clock string into minutes-since-midnight, or null
 * if it doesn't match that format. Shared by advanceClock and the
 * time-of-day computation below so there's one parser for the one format. */
function parseClockMinutes(time: string): number | null {
  const match = /^(\d{1,2}):(\d{2})\s*(AM|PM)$/i.exec(time.trim());
  if (!match) return null;
  const [, hoursStr, minutesStr, meridiem] = match;
  let totalMinutes = (parseInt(hoursStr, 10) % 12) * 60 + parseInt(minutesStr, 10);
  if (meridiem.toUpperCase() === "PM") totalMinutes += 12 * 60;
  return totalMinutes;
}

/** Advances a "HH:MM AM/PM" clock by `minutes` (positive or negative) and
 * reports how many midnights were crossed, so callers can roll `day`/`date`
 * forward (or back) in step with the clock instead of silently wrapping. */
function advanceClock(time: string, minutes: number): { time: string; daysElapsed: number } {
  const parsed = parseClockMinutes(time);
  if (parsed === null) return { time, daysElapsed: 0 };

  const rawTotal = parsed + minutes;
  const MINUTES_PER_DAY = 24 * 60;
  const daysElapsed = Math.floor(rawTotal / MINUTES_PER_DAY);
  const wrapped = ((rawTotal % MINUTES_PER_DAY) + MINUTES_PER_DAY) % MINUTES_PER_DAY;

  const newHours24 = Math.floor(wrapped / 60);
  const newMinutes = wrapped % 60;
  const newMeridiem = newHours24 >= 12 ? "PM" : "AM";
  const displayHours = newHours24 % 12 === 0 ? 12 : newHours24 % 12;
  const formatted = `${String(displayHours).padStart(2, "0")}:${String(newMinutes).padStart(2, "0")} ${newMeridiem}`;

  return { time: formatted, daysElapsed };
}

/** Buckets minutes-since-midnight into a coarse time-of-day label. Boundaries
 * are deliberately simple (no twilight/dusk nuance) - authors who want a more
 * specific mood for a given moment can still lean on `weatherCondition`. */
function getTimeOfDayLabel(minutesSinceMidnight: number): string {
  if (minutesSinceMidnight < 5 * 60) return "Night"; // 12:00-4:59 AM
  if (minutesSinceMidnight < 7 * 60) return "Dawn"; // 5:00-6:59 AM
  if (minutesSinceMidnight < 12 * 60) return "Morning"; // 7:00-11:59 AM
  if (minutesSinceMidnight < 13 * 60) return "Noon"; // 12:00-12:59 PM
  if (minutesSinceMidnight < 17 * 60) return "Afternoon"; // 1:00-4:59 PM
  if (minutesSinceMidnight < 20 * 60) return "Evening"; // 5:00-7:59 PM
  return "Night"; // 8:00-11:59 PM
}

/** The "Clear / Noon" style label shown in the dashboard header: the case's
 * authored weather condition, plus a time-of-day label derived fresh from
 * the current clock every time this is called - never stored, so it can
 * never drift out of sync with `state.time` the way a stored value would. */
export function getCurrentPeriodLabel(caseData: CaseData, state: GameState): string {
  const condition = caseData.settings.weatherCondition;
  const minutes = parseClockMinutes(state.time);
  if (minutes === null) return condition;
  return `${condition} / ${getTimeOfDayLabel(minutes)}`;
}

/** Picks which of a location's images to show right now. A single `image`
 * always wins; otherwise falls back to whichever day/night variant matches
 * the current clock (or whichever one is present, if only one is authored). */
function resolveLocationImage(location: LocationData, state: GameState): string | undefined {
  if (location.image) return location.image;
  if (!location.imageDay && !location.imageNight) return undefined;

  const minutes = parseClockMinutes(state.time);
  const isNight = minutes !== null && getTimeOfDayLabel(minutes) === "Night";
  return isNight ? (location.imageNight ?? location.imageDay) : (location.imageDay ?? location.imageNight);
}

/** Picks the arrival text shown when the player travels to `location`: the
 * first `arrivalTexts` variant whose conditions pass against `state` (same
 * ordered/first-match-wins idiom as caseSummary.leads and
 * cardDeck.cards.find in drawCard), falling back to the location's plain
 * `description` when there are no variants, or none match. */
function getLocationArrivalText(caseData: CaseData, state: GameState, location: LocationData): string {
  const variant = (location.arrivalTexts ?? []).find((v) => checkConditions(caseData, state, v.conditions));
  return variant?.text ?? location.description;
}

const MONTH_ABBREVIATIONS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** Best-effort calendar math for a "Mon D" date string (e.g. "Nov 2" -> "Nov 3",
 * rolling over month boundaries correctly). If a case's `date` doesn't follow
 * that convention, it's left untouched rather than guessed at - `day` (a
 * plain counter) is the mechanism that's always safe to rely on. */
function advanceCalendarDate(date: string, daysElapsed: number): string {
  if (daysElapsed === 0) return date;
  const match = /^([A-Za-z]{3})\s+(\d{1,2})$/.exec(date.trim());
  if (!match) return date;
  const monthIndex = MONTH_ABBREVIATIONS.findIndex((m) => m.toLowerCase() === match[1].toLowerCase());
  if (monthIndex === -1) return date;

  const dayOfMonth = parseInt(match[2], 10);
  const next = new Date(Date.UTC(2001, monthIndex, dayOfMonth)); // fixed non-leap reference year
  next.setUTCDate(next.getUTCDate() + daysElapsed);
  return `${MONTH_ABBREVIATIONS[next.getUTCMonth()]} ${next.getUTCDate()}`;
}

/** Advances time and, if it crosses midnight, rolls `day` and (best-effort) `date` too. */
function advanceGameClock(state: GameState, minutes: number): GameState {
  const { time, daysElapsed } = advanceClock(state.time, minutes);
  if (daysElapsed === 0) return { ...state, time };
  return {
    ...state,
    time,
    day: state.day + daysElapsed,
    date: advanceCalendarDate(state.date, daysElapsed),
  };
}

// ---- Views ----------------------------------------------------------------

function buildExploreActionView(caseData: CaseData, state: GameState, actionId: string): ExploreActionView {
  const action = getExploreAction(caseData, actionId);

  if (action.once && state.completedExploreActionIds.includes(action.id)) {
    return { id: action.id, label: action.label, disabled: true, disabledReason: "You've already done this." };
  }

  if (!checkConditions(caseData, state, action.conditions)) {
    return {
      id: action.id,
      label: action.label,
      disabled: true,
      disabledReason: action.disabledText ?? "This isn't available right now.",
    };
  }

  return { id: action.id, label: action.label, disabled: false };
}

function buildCharacterView(character: CharacterData): CharacterView {
  return {
    id: character.id,
    name: character.name,
    role: character.role,
    portrait: character.portrait,
  };
}

export function getLocationView(caseData: CaseData, state: GameState): LocationView {
  const location = getLocation(caseData, state.currentLocationId);

  const peopleHere = caseData.characters
    .filter((character) => state.characterLocations[character.id] === state.currentLocationId)
    .map((character) => buildCharacterView(character));

  const exploreActions = location.exploreActions.map((actionId) =>
    buildExploreActionView(caseData, state, actionId)
  );

  return {
    locationId: location.id,
    locationName: location.name,
    description: location.description,
    image: resolveLocationImage(location, state),
    exploreActions,
    peopleHere,
  };
}

export function getCardDeckView(caseData: CaseData, state: GameState): CardDeckView {
  const { cardDeck } = caseData;
  const undrawnCards = cardDeck.cards.filter((card) => !state.drawnCardIds.includes(card.id));
  const remaining = undrawnCards.length;

  if (remaining === 0) {
    return { description: cardDeck.description, remaining, canDraw: false, disabledReason: "No cards left to draw." };
  }

  const hasEligibleCard = undrawnCards.some((card) => checkConditions(caseData, state, card.conditions));
  if (!hasEligibleCard) {
    return {
      description: cardDeck.description,
      remaining,
      canDraw: false,
      disabledReason: "Nothing to draw right now.",
    };
  }

  return { description: cardDeck.description, remaining, canDraw: true };
}

export function getCaseSummaryView(caseData: CaseData, state: GameState): CaseSummaryView {
  const { caseSummary, characters } = caseData;

  const peopleInvolved = characters
    .filter(
      (character) => caseSummary.peopleInvolvedIds.includes(character.id) && state.metCharacterIds.includes(character.id)
    )
    .map((character) => ({ id: character.id, name: character.name, portrait: character.portrait }));

  const currentLead =
    caseSummary.leads.find((lead) => checkConditions(caseData, state, lead.conditions))?.text ?? "";

  return { premise: caseSummary.premise, peopleInvolved, currentLead };
}

/** Only includes characters the player has actually met (started a
 * conversation with) - not just anyone defined in the case. */
export function getRelationshipViews(caseData: CaseData, state: GameState): RelationshipView[] {
  return caseData.characters
    .filter((character) => state.metCharacterIds.includes(character.id))
    .map((character) => {
      const relationship = getRelationship(state, character.id);
      const metrics = caseData.relationshipMetrics.map((metricDef, index) => ({
        id: metricDef.id,
        label: metricDef.label,
        value: relationship[metricDef.id] ?? 0,
        color: metricDef.color ?? DEFAULT_METRIC_COLORS[index % DEFAULT_METRIC_COLORS.length],
      }));
      return { characterId: character.id, characterName: character.name, metrics };
    });
}

/** Map view for the travel page: each location paired with its walk time
 * from wherever the player currently is (from case.json's `paths`, looked
 * up in either direction), not a fixed property of the building itself. */
function buildHotspotView(caseData: CaseData, state: GameState, location: LocationData): MapHotspotView {
  const isCurrent = location.id === state.currentLocationId;
  const path = isCurrent ? undefined : findWalkPath(caseData, state.currentLocationId, location.id);

  return {
    id: location.id,
    name: location.name,
    mapZone: location.mapZone,
    isCurrent,
    walkMinutes: path?.walkMinutes,
    distanceMeters: path?.distanceMeters,
    hasSubMap: location.subMap != null,
  };
}

/** Location ids that only ever appear on some hub's inner map, never on the
 * map one level up - so the outer map doesn't show a room's hotspot floating
 * next to the building hotspot that already leads to it. */
function getNestedLocationIds(caseData: CaseData): Set<string> {
  const nested = new Set<string>();
  for (const location of caseData.locations) {
    for (const id of location.subMap?.locationIds ?? []) nested.add(id);
  }
  return nested;
}

export function getTravelMapView(caseData: CaseData, state: GameState): TravelMapView {
  const nestedIds = getNestedLocationIds(caseData);
  const locations = caseData.locations
    .filter((location) => !nestedIds.has(location.id))
    .map((location) => buildHotspotView(caseData, state, location));

  return { mapImage: caseData.settings.mapImage, locations };
}

/** Inner-map view for a hub location's subMap - same shape as
 * getTravelMapView, just scoped to that hub's listed locations and its own
 * map image, so TravelMap renders it identically without knowing the
 * difference. */
export function getSubMapView(caseData: CaseData, state: GameState, hubLocationId: string): TravelMapView {
  const hub = getLocation(caseData, hubLocationId);
  if (!hub.subMap) throw new Error(`Location has no subMap: ${hubLocationId}`);

  const locations = hub.subMap.locationIds
    .map((id) => getLocation(caseData, id))
    .map((location) => buildHotspotView(caseData, state, location));

  return { mapImage: hub.subMap.mapImage, locations };
}

export function getDialogueView(caseData: CaseData, state: GameState): DialogueView {
  if (!state.activeDialogueId || !state.activeDialogueCharacterId) {
    return { isActive: false };
  }

  const node = getDialogueNode(caseData, state.activeDialogueId);
  const character = getCharacter(caseData, state.activeDialogueCharacterId);

  const choices: DialogueChoiceView[] = node.choices.map((choice) => {
    if (!checkConditions(caseData, state, choice.conditions)) {
      return { id: choice.id, text: choice.text, disabled: true, disabledReason: "Not available yet." };
    }
    return { id: choice.id, text: choice.text, disabled: false };
  });

  return {
    isActive: true,
    nodeId: node.id,
    characterId: character.id,
    characterName: character.name,
    characterImage: node.characterImage ?? character.dialogueImage,
    lines: node.lines,
    choices,
  };
}

// ---- Actions ----------------------------------------------------------------

export function travelTo(caseData: CaseData, state: GameState, locationId: string): GameActionResult {
  const location = getLocation(caseData, locationId);

  if (location.unlockCondition && !checkCondition(caseData, state, location.unlockCondition)) {
    return { state, messages: [`${location.name} is not accessible yet.`] };
  }

  // No path entry defined for this pair (e.g. the case has no `paths` at
  // all) means no known time cost - travel stays instant, as before.
  const walkMinutes = findWalkPath(caseData, state.currentLocationId, locationId)?.walkMinutes;
  const clockedState = walkMinutes ? advanceGameClock(state, walkMinutes) : state;

  // Arrival text is picked against the state as it stood just BEFORE this
  // arrival is recorded, so a hasVisitedLocation condition on the
  // destination reads false on the very first arrival (you're not
  // "already visited" until this trip actually completes) and only reads
  // true starting on the second arrival onward. visitedLocationIds is
  // appended to separately below, after the text has already been chosen.
  const arrivalState: GameState = {
    ...clockedState,
    currentLocationId: locationId,
    activeDialogueId: null,
    activeDialogueCharacterId: null,
  };
  const arrivalText = getLocationArrivalText(caseData, arrivalState, location);

  const nextState: GameState = {
    ...arrivalState,
    visitedLocationIds: arrivalState.visitedLocationIds.includes(locationId)
      ? arrivalState.visitedLocationIds
      : [...arrivalState.visitedLocationIds, locationId],
  };

  return { state: nextState, messages: [arrivalText] };
}

export function performExploreAction(caseData: CaseData, state: GameState, actionId: string): GameActionResult {
  const action = getExploreAction(caseData, actionId);

  if (action.locationId !== state.currentLocationId) {
    return { state, messages: ["That isn't here."] };
  }

  if (action.once && state.completedExploreActionIds.includes(action.id)) {
    return { state, messages: ["You've already done this."] };
  }

  if (!checkConditions(caseData, state, action.conditions)) {
    return { state, messages: [action.disabledText ?? "This isn't available right now."] };
  }

  const effects: Effect[] = action.once
    ? [...action.effects, { type: "completeExploreAction", actionId: action.id }]
    : action.effects;

  const result = applyEffects(caseData, state, effects);
  return { state: result.state, messages: [action.resultText, ...result.messages] };
}

export function drawCard(caseData: CaseData, state: GameState): GameActionResult {
  const nextCard = caseData.cardDeck.cards.find(
    (card) => !state.drawnCardIds.includes(card.id) && checkConditions(caseData, state, card.conditions)
  );

  if (!nextCard) {
    return { state, messages: ["There's nothing left to draw."] };
  }

  const effects: Effect[] = nextCard.effects;
  const result = applyEffects(caseData, state, effects);
  const stateWithCardDrawn: GameState = {
    ...result.state,
    drawnCardIds: [...result.state.drawnCardIds, nextCard.id],
  };

  return { state: stateWithCardDrawn, messages: [nextCard.resultText, ...result.messages] };
}

function enterDialogueNode(caseData: CaseData, state: GameState, nodeId: string, characterId: string): GameActionResult {
  const node = getDialogueNode(caseData, nodeId);
  const effectsResult = applyEffects(caseData, state, node.effects);
  return {
    state: {
      ...effectsResult.state,
      activeDialogueId: node.id,
      activeDialogueCharacterId: characterId,
    },
    messages: effectsResult.messages,
  };
}

export function startDialogue(
  caseData: CaseData,
  state: GameState,
  characterId: string,
  topic?: string
): GameActionResult {
  const character = getCharacter(caseData, characterId);
  const nodeId = (topic && character.dialogueStarts[topic]) || character.dialogueStarts.default;

  if (!nodeId) {
    return { state, messages: [`${character.name} has nothing to say right now.`] };
  }

  const metState: GameState = state.metCharacterIds.includes(character.id)
    ? state
    : { ...state, metCharacterIds: [...state.metCharacterIds, character.id] };

  return enterDialogueNode(caseData, metState, nodeId, character.id);
}

export function chooseDialogueChoice(caseData: CaseData, state: GameState, choiceId: string): GameActionResult {
  if (!state.activeDialogueId || !state.activeDialogueCharacterId) {
    return { state, messages: ["No conversation is active."] };
  }

  const node = getDialogueNode(caseData, state.activeDialogueId);
  const choice = node.choices.find((c) => c.id === choiceId);
  if (!choice) {
    return { state, messages: ["That choice isn't available."] };
  }

  if (!checkConditions(caseData, state, choice.conditions)) {
    return { state, messages: ["That choice isn't available yet."] };
  }

  const effectsResult = applyEffects(caseData, state, choice.effects);

  if (choice.nextDialogueId === null) {
    return {
      state: { ...effectsResult.state, activeDialogueId: null, activeDialogueCharacterId: null },
      messages: effectsResult.messages,
    };
  }

  const nextResult = enterDialogueNode(
    caseData,
    effectsResult.state,
    choice.nextDialogueId,
    state.activeDialogueCharacterId
  );
  return { state: nextResult.state, messages: [...effectsResult.messages, ...nextResult.messages] };
}
