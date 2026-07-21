interface TimeSkipPanelProps {
  onOpenTimeSkip: () => void;
}

/** Dashboard trigger for the time-skip modal - single button styled like
 * SidebarActionsPreview's Relationships/Inventory buttons
 * (location-actions-preview__button), just standing alone here instead of
 * stacked with siblings. No badge count, since there's nothing to count. */
export function TimeSkipPanel({ onOpenTimeSkip }: TimeSkipPanelProps) {
  return (
    <button className="location-actions-preview__button time-skip-panel__button" onClick={onOpenTimeSkip}>
      <span className="location-actions-preview__label">Show date and time</span>
    </button>
  );
}
