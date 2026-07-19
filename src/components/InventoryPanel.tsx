import type { ItemView } from "../game/types";

interface InventoryPanelProps {
  items: ItemView[];
  onSelectItem: (itemId: string) => void;
}

/** Discovered items, shown as the player's inventory - each one clickable
 * to open its detail view (see ItemDetail, rendered by InventoryModal).
 * Bare content only (no panel wrapper/heading) - always rendered inside
 * InventoryModal, which supplies both. */
export function InventoryPanel({ items, onSelectItem }: InventoryPanelProps) {
  if (items.length === 0) {
    return <p className="room-panel__empty">Your inventory is empty.</p>;
  }

  return (
    <ul className="inventory-panel__list">
      {items.map((item) => (
        <li key={item.id}>
          <button className="inventory-panel__item" onClick={() => onSelectItem(item.id)}>
            <strong>{item.name}</strong>
            <span>{item.description}</span>
          </button>
        </li>
      ))}
    </ul>
  );
}
