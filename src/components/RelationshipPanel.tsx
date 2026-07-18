import type { RelationshipView } from "../game/types";

interface RelationshipPanelProps {
  relationships: RelationshipView[];
}

/** Renders whatever relationship metrics the active case defines (trust,
 * suspicion, affection, respect - any set, any names, any colors) - it has
 * no built-in notion of which metrics exist, that's all in RelationshipView.
 * Bare content only (no panel wrapper/heading) - always rendered inside
 * SidebarActionsModal, which supplies both. */
export function RelationshipPanel({ relationships }: RelationshipPanelProps) {
  if (relationships.length === 0) {
    return <p className="room-panel__empty">You haven't met anyone yet.</p>;
  }

  return (
    <div className="relationship-panel__list">
      {relationships.map((rel) => (
        <div key={rel.characterId} className="relationship-panel__row">
          <span className="relationship-panel__name">{rel.characterName}</span>
          <div className="relationship-panel__bars">
            {rel.metrics.map((metric) => (
              <div className="meter" key={metric.id}>
                <span className="meter__label">{metric.label}</span>
                <div className="meter__track">
                  <div
                    className="meter__fill"
                    style={{ width: `${metric.value}%`, backgroundColor: metric.color }}
                  />
                </div>
                <span className="meter__value">{metric.value}</span>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
