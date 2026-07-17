import type { MapHotspotView } from "../game/types";
import { TravelMap } from "./TravelMap";

interface TravelPageProps {
  mapImage: string;
  locations: MapHotspotView[];
  onSelectLocation: (locationId: string) => void;
  onOpenSubMap: (locationId: string) => void;
  onBack: () => void;
}

/** Full-page version of the map: this is where the interactive hotspots
 * live now. Picking a location calls back to TravelPageRoute, which performs
 * the actual travel and returns to the dashboard - this component only
 * renders the map and reports what was clicked. */
export function TravelPage({ mapImage, locations, onSelectLocation, onOpenSubMap, onBack }: TravelPageProps) {
  return (
    <div className="travel-page">
      <div className="travel-page__content">
        <div className="travel-page__heading-row">
          <h2>Where would you like to go?</h2>
          <button className="action-button travel-page__back" onClick={onBack}>
            &larr; Back
          </button>
        </div>
        <TravelMap
          mapImage={mapImage}
          locations={locations}
          onSelectLocation={onSelectLocation}
          onOpenSubMap={onOpenSubMap}
        />
      </div>
    </div>
  );
}
