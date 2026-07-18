interface LocationActionsPreviewProps {
  exploreCount: number;
  peopleCount: number;
  onOpenExplore: () => void;
  onOpenPeople: () => void;
}

const MAX_BADGE_COUNT = 99;

/** Caps the displayed count at "99+" instead of a possibly very long number,
 * so the badge (and the button around it) never grows unbounded. */
function formatBadgeCount(count: number): string {
  return count > MAX_BADGE_COUNT ? `${MAX_BADGE_COUNT}+` : String(count);
}

/** Compact row of two buttons under the map preview - Explore Area and
 * People Here - that open LocationActionsModal instead of showing their
 * full lists inline. Same "click to expand" pattern as the map. */
export function LocationActionsPreview({ exploreCount, peopleCount, onOpenExplore, onOpenPeople }: LocationActionsPreviewProps) {
  return (
    <div className="location-actions-preview">
      <button className="location-actions-preview__button" onClick={onOpenExplore}>
        <span className="location-actions-preview__label">
          Explore
          <br />
          Area
        </span>
        <span className="location-actions-preview__badge">{formatBadgeCount(exploreCount)}</span>
      </button>
      <button className="location-actions-preview__button" onClick={onOpenPeople}>
        <span className="location-actions-preview__label">
          People
          <br />
          Here
        </span>
        <span className="location-actions-preview__badge">{formatBadgeCount(peopleCount)}</span>
      </button>
    </div>
  );
}
