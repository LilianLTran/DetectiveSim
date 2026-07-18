interface SidebarActionsPreviewProps {
  relationshipCount: number;
  onOpenRelationships: () => void;
  onOpenLead: () => void;
}

const MAX_BADGE_COUNT = 99;

/** Caps the displayed count at "99+" instead of a possibly very long number,
 * so the badge (and the button around it) never grows unbounded. */
function formatBadgeCount(count: number): string {
  return count > MAX_BADGE_COUNT ? `${MAX_BADGE_COUNT}+` : String(count);
}

/** Stacked pair of buttons under Case Summary - Relationships and Current
 * Lead - that open SidebarActionsModal instead of showing their content
 * inline. Same "click to expand" pattern as Explore Area/People Here,
 * reusing the same button styling, just stacked vertically instead of in a
 * row. */
export function SidebarActionsPreview({ relationshipCount, onOpenRelationships, onOpenLead }: SidebarActionsPreviewProps) {
  return (
    <div className="sidebar-actions-preview">
      <button className="location-actions-preview__button" onClick={onOpenRelationships}>
        <span className="location-actions-preview__label">Relationships</span>
        <span className="location-actions-preview__badge">{formatBadgeCount(relationshipCount)}</span>
      </button>
      <button className="location-actions-preview__button" onClick={onOpenLead}>
        <span className="location-actions-preview__label">Current Lead</span>
      </button>
    </div>
  );
}
