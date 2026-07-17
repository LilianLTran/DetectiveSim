// ---------------------------------------------------------------------------
// Loads every case under src/data/cases/*.json at build time and exposes them
// for the homepage listing and for gameService to select from. Adding a new
// case is just dropping a new JSON file in that folder - no code changes.
// ---------------------------------------------------------------------------

import type { CaseData, CaseListing } from "./types";

const caseModules = import.meta.glob<{ default: CaseData }>("../data/cases/*.json", { eager: true });

const allCases: CaseData[] = Object.values(caseModules).map((mod) => mod.default);

export function listCaseListings(): CaseListing[] {
  return allCases.map((caseData) => ({
    id: caseData.meta.id,
    title: caseData.meta.title,
    tagline: caseData.meta.tagline,
    coverImage: caseData.meta.coverImage,
    premise: caseData.caseSummary.premise,
  }));
}

export function getCaseDataById(caseId: string): CaseData {
  const found = allCases.find((caseData) => caseData.meta.id === caseId);
  if (!found) throw new Error(`Unknown case: ${caseId}`);
  return found;
}
