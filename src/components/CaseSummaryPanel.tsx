import type { CaseSummaryView } from "../game/types";

interface CaseSummaryPanelProps {
  summary: CaseSummaryView;
}

/** Renders the case-at-a-glance sidebar: summary, people involved, and
 * the current lead. All values come from CaseSummaryView - which character
 * portraits appear and which lead text is shown are decided by engine.ts
 * (via case.json's peopleInvolvedIds/leads), never hardcoded here. */
export function CaseSummaryPanel({ summary }: CaseSummaryPanelProps) {
  return (
    <section className="panel case-summary-panel">
      <h3>Case Summary</h3>

      <div className="case-summary-panel__section">
        <h4>Premise</h4>
        <p className="case-summary-panel__premise-text">{summary.premise}</p>
      </div>

      <div className="case-summary-panel__section">
        <h4>People Involved</h4>
        {summary.peopleInvolved.length === 0 ? (
          <p className="room-panel__empty">You haven't met anyone yet.</p>
        ) : (
          <div className="case-summary-panel__people">
            {summary.peopleInvolved.map((person) => (
              <div key={person.id} className="case-summary-panel__person">
                {person.portrait ? (
                  <img
                    src={person.portrait}
                    alt=""
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).style.visibility = "hidden";
                    }}
                  />
                ) : (
                  <div className="case-summary-panel__person-placeholder" />
                )}
                <span>{person.name}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="case-summary-panel__section">
        <h4>Current Lead</h4>
        <p>{summary.currentLead}</p>
      </div>
    </section>
  );
}
