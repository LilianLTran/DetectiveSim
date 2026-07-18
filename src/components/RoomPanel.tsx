import { useEffect, useState } from "react";
import type { LocationView } from "../game/types";

interface RoomPanelProps {
  location: LocationView;
}

/** Renders the current location's name, image, and description - the
 * "location block". When there's an image, the description shows as a
 * dismissible overlay centered over it (click to dismiss) instead of text
 * underneath, and reappears each time you arrive at a new location. With no
 * image there's nothing to overlay onto, so it just renders as plain text. */
export function RoomPanel({ location }: RoomPanelProps) {
  const [showDescription, setShowDescription] = useState(true);

  // Arriving at a new location always starts with its description visible
  // again, even if the previous location's description was dismissed.
  useEffect(() => {
    setShowDescription(true);
  }, [location.locationId]);

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
          {showDescription ? (
            <div className="room-panel__description-overlay" onClick={() => setShowDescription(false)}>
              <div className="room-panel__description-scroll">
                <p>{location.description}</p>
              </div>
            </div>
          ) : null}
        </div>
      ) : (
        <p className="room-panel__description">{location.description}</p>
      )}
    </section>
  );
}
