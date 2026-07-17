# Detective Sim
https://detective-sim.vercel.app/

A data-driven detective / social-sim game engine. Pick a case from the
homepage, explore locations, talk to characters, collect evidence, and make
an accusation — all story content lives under
[`src/data/cases/*.json`](src/data/cases), not in the React components.

## Requirements

- Node.js 18+
- npm

## Running it

```bash
npm install
npm run dev
```

Then open the URL Vite prints (default [http://localhost:5173](http://localhost:5173)).

Other scripts:

```bash
npm run build      # type-check (tsc -b) then produce a production build in dist/
npm run preview    # serve the production build locally
npm run typecheck  # type-check only, no build output
```

Progress is saved to the browser's `localStorage` automatically after every
action, namespaced per case, so refreshing the page resumes where you left
off. To start over on a case, clear site data for the page or click "Start
New Game" after an ending. "Quit to Title" (in the settings gear, top-right)
returns to the case-selection homepage without losing that case's save.

## Architecture

```
React Router (URL)  →  page  →  gameService  →  game engine  →  case JSON (via caseRegistry)
```

Routing is real (`react-router-dom`, `BrowserRouter`), not simulated view-state:
- `/` — homepage, lists every case
- `/case/:caseId` — that case's dashboard
- `/case/:caseId/draw-card` — the (still dummy) draw-card page

Each route's page component (in `src/pages/`) reads `caseId` from the URL via
`useParams()` and calls `gameService.selectCase(caseId)` itself, so a hard
reload or a direct link to any of these URLs works correctly — there's no
reliance on in-memory navigation state.

- **`src/data/cases/*.json`** — one file per case: locations, characters,
  evidence, explore actions, dialogue trees, the accusation solution, and
  endings. Adding a new case is just dropping a new JSON file here — nothing
  else needs to change.
- **`src/game/caseRegistry.ts`** — loads every file in `data/cases/` at build
  time (via `import.meta.glob`) and exposes a listing (for the homepage) and
  a lookup by case id (for gameService to load the full case on selection).
- **`src/game/engine.ts`** — pure game rules: condition checking, effect
  application, dialogue traversal, accusation resolution. No React, no
  localStorage, no notion of "which case" beyond the `CaseData` it's handed.
- **`src/game/gameService.ts`** — the only module React is allowed to import
  from `game/`. Tracks which case is currently selected and wraps the engine
  + save/load behind a small set of methods (`listCases`, `selectCase`,
  `getLocationView`, `travelTo`, `performExploreAction`, `startDialogue`,
  `chooseDialogueChoice`, `accuse`, etc.), returning display-ready view
  objects.
- **`src/game/save.ts`** — localStorage persistence, keyed by case id so
  different cases' saves don't collide.
- **`src/components/*`** — render view objects only. They never check game
  conditions, apply effects, or know the accusation solution.

This separation means the game is backend-ready: swapping `gameService.ts`'s
method bodies for `fetch()` calls to an API (especially `accuse()`, which is
where the hidden solution should eventually live server-side, and
`listCases()`, which would become a catalog endpoint) requires no changes to
any component.

## Project structure

```
src/
  main.tsx              entry point, wraps App in <BrowserRouter>
  App.tsx                just the <Routes> table - no game logic of its own

  pages/
    HomePageRoute.tsx      "/" - thin wrapper, navigates on case selection
    CaseDashboardPage.tsx  "/case/:caseId" - owns GameState for that case
    DrawCardPageRoute.tsx  "/case/:caseId/draw-card"

  data/
    cases/
      island-without-signal.json   full sample case
      vanishing-heirloom.json      minimal second sample case

  game/
    types.ts             CaseData / GameState / view type definitions
    caseRegistry.ts       loads every case JSON, lists/looks them up by id
    engine.ts             condition/effect/dialogue/accusation rules
    gameService.ts        the API surface React components call
    save.ts                localStorage load/save, namespaced by case id

  components/
    HomePage.tsx           case-selection grid (route-agnostic)
    ...                    (the rest render view objects only)

  styles/
    app.css               dark noir dashboard styling

public/
  icons/                  shared dashboard/settings icon assets (not case-specific)
  cases/
    <case-id>/
      cover.png            homepage card image, referenced by that case's meta.coverImage
      map.png               referenced by that case's settings.mapImage
      portraits/<id>.png    referenced by that character's portrait field
      evidence/<id>.png     referenced by that evidence item's image field
```

## Adding content

- **New case**: add a new `src/data/cases/*.json` file matching the `CaseData`
  shape (see the two existing files). It appears on the homepage automatically.
- **New room**: add an entry to `locations` in that case's JSON (id, name,
  description, `mapZone` as % coordinates, `exploreActions: []`).
- **New explore action**: add an entry to `exploreActions`, and reference its
  `id` from the location's `exploreActions` array. Gate it with `conditions`
  and unlock things with `effects`.
- **New dialogue**: add `DialogueNode` entries to `dialogueNodes`, and point a
  character's `dialogueStarts.default` (or a topic key) at the first node's
  id. Chain nodes together via each choice's `nextDialogueId`.

No engine or component changes are needed for any of the above.
