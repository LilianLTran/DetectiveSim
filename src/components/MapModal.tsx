import type { MapHotspotView } from "../game/types";
import { TravelMap } from "./TravelMap";
import { Modal } from "./Modal";

interface MapModalProps {
  mapImage: string;
  locations: MapHotspotView[];
  /** True when viewing a location's inner subMap - Back then goes up to the
   * outer map instead of closing the modal outright. */
  canGoBack: boolean;
  onSelectLocation: (locationId: string) => void;
  onOpenSubMap: (locationId: string) => void;
  onBack: () => void;
  onClose: () => void;
}

/** In-place enlarged map with clickable hotspots, opened from MapPreview.
 * Closes itself on a successful travel or an explicit close/backdrop click -
 * replaces the old dedicated /travel route so picking a destination never
 * leaves the dashboard. */
export function MapModal({ mapImage, locations, canGoBack, onSelectLocation, onOpenSubMap, onBack, onClose }: MapModalProps) {
  return (
    <Modal
      title="Where would you like to go?"
      onClose={onClose}
      headingActions={
        canGoBack ? (
          <button className="action-button action-button--small" onClick={onBack}>
            &larr; Back
          </button>
        ) : null
      }
    >
      <TravelMap mapImage={mapImage} locations={locations} onSelectLocation={onSelectLocation} onOpenSubMap={onOpenSubMap} />
    </Modal>
  );
}
