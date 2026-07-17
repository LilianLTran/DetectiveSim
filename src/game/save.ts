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
    const parsed = JSON.parse(raw) as GameState;
    // Saves from before a GameState field existed won't have it - default it
    // rather than let every reader downstream crash on a missing array.
    return { ...parsed, metCharacterIds: parsed.metCharacterIds ?? [] };
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
