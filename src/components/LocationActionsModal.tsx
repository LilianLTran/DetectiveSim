import type { LocationView } from "../game/types";
import { Modal } from "./Modal";

interface LocationActionsModalProps {
  location: LocationView;
  onTalk: (characterId: string) => void;
  onClose: () => void;
}

/** Enlarged view of the People Here list, opened from LocationActionsPreview
 * - same in-place modal pattern as MapModal. Talking to someone closes the
 * modal (the conversation shows in the dialogue panel underneath). Explore
 * Area used to share this component too, but now opens the full-screen
 * ActionModal instead - this one's only job is People Here. */
export function LocationActionsModal({ location, onTalk, onClose }: LocationActionsModalProps) {
  return (
    <Modal title="People Here" onClose={onClose}>
      {location.peopleHere.length === 0 ? (
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
