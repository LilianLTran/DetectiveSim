import { useEffect, useState } from "react";
import type { MapHotspotView } from "../game/types";

interface TravelMapProps {
  mapImage: string;
  locations: MapHotspotView[];
  onSelectLocation: (locationId: string) => void;
  /** Called instead of onSelectLocation when a clicked hotspot has hasSubMap
   * set - opens that location's inner map rather than traveling here directly. */
  onOpenSubMap: (locationId: string) => void;
}

interface HoverInfo {
  location: MapHotspotView;
  clientX: number;
  clientY: number;
}

/** Renders a case's map image with invisible clickable hotspots built
 * from each location's mapZone - the art already labels every building, so
 * hotspots carry no highlight of their own. Hovering shows a tooltip with
 * the location's name and (when the case defines it) walk time/distance
 * from wherever the player currently is - no story knowledge lives here,
 * that's all precomputed in the MapHotspotView passed in as `locations`.
 * Also used, unchanged, to render a location's inner subMap. */
export function TravelMap({ mapImage, locations, onSelectLocation, onOpenSubMap }: TravelMapProps) {
  const [hover, setHover] = useState<HoverInfo | null>(null);

  // TravelPageRoute stays mounted across outer<->inner map navigation (same
  // route element, just a param change), so a leftover tooltip from the
  // previous map would otherwise still be showing until the next mousemove.
  useEffect(() => {
    setHover(null);
  }, [mapImage]);

  const polygonLocations = locations.filter((l) => (l.mapZone.points?.length ?? 0) >= 3);
  const rectLocations = locations.filter((l) => (l.mapZone.points?.length ?? 0) < 3);

  function handleHoverMove(location: MapHotspotView, e: { clientX: number; clientY: number }) {
    setHover({ location, clientX: e.clientX, clientY: e.clientY });
  }

  function handleHoverEnd() {
    setHover(null);
  }

  function handleClick(location: MapHotspotView) {
    if (location.hasSubMap) {
      onOpenSubMap(location.id);
    } else {
      onSelectLocation(location.id);
    }
  }

  return (
    <div className="travel-map">
      <div className="travel-map__frame">
        <img
          src={mapImage}
          alt="Case map"
          className="travel-map__image"
          onError={(e) => {
            (e.currentTarget as HTMLImageElement).style.visibility = "hidden";
          }}
        />

        {polygonLocations.length > 0 && (
          <svg className="travel-map__polygons" viewBox="0 0 100 100" preserveAspectRatio="none">
            {polygonLocations.map((location) => (
              <polygon
                key={location.id}
                className="travel-map__polygon"
                points={location.mapZone.points!.map(([x, y]) => `${x},${y}`).join(" ")}
                onClick={() => handleClick(location)}
                onMouseMove={(e) => handleHoverMove(location, e)}
                onMouseLeave={handleHoverEnd}
              />
            ))}
          </svg>
        )}

        {rectLocations.map((location) => (
          <button
            key={location.id}
            className="travel-map__hotspot"
            style={{
              left: `${location.mapZone.x}%`,
              top: `${location.mapZone.y}%`,
              width: `${location.mapZone.width}%`,
              height: `${location.mapZone.height}%`,
            }}
            onClick={() => handleClick(location)}
            onMouseMove={(e) => handleHoverMove(location, e)}
            onMouseLeave={handleHoverEnd}
          />
        ))}
      </div>

      {hover && (
        <div className="travel-map__tooltip" style={{ left: hover.clientX + 14, top: hover.clientY + 14 }}>
          {hover.location.isCurrent ? (
            <strong>{hover.location.name} - You are here</strong>
          ) : (
            <>
              <strong>Walk to {hover.location.name}</strong>
              {hover.location.walkMinutes != null && (
                <span>{hover.location.walkMinutes} min</span>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
