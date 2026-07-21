import type { LocationView } from "../game/types";
import { useSceneScale } from "../hooks/useSceneScale";
import { usePaginatedChoices } from "../hooks/usePaginatedChoices";

const SCENE_REFERENCE_WIDTH = 1400;

interface ActionModalProps {
  location: LocationView;
  onExplore: (actionId: string) => void;
  onClose: () => void;
}

const DO_NOTHING_ID = "__do_nothing__";

interface ActionChoice {
  id: string;
  label: string;
  disabled: boolean;
  disabledReason?: string;
  onSelect: () => void;
}

/** Full-screen action-choice scene, opened from Explore Area - same visual
 * language as DialogueModal (backdrop image, scaled content band, keyboard-
 * only pagination via usePaginatedChoices) but with no character and no
 * "lines" phase to click through first, since there's no dialogue text here
 * - it goes straight to showing the location's exploreActions as choices.
 * Choice buttons are plain action-button - no speech-bubble tail, since
 * these are actions, not spoken lines.
 *
 * Unlike a conversation, the player must be able to leave without acting -
 * a synthetic "Do Nothing" choice is always appended (not one of the
 * location's real exploreActions, so it never affects the Explore Area
 * trigger button's disabled-when-empty state), matching the "only leave via
 * a choice" rule DialogueModal's non-clickable backdrop already enforces -
 * this backdrop isn't clickable either, for the same reason.
 *
 * Selecting a real action does not close this scene - SceneNotice overlays
 * on top with the result, and dismissing it returns here, matching the
 * "stays open so multiple actions can be tried in a row" behavior this
 * replaces from the old LocationActionsModal explore mode. */
export function ActionModal({ location, onExplore, onClose }: ActionModalProps) {
  const { ref: sceneRef, current: sceneNodeRef, scale } = useSceneScale(SCENE_REFERENCE_WIDTH);

  const choices: ActionChoice[] = [
    ...location.exploreActions.map((action) => ({
      id: action.id,
      label: action.label,
      disabled: action.disabled,
      disabledReason: action.disabledReason,
      onSelect: () => onExplore(action.id),
    })),
    { id: DO_NOTHING_ID, label: "Do Nothing", disabled: false, onSelect: onClose },
  ];

  const { pageItems, hasMultiplePages, canGoPrev, canGoNext, choicesContainerRef, registerItemRef } =
    usePaginatedChoices(choices, location.locationId, true, sceneNodeRef);

  return (
    <div className="dialogue-modal__backdrop">
      <div className="dialogue-modal__scene" ref={sceneRef}>
        {location.image ? (
          <img
            className="dialogue-modal__backdrop-image"
            src={location.image}
            alt=""
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).style.display = "none";
            }}
          />
        ) : null}
        <div className="dialogue-modal__scale-wrapper" style={{ transform: `scale(${scale})` }}>
          {hasMultiplePages && (
            <div className="dialogue-modal__hint">
              {canGoPrev ? "←" : ""} {canGoNext ? "→" : ""}
            </div>
          )}

          <div className="dialogue-modal__overlay">
            <div className="dialogue-modal__content">
              <div className="dialogue-modal__choices-view" ref={choicesContainerRef}>
                <div className="dialogue-panel__choices">
                  {pageItems.map((choice) => (
                    <button
                      key={choice.id}
                      ref={registerItemRef(choice.id)}
                      className="action-button"
                      disabled={choice.disabled}
                      title={choice.disabled ? choice.disabledReason : undefined}
                      onClick={choice.onSelect}
                    >
                      {choice.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
