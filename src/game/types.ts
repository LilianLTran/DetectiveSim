// ---------------------------------------------------------------------------
// Core data-driven types for the detective/social-sim engine.
//
// Everything the story needs (rooms, people, clues, dialogue, the solution)
// lives in case.json and is typed here. React components only ever see the
// "*View" and "GameActionResult" shapes at the bottom of this file — they
// never see Condition/Effect/solution data directly.
// ---------------------------------------------------------------------------

// ---- Conditions -----------------------------------------------------------
// Conditions gate whether an explore action / dialogue choice / dialogue node
// is currently available. They are pure data, evaluated by engine.ts.

export type Condition =
  | { type: "always" }
  | { type: "hasItem"; itemId: string }
  | { type: "hasFlag"; flag: string; value?: boolean }
  | { type: "relationshipAtLeast"; characterId: string; metric: string; value: number }
  | { type: "currentLocation"; locationId: string }
  | { type: "actionCompleted"; actionId: string }
  | { type: "hasMetCharacter"; characterId: string }
  | { type: "hasVisitedLocation"; locationId: string }
  | { type: "not"; condition: Condition }
  | { type: "all"; conditions: Condition[] }
  | { type: "any"; conditions: Condition[] };

// ---- Effects ----------------------------------------------------------------
// Effects are the only way game state changes. They are pure data, applied by
// engine.ts via applyEffect/applyEffects.

export type Effect =
  | { type: "addItem"; itemId: string }
  | { type: "setFlag"; flag: string; value: boolean }
  | { type: "changeRelationship"; characterId: string; metric: string; amount: number }
  | { type: "travelTo"; locationId: string }
  | { type: "setCharacterLocation"; characterId: string; locationId: string }
  | { type: "completeExploreAction"; actionId: string }
  | { type: "addNotebookEntry"; entryId: string; text: string; category?: string }
  | { type: "advanceTime"; minutes: number }
  | { type: "showMessage"; text: string };

// ---- Case content (static story data loaded from case.json) ---------------

export interface CaseMeta {
  id: string;
  title: string;
  author?: string;
  version?: string;
  tagline?: string;
  coverImage?: string;
}

export interface CaseSettings {
  startingDay: number;
  startingDate: string;
  startingTime: string;
  /** Weather condition adjective (e.g. "Clear", "Rainy") - paired with an
   * auto-computed time-of-day label (from the current time) for display,
   * e.g. "Clear / Noon". The time-of-day part is never authored directly.
   * Used as the fallback when `weatherSchedule` is absent, or has no entry
   * covering the current moment. */
  weatherCondition: string;
  startingLocationId: string;
  weather: string;
  temperatureC: number;
  mapImage: string;
  /** Optional day/time-ranged forecast, checked in order - first period
   * whose [from, to) range contains the current (day, time) wins (same
   * first-match-wins idiom as arrivalTexts/caseSummary.leads/cardDeck.cards).
   * Falls back to weatherCondition/weather above when omitted, or when no
   * period matches the current moment. */
  weatherSchedule?: WeatherPeriod[];
}

/** One authored window of the weather forecast. `to*` is exclusive, so
 * back-to-back periods (e.g. one ending 10:00 PM, the next starting 10:00
 * PM) don't overlap or leave a gap. */
export interface WeatherPeriod {
  fromDay: number;
  fromTime: string;
  toDay: number;
  toTime: string;
  condition: string;
  /** Sublabel shown under the condition (e.g. "Steady rain, 17°C") - omit to
   * reuse the case's default `weather` sublabel for this period. */
  weatherLabel?: string;
}

export interface MapZone {
  x: number; // percentage, 0-100 - rectangle hotspot position, and/or a fallback bounding box
  y: number; // percentage, 0-100
  width: number; // percentage, 0-100
  height: number; // percentage, 0-100
  /** Optional polygon hotspot for non-rectangular rooms, as [x, y] percentage
   * pairs (0-100) in the same coordinate space as x/y/width/height above.
   * When present, the location renders as a polygon hotspot instead of a
   * rectangle one. */
  points?: [number, number][];
}

export interface LocationData {
  id: string;
  name: string;
  description: string;
  /** Text shown in the full-screen scene notice when the player travels
   * here (see engine.getLocationArrivalText). Checked in order, first
   * matching variant wins. If omitted, or no variant's conditions pass,
   * falls back to `description` - so every location has usable arrival
   * text with zero extra authoring required. */
  arrivalTexts?: LocationArrivalTextData[];
  mapZone: MapZone;
  exploreActions: string[]; // ExploreActionData ids available in this location
  /** Single static image for this location. If set, takes precedence over
   * `imageDay`/`imageNight` below - use this when the location only has one
   * piece of art. */
  image?: string;
  /** Time-of-day variants, used when the location has separate day/night art
   * instead of a single `image`. Either may be omitted; the engine falls
   * back to whichever one is present. */
  imageDay?: string;
  imageNight?: string;
  /** Optional gating condition for whether this location can be traveled to at all. */
  unlockCondition?: Condition;
  /** Optional inner map. When present, this location is a hub: clicking its
   * hotspot on the outer map opens this inner map instead of traveling here
   * directly - only the locations listed here are actually enterable. A
   * listed location can itself have its own `subMap` for further nesting. */
  subMap?: {
    mapImage: string;
    locationIds: string[];
  };
}

