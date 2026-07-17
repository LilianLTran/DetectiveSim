import { useState } from "react";
import type { CaseListing } from "../game/types";

interface HomePageProps {
  cases: CaseListing[];
  onSelectCase: (caseId: string) => void;
}

interface HoverInfo {
  caseListing: CaseListing;
  clientX: number;
  clientY: number;
}

/** Landing screen: lists every case from the registry as a clickable card.
 * Picking one hands its id back to App.tsx, which calls
 * gameService.selectCase(caseId) and enters that case's dashboard. This
 * component only renders CaseListing objects - it has no idea how many
 * cases exist or where they come from. Hovering a card shows its premise
 * (the fuller narrative hook) in a floating tooltip, separate from the
 * short tagline already visible on the card. */
export function HomePage({ cases, onSelectCase }: HomePageProps) {
  const [hover, setHover] = useState<HoverInfo | null>(null);

  function handleHoverMove(caseListing: CaseListing, e: React.MouseEvent) {
    if (!caseListing.premise) return;
    setHover({ caseListing, clientX: e.clientX, clientY: e.clientY });
  }

  function handleHoverEnd() {
    setHover(null);
  }

  return (
    <div className="home-page">
      <div className="home-page__heading">
        <span className="dashboard-header__badge">Detective Sim</span>
        <h1>Case Files</h1>
        <p className="home-page__subtitle">Choose a case to begin your investigation.</p>
      </div>

      <div className="home-page__grid">
        {cases.map((c) => (
          <button
            key={c.id}
            className="home-page__card"
            onClick={() => onSelectCase(c.id)}
            onMouseMove={(e) => handleHoverMove(c, e)}
            onMouseLeave={handleHoverEnd}
          >
            {c.coverImage && (
              <div className="home-page__cover">
                <img
                  src={c.coverImage}
                  alt=""
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).style.visibility = "hidden";
                  }}
                />
              </div>
            )}
            <div className="home-page__card-body">
              <h2>{c.title}</h2>
              {c.tagline && <p>{c.tagline}</p>}
            </div>
          </button>
        ))}
      </div>

      {hover && (
        <div className="home-page__tooltip" style={{ left: hover.clientX + 14, top: hover.clientY + 14 }}>
          <strong>{hover.caseListing.title}</strong>
          <span>{hover.caseListing.premise}</span>
        </div>
      )}
    </div>
  );
}
