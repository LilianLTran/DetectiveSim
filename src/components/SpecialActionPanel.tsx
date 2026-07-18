interface SpecialActionPanelProps {
  onUse: () => void;
}

/** Placeholder for a not-yet-designed special action - a single standalone
 * button (styled like the "Draw a Card" button) rather than a panel
 * wrapping a button, the same way MapPreview is one clickable element
 * instead of a panel around a button. Swap in real behavior once the
 * actual mechanic is designed. */
export function SpecialActionPanel({ onUse }: SpecialActionPanelProps) {
  return (
    <button className="action-button action-button--accuse special-action-button" onClick={onUse}>
      Special Action
    </button>
  );
}
