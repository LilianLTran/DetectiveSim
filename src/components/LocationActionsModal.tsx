import type { LocationView } from "../game/types";
import { Modal } from "./Modal";

interface LocationActionsModalProps {
  mode: "explore" | "people";
  location: LocationView;
  onExplore: (actionId: string) => void;
  onTalk: (characterId: string) => void;
  onClose: () => void;
}

/** Enlarged view of either the Explore Area or People Here list, opened from
 * LocationActionsPreview - same in-place modal pattern as MapModal. Talking
 * to someone closes the modal (the conversation shows in the dialogue panel
 * underneath); exploring stays open so multiple actions can be tried in a row. */
export function LocationActionsModal({ mode, location, onExplore, onTalk, onClose }: LocationActionsModalProps) {
  return (
    <Modal title={mode === "explore" ? "Explore Area" : "People Here"} onClose={onClose}>
      {mode === "explore" ? (
        location.exploreActions.length === 0 ? (
          <p className="room-panel__empty">Nothing to explore here.</p>
        ) : (
          <div className="room-panel__buttons">
            {location.exploreActions.map((action) => (
              <button
                key={action.id}
                className="action-button"
                disabled={action.disabled}
                title={action.disabled ? action.disabledReason : undefined}
                onClick={() => onExplore(action.id)}
              >
                {action.label}
                {action.disabled && action.disabledReason ? (
                  <span className="action-button__reason">{action.disabledReason}</span>
                ) : null}
              </button>
            ))}
          </div>
        )
      ) : location.peopleHere.length === 0 ? (
        <p className="room-panel__empty">No one else is here right now.</p>
      ) : (
        <div className="room-panel__buttons">
          {location.peopleHere.map((person) => (
            <button
              key={person.id}
              className="action-button action-button--person"
              onClick={() => {
                onTalk(person.id);
                onClose();
              }}
            >
              {person.portrait ? (
                <img
                  className="action-button__portrait"
                  src={person.portrait}
                  alt=""
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).style.visibility = "hidden";
                  }}
                />
              ) : null}
              <span>
                {person.name}
                <small>{person.role}</small>
              </span>
            </button>
          ))}
        </div>
      )}
    </Modal>
  );
}
