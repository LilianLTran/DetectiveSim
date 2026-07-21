interface LocationActionsPreviewProps {
  /** Count of currently-available (not disabled/already-done) explore
   * actions - not the location's total authored action count - so this
   * hits 0, and the button disables, once everything here has been done. */
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
      <button className="location-actions-preview__button" disabled={exploreCount === 0} onClick={onOpenExplore}>
        <span className="location-actions-preview__label">
          Available
          <br />
          Actions
        </span>
        <span className="location-actions-preview__badge">{formatBadgeCount(exploreCount)}</span>
      </button>
      <button className="location-actions-preview__button" disabled={peopleCount === 0} onClick={onOpenPeople}>
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
