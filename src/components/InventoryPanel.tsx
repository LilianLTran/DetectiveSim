import type { EvidenceView } from "../game/types";

interface InventoryPanelProps {
  evidence: EvidenceView[];
}

/** Placeholder inventory: for now it mirrors discovered evidence. Once the
 * case defines separate item pickups, this can read a distinct view without
 * any change to its props shape. */
export function InventoryPanel({ evidence }: InventoryPanelProps) {
  return (
    <section className="panel inventory-panel">
      <h3>Inventory</h3>
      {evidence.length === 0 ? (
        <p className="room-panel__empty">Your inventory is empty.</p>
      ) : (
        <div className="inventory-panel__grid">
          {evidence.map((item) => (
            <div key={item.id} className="inventory-panel__slot" title={item.description}>
              <span className="inventory-panel__name">{item.name}</span>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