/** Travel time/distance between two locations, looked up relative to
 * wherever the player currently is - not a fixed property of either
 * location on its own. Treated as undirected: a "from"/"to" pair matches
 * a hover in either direction, so you only need one entry per pair. */
export interface LocationPath {
  from: string; // locationId
  to: string; // locationId
  distanceMeters: number;
  walkMinutes: number;
}

export interface CharacterData {
  id: string;
  name: string;
  role: string;
  description: string;
  portrait?: string;
  /** Larger transparent-background art shown over the location backdrop
   * while this character is speaking in the dialogue panel - distinct from
   * `portrait`, which is the small icon used for the "People Here" button. */
  dialogueImage?: string;
  startingLocationId: string;
  /** Starting value per relationship metric id (matching the case's
   * relationshipMetrics), e.g. { "trust": 20, "suspicion": 30 } or
   * { "trust": 20, "affection": 30 } - whatever metrics the case defines. */
  startingRelationship: Record<string, number>;
  rivals?: string[];
  dialogueStarts: Record<string, string>; // topic -> dialogueNode id, "default" is required
}

/** Defines one relationship metric a case tracks per character (e.g. trust,
 * suspicion, affection, respect - any set, any names). `color` is an
 * optional hex value for the meter fill; omitted metrics fall back to a
 * default palette assigned by position. */
export interface RelationshipMetricDef {
  id: string;
  label: string;
  color?: string;
}

export interface ItemData {
  id: string;
  name: string;
  description: string;
  image?: string;
}

export interface ExploreActionData {
  id: string;
  locationId: string;
  label: string;
  resultText: string;
  conditions?: Condition[];
  effects: Effect[];
  once?: boolean;
  disabledText?: string;
}

export interface DialogueLine {
  speakerId: string; // characterId, or "player"
  text: string;
}

export interface DialogueChoice {
  id: string;
  text: string;
  conditions?: Condition[];
  effects?: Effect[];
  nextDialogueId: string | null;
}

export interface DialogueNode {
  id: string;
  characterId: string;
  lines: DialogueLine[];
  choices: DialogueChoice[];
  effects?: Effect[]; // applied once when this node is first entered
  /** Overrides the character's default dialogueImage for just this node -
   * lets a conversation swap in a different expression (e.g. neutral ->
   * happy/confused) as it branches on the player's choices. */
  characterImage?: string;
}

export interface CardData {
  id: string;
  label: string;
  resultText: string;
  conditions?: Condition[];
  effects: Effect[];
}

export interface CardDeckData {
  description: string;
  cards: CardData[];
}

export interface LeadData {
  id: string;
  text: string;
  conditions?: Condition[];
}

/** One conditional variant of a location's arrival text - checked in order,
 * first one whose conditions pass wins (same idiom as CaseSummaryData.leads
 * and CardDeckData.cards). A variant with no `conditions` is always
 * eligible, so listing one last works as an explicit catch-all default. */
export interface LocationArrivalTextData {
  text: string;
  conditions?: Condition[];
}

export interface CaseSummaryData {
  premise: string;
  peopleInvolvedIds: string[];
  leads: LeadData[]; // checked in order; first one whose conditions pass wins
}

/** Optional per-case color overrides. Every field maps to one of the CSS
 * custom properties in app.css's `:root` - a case that omits `theme`
 * entirely (or omits individual fields) just keeps the app's default dark
 * noir colors for whatever it doesn't override. */
export interface CaseTheme {
  bgDark?: string;
  bgPanel?: string;
  bgPanelAlt?: string;
  bgHover?: string;
  borderSubtle?: string;
  accent?: string;
  accentBright?: string;
  textPrimary?: string;
  textSecondary?: string;
}

export interface CaseData {
  meta: CaseMeta;
  settings: CaseSettings;
  locations: LocationData[];
  characters: CharacterData[];
  items: ItemData[];
  exploreActions: ExploreActionData[];
  dialogueNodes: DialogueNode[];
  cardDeck: CardDeckData;
  caseSummary: CaseSummaryData;
  relationshipMetrics: RelationshipMetricDef[]; // which bars show in the Relationships panel, and in what order
  theme?: CaseTheme;
  paths?: LocationPath[]; // omit entirely if the case doesn't have travel-time data yet
  timeInterruptions?: TimeInterruption[]; // omit entirely if the case has no scheduled interruption events
}

/** A specific point in the case's calendar that, if a time-skip's range
 * crosses it, interrupts the skip right there instead of jumping straight
 * to the requested time - e.g. someone finds the player before the day they
 * asked to skip to. Checked chronologically (earliest trigger wins), not by
 * authoring order - unlike arrivalTexts/leads/cardDeck.cards, list position
 * has no relationship to when these actually happen. */
