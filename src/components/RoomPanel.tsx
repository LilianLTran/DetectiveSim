import type { LocationView } from "../game/types";

interface RoomPanelProps {
  location: LocationView;
}

/** Renders the current location's name, image, and description - the
 * "location block". With an image, only the image is shown here (the
 * description now only ever appears via SceneNotice, on arrival). With no
 * image there's nothing to show it over, so the plain-text description
 * still renders directly. */
export function RoomPanel({ location }: RoomPanelProps) {
  return (
    <section className="room-panel">
      <h2 className="room-panel__title">{location.locationName}</h2>
      {location.image ? (
        <div className="room-panel__image">
          <img
            className="room-panel__backdrop"
            src={location.image}
            alt=""
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).style.display = "none";
            }}
          />
        </div>
      ) : (
        <p className="room-panel__description">{location.description}</p>
      )}
    </section>
  );
}
