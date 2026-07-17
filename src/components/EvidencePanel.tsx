import type { EvidenceView } from "../game/types";

interface EvidencePanelProps {
  evidence: EvidenceView[];
}

export function EvidencePanel({ evidence }: EvidencePanelProps) {
  return (
    <section className="panel evidence-panel">
      <h3>Evidence Collected ({evidence.length})</h3>
      {evidence.length === 0 ? (
        <p className="room-panel__empty">No evidence discovered yet.</p>
      ) : (
        <ul className="evidence-panel__list">
          {evidence.map((item) => (
            <li key={item.id} className="evidence-panel__item">
              <strong>{item.name}</strong>
              <span>{item.description}</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
