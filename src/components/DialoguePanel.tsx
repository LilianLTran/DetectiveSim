import type { DialogueView } from "../game/types";

interface DialoguePanelProps {
  dialogue: DialogueView;
  onChoose: (choiceId: string) => void;
}

/** Renders the active conversation, or a placeholder when nothing is active.
 * Choice availability (disabled + reason) is decided entirely by the engine;
 * this component just reflects it. */
export function DialoguePanel({ dialogue, onChoose }: DialoguePanelProps) {
  if (!dialogue.isActive) {
    return (
      <div className="dialogue-panel dialogue-panel--empty">
        <p>Select someone to talk to, or explore the area.</p>
      </div>
    );
  }

  return (
    <div className="dialogue-panel">
      <div className="dialogue-panel__speaker">{dialogue.characterName}</div>
      <div className="dialogue-panel__lines">
        {dialogue.lines?.map((line, index) => (
          <p key={index} className="dialogue-panel__line">
            {line.text}
          </p>
        ))}
      </div>
      <div className="dialogue-panel__choices">
        {dialogue.choices?.map((choice) => (
          <button
            key={choice.id}
            className="action-button"
            disabled={choice.disabled}
            title={choice.disabled ? choice.disabledReason : undefined}
            onClick={() => onChoose(choice.id)}
          >
            {choice.text}
          </button>
        ))}
      </div>
    </div>
  );
}
