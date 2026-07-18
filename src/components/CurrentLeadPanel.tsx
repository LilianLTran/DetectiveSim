interface CurrentLeadPanelProps {
  currentLead: string;
}

/** Plain box showing the current lead inline, under RoomPanel - unlike
 * Relationships/Inventory it never expands into a modal. */
export function CurrentLeadPanel({ currentLead }: CurrentLeadPanelProps) {
  return (
    <section className="panel current-lead-panel">
      <h3>Current Lead</h3>
      <p>{currentLead}</p>
    </section>
  );
}
