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
  | { type: "hasEvidence"; evidenceId: string }
  | { type: "hasFlag"; flag: string; value?: boolean }
  | { type: "relationshipAtLeast"; characterId: string; metric: string; value: number }
  | { type: "currentLocation"; locationId: string }
  | { type: "actionCompleted"; actionId: string }
  | { type: "not"; condition: Condition }
  | { type: "all"; conditions: Condition[] }
  | { type: "any"; conditions: Condition[] };

// ---- Effects ----------------------------------------------------------------
// Effects are the only way game state changes. They are pure data, applied by
// engine.ts via applyEffect/applyEffects.

export type Effect =
  | { type: "addEvidence"; evidenceId: string }
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
   * e.g. "Clear / Noon". The time-of-day part is never authored directly. */
  weatherCondition: string;
  startingLocationId: string;
  weather: string;
  temperatureC: number;
  mapImage: string;
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

export interface EvidenceData {
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
  evidence: EvidenceData[];
  exploreActions: ExploreActionData[];
  dialogueNodes: DialogueNode[];
  cardDeck: CardDeckData;
  caseSummary: CaseSummaryData;
  relationshipMetrics: RelationshipMetricDef[]; // which bars show in the Relationships panel, and in what order
  theme?: CaseTheme;
  paths?: LocationPath[]; // omit entirely if the case doesn't have travel-time data yet
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
  discoveredEvidenceIds: string[];
  completedExploreActionIds: string[];
  drawnCardIds: string[];
  metCharacterIds: string[]; // characters the player has started a conversation with
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

export interface DialogueChoiceView {
  id: string;
  text: string;
  disabled: boolean;
  disabledReason?: string;
}

export interface DialogueView {
  isActive: boolean;
  characterId?: string;
  characterName?: string;
  characterImage?: string;
  lines?: DialogueLine[];
  choices?: DialogueChoiceView[];
}

export interface EvidenceView {
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
