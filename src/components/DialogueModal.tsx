import type { DialogueView } from "../game/types";

interface DialogueModalProps {
  dialogue: DialogueView;
  locationImage?: string;
  onChoose: (choiceId: string) => void;
}

/** Full-screen-style version of the conversation, opened as soon as a
 * dialogue starts. No title bar or close button, and the backdrop isn't
 * clickable - a conversation can only be left by reaching a choice with
 * `nextDialogueId: null`, not backed out of early. Character art (if any)
 * stands on the right, full height; the conversation reads on the left,
 * also full height, over a scrim fading into the location image. */
export function DialogueModal({ dialogue, locationImage, onChoose }: DialogueModalProps) {
  if (!dialogue.isActive) return null;

  return (
    <div className="dialogue-modal__backdrop">
      <div className="dialogue-modal__scene">
        {locationImage ? (
          <img
            className="dialogue-modal__backdrop-image"
            src={locationImage}
            alt=""
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).style.display = "none";
            }}
          />
        ) : null}
        {dialogue.characterImage ? (
          <img className="dialogue-modal__character" src={dialogue.characterImage} alt="" />
        ) : null}
        <div className="dialogue-modal__overlay">
          <div className="dialogue-modal__content">
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
        </div>
      </div>
    </div>
  );
}
