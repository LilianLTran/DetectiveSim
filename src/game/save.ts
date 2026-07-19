// ---------------------------------------------------------------------------
// localStorage persistence. This is the only place that knows about
// localStorage; swapping to a backend later means replacing this file (and
// the calls into it from gameService.ts) with an API client.
//
// Saves are namespaced by caseId so progress in different cases doesn't
// collide or overwrite each other.
// ---------------------------------------------------------------------------

import type { GameState } from "./types";

function saveKey(caseId: string): string {
  return `detective-sim:save:${caseId}`;
}

export function saveGameState(caseId: string, state: GameState): void {
  window.localStorage.setItem(saveKey(caseId), JSON.stringify(state));
}

export function loadGameState(caseId: string): GameState | null {
  const raw = window.localStorage.getItem(saveKey(caseId));
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as GameState & { discoveredEvidenceIds?: string[] };
    // Saves from before a GameState field existed won't have it - default it
    // rather than let every reader downstream crash on a missing array.
    // visitedLocationIds defaults to [currentLocationId], not [] - an old
    // save's player is standing somewhere they clearly already reached, so
    // treating that location as "not yet visited" would be wrong from the
    // very first read after loading.
    // discoveredItemIds falls back to the old pre-rename field name
    // (discoveredEvidenceIds) before defaulting to [] - a save from before
    // the Evidence -> Item rename still has data under that key, and
    // dropping straight to [] would silently wipe out everything the
    // player had already found instead of just renaming it in place.
    return {
      ...parsed,
      metCharacterIds: parsed.metCharacterIds ?? [],
      visitedLocationIds: parsed.visitedLocationIds ?? [parsed.currentLocationId],
      discoveredItemIds: parsed.discoveredItemIds ?? parsed.discoveredEvidenceIds ?? [],
    };
  } catch {
    return null;
  }
}

export function clearGameState(caseId: string): void {
  window.localStorage.removeItem(saveKey(caseId));
}

export function hasSavedGame(caseId: string): boolean {
  return window.localStorage.getItem(saveKey(caseId)) !== null;
}
