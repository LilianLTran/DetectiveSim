interface MapPreviewProps {
  mapImage: string;
  locationName: string;
  onOpenMap: () => void;
}

/** Dashboard teaser: just the map image, no hotspots. Clicking it navigates
 * to the full interactive travel page - it doesn't move the player itself. */
export function MapPreview({ mapImage, locationName, onOpenMap }: MapPreviewProps) {
  return (
    <button className="map-preview" onClick={onOpenMap} title="Open map">
      <div className="travel-map__frame">
        <img
          src={mapImage}
          alt="Case map"
          className="travel-map__image"
          onError={(e) => {
            (e.currentTarget as HTMLImageElement).style.visibility = "hidden";
          }}
        />
        <span className="map-preview__label">{locationName}</span>
      </div>
    </button>
  );
}
