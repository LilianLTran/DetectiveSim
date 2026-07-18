import type { EvidenceView } from "../game/types";

interface InventoryPanelProps {
  evidence: EvidenceView[];
}

/** Discovered evidence, shown as the player's inventory - there's no
 * separate item-pickup system, so evidence collected during the case
 * doubles as what's "carried". Bare content only (no panel wrapper/heading)
 * - always rendered inside InventoryModal, which supplies both. */
export function InventoryPanel({ evidence }: InventoryPanelProps) {
  if (evidence.length === 0) {
    return <p className="room-panel__empty">Your inventory is empty.</p>;
  }

  return (
    <ul className="inventory-panel__list">
      {evidence.map((item) => (
        <li key={item.id} className="inventory-panel__item">
          <strong>{item.name}</strong>
          <span>{item.description}</span>
        </li>
      ))}
    </ul>
  );
}