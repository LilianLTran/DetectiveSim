import { useEffect, useState } from "react";
import type { DialogueView } from "../game/types";
import { useSceneScale } from "../hooks/useSceneScale";
import { usePaginatedChoices } from "../hooks/usePaginatedChoices";

const SCENE_REFERENCE_WIDTH = 1400;

interface DialogueModalProps {
  dialogue: DialogueView;
  locationImage?: string;
  onChoose: (choiceId: string) => void;
}

type Phase = "image" | "lines" | "choices";

/** Visual-novel style version of the conversation, opened as soon as a
 * dialogue starts. No title bar or close button, and the backdrop isn't
 * clickable - a conversation can only be left by reaching a choice with
 * `nextDialogueId: null`, not backed out of early. Character art (if any)
 * stands on the left, full height, visible from the very first frame.
 *
 * Three phases, one Enter press apart: "image" shows just the character
 * (and location backdrop) with nothing in the content band yet; Enter
 * reveals the character's line(s) as left-tailed chat bubbles ("lines");
 * Enter again swaps that for the player's response choices, as right-tailed
 * bubbles instead ("choices") - the left/right split reads as a real
 * back-and-forth. Neither the lines nor choices view needs a veil behind
 * it, since every bubble already paints its own opaque background. If a
 * node's choices don't all fit in the band, they paginate via
 * usePaginatedChoices - navigated with the ← / → keyboard arrow keys, not
 * on-screen buttons - instead of scrolling as a group. */
export function DialogueModal({ dialogue, locationImage, onChoose }: DialogueModalProps) {
  const [phase, setPhase] = useState<Phase>("image");
  const { ref: sceneRef, current: sceneNodeRef, scale } = useSceneScale(SCENE_REFERENCE_WIDTH);

  const choices = dialogue.choices ?? [];
  const { pageItems, hasMultiplePages, canGoPrev, canGoNext, choicesContainerRef, registerItemRef } =
    usePaginatedChoices(choices, dialogue.nodeId, phase === "choices", sceneNodeRef);

  // A new dialogue node just loaded - drop any staging state left over from
  // the previous node (pagination state resets itself, keyed on nodeId).
  useEffect(() => {
    setPhase("image");
  }, [dialogue.nodeId]);

  // Enter advances one phase at a time: image -> lines -> choices.
  useEffect(() => {
    if (!dialogue.isActive || phase === "choices") return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key !== "Enter") return;
      e.preventDefault();
      setPhase((p) => (p === "image" ? "lines" : "choices"));
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [dialogue.isActive, phase]);

  if (!dialogue.isActive) return null;

  return (
    <div className="dialogue-modal__backdrop">
      <div className="dialogue-modal__scene" ref={sceneRef}>
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
        <div className="dialogue-modal__scale-wrapper" style={{ transform: `scale(${scale})` }}>
          {dialogue.characterImage ? (
            <img className="dialogue-modal__character" src={dialogue.characterImage} alt="" />
          ) : null}

          {phase !== "choices" && <div className="dialogue-modal__hint">[Enter] to continue</div>}
          {phase === "choices" && hasMultiplePages && (
            <div className="dialogue-modal__hint">
              {canGoPrev ? "←" : ""} {canGoNext ? "→" : ""}
            </div>
          )}

          <div className="dialogue-modal__overlay">
            <div className="dialogue-modal__content">
              {phase === "lines" && (
                <div className="dialogue-modal__lines-view">
                  <div className="dialogue-modal__lines-inner">
                    <div className="dialogue-panel__speaker">{dialogue.characterName}</div>
                    <div className="dialogue-panel__lines">
                      {dialogue.lines?.map((line, index) => (
                        <p key={index} className="dialogue-panel__line dialogue-panel__line--tail-left">
                          {line.text}
                        </p>
                      ))}
                    </div>
                  </div>
                </div>
              )}
              {phase === "choices" && (
                <div className="dialogue-modal__choices-view" ref={choicesContainerRef}>
                  <div className="dialogue-panel__choices">
                    {pageItems.map((choice) => (
                      <button
                        key={choice.id}
                        ref={registerItemRef(choice.id)}
                        className="action-button dialogue-choice dialogue-choice--tail-right"
                        disabled={choice.disabled}
                        title={choice.disabled ? choice.disabledReason : undefined}
                        onClick={() => onChoose(choice.id)}
                      >
                        <span className="dialogue-choice__text">{choice.text}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