export interface TimeInterruption {
  id: string;
  triggerDay: number;
  triggerTime: string; // "HH:MM AM/PM", same format as GameState.time
  conditions?: Condition[];
  resultText: string; // shown via SceneNotice when this fires
  effects: Effect[]; // can be empty - same style as ExploreActionData/CardData
}

// ---- Game state (the only thing that mutates during play) -----------------

/** Metric id -> current value, e.g. { trust: 35, suspicion: 20 }. Shape
 * matches whatever the case's relationshipMetrics declare. */
export type RelationshipState = Record<string, number>;

export interface NotebookEntry {
  id: string;
  text: string;
  category?: string;
  addedAtDay: number;
}

export interface GameState {
  caseId: string;
  currentLocationId: string;
  characterLocations: Record<string, string>; // characterId -> locationId
  discoveredItemIds: string[];
  completedExploreActionIds: string[];
  drawnCardIds: string[];
  /** Ids of TimeInterruption events that have already fired via skipTime -
   * once-only, same shape as completedExploreActionIds/drawnCardIds. */
  triggeredInterruptionIds: string[];
  metCharacterIds: string[]; // characters the player has started a conversation with
  /** Locations the player has traveled to at least once, including the
   * starting location - which counts as visited from turn one, since the
   * player is already standing there before making any choice. Lets a
   * hasVisitedLocation condition (or `{ type: "not", condition: {
   * type: "hasVisitedLocation", ... } }` for "never been here") gate
   * content on prior visits. Mirrors metCharacterIds above. */
  visitedLocationIds: string[];
  activeDialogueId: string | null;
  activeDialogueCharacterId: string | null;
  relationships: Record<string, RelationshipState>; // characterId -> state
  flags: Record<string, boolean>;
  notebook: NotebookEntry[];
  day: number;
  date: string;
  time: string;
  // No `period` field - the displayed "Clear / Noon" style label is always
  // derived from `time` + the case's weatherCondition (engine.getCurrentPeriodLabel),
  // never stored, so it can never drift out of sync with the actual clock.
}

// ---- Display-ready views returned by the engine/gameService ---------------
// React components should render these and nothing else.

export interface ExploreActionView {
  id: string;
  label: string;
  disabled: boolean;
  disabledReason?: string;
}

export interface CharacterView {
  id: string;
  name: string;
  role: string;
  portrait?: string;
}

export interface LocationView {
  locationId: string;
  locationName: string;
  description: string;
  image?: string;
  exploreActions: ExploreActionView[];
  peopleHere: CharacterView[];
}

/** One cell of the 10-slot save/load grid. Occupied slots carry just enough
 * to render a thumbnail card - never the full GameState. */
export interface SaveSlotView {
  slotIndex: number;
  isEmpty: boolean;
  image?: string;
  locationName?: string;
  day?: number;
  date?: string;
  time?: string;
}

export interface DialogueChoiceView {
  id: string;
  text: string;
  disabled: boolean;
  disabledReason?: string;
}

export interface DialogueView {
  isActive: boolean;
  /** Stable id of the active DialogueNode - lets the UI tell "a new node
   * just loaded" apart from "the same node re-rendered", so transient
   * staging/pagination state can be reset at the right time. */
  nodeId?: string;
  characterId?: string;
  characterName?: string;
  characterImage?: string;
  lines?: DialogueLine[];
  choices?: DialogueChoiceView[];
}

export interface ItemView {
  id: string;
  name: string;
  description: string;
  image?: string;
}

export interface RelationshipMetricView {
  id: string;
  label: string;
  value: number;
  color: string;
}

export interface RelationshipView {
  characterId: string;
  characterName: string;
  metrics: RelationshipMetricView[];
}

export interface MapHotspotView {
  id: string;
  name: string;
  mapZone: MapZone;
  isCurrent: boolean;
  /** Undefined when the case has no `paths` entry for this pair - the UI
   * should fall back to showing just the name, not fabricate a time. */
  walkMinutes?: number;
  distanceMeters?: number;
  /** True if clicking this hotspot should open its inner map (via
   * onOpenSubMap) instead of traveling here directly (via onSelectLocation). */
  hasSubMap: boolean;
}

export interface TravelMapView {
  mapImage: string;
  locations: MapHotspotView[];
}

export interface CardDeckView {
  description: string;
  remaining: number;
  canDraw: boolean;
  disabledReason?: string;
}

export interface CaseSummaryView {
  premise: string;
  peopleInvolved: { id: string; name: string; portrait?: string }[];
  currentLead: string;
}

/** Generic wrapper returned by every mutating engine call so the UI can show
 * feedback (result text, unlocked messages) without knowing why they happened. */
export interface GameActionResult {
  state: GameState;
  messages: string[];
}

/** One entry in the homepage's list of available cases. Not to be confused
 * with CaseSummaryView, which is the in-game "Case Summary" panel for a
 * single already-selected case. */
export interface CaseListing {
  id: string;
  title: string;
  tagline?: string;
  coverImage?: string;
  /** The case's premise (caseSummary.premise) - shown as a hover tooltip on
   * the homepage card, separate from the short on-card tagline. */
  premise?: string;
}
