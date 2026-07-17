import type { LocationView } from "../game/types";

interface RoomPanelProps {
  location: LocationView;
  onExplore: (actionId: string) => void;
  onTalk: (characterId: string) => void;
}

/** Renders the current location and its two action lists: explore actions
 * and people present. Every button maps 1:1 to a gameService call in App.tsx -
 * this component never decides what's allowed, it only renders what the
 * engine already decided. */
export function RoomPanel({ location, onExplore, onTalk }: RoomPanelProps) {
  return (
    <section className="room-panel">
      <h2 className="room-panel__title">{location.locationName}</h2>
      <p className="room-panel__description">{location.description}</p>

      <div className="room-panel__section">
        <h3>Explore Area</h3>
        {location.exploreActions.length === 0 ? (
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
        )}
      </div>

      <div className="room-panel__section">
        <h3>People Here</h3>
        {location.peopleHere.length === 0 ? (
          <p className="room-panel__empty">No one else is here right now.</p>
        ) : (
          <div className="room-panel__buttons">
            {location.peopleHere.map((person) => (
              <button key={person.id} className="action-button action-button--person" onClick={() => onTalk(person.id)}>
                {person.portrait ? (
                  <img className="action-button__portrait" src={person.portrait} alt="" onError={(e) => {
                    (e.currentTarget as HTMLImageElement).style.visibility = "hidden";
                  }} />
                ) : null}
                <span>
                  {person.name}
                  <small>{person.role}</small>
                </span>
              </button>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
