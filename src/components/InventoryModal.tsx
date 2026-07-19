import { useState } from "react";
import type { ItemView } from "../game/types";
import { Modal } from "./Modal";
import { InventoryPanel } from "./InventoryPanel";
import { ItemDetail } from "./ItemDetail";

interface InventoryModalProps {
  items: ItemView[];
  onUseItem: (itemId: string) => void;
  onClose: () => void;
}

/** Enlarged view of the inventory, opened from SidebarActionsPreview - same
 * in-place modal pattern as SidebarActionsModal/LocationActionsModal.
 * Selecting an item swaps the list for its detail view (ItemDetail, which
 * owns its own Back/Close controls, so the outer Modal's heading Close is
 * hidden while it's showing to avoid two Close buttons at once) - same
 * list-then-detail drill-down MapModal uses for sub-maps. Selection is
 * transient UI state, not GameState, so it lives here rather than being
 * lifted to CaseDashboardPage. */
export function InventoryModal({ items, onUseItem, onClose }: InventoryModalProps) {
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const selectedItem = items.find((item) => item.id === selectedItemId) ?? null;

  return (
    <Modal title="Inventory" onClose={onClose} hideCloseButton={selectedItem !== null}>
      {selectedItem ? (
        <ItemDetail
          item={selectedItem}
          onUseItem={() => onUseItem(selectedItem.id)}
          onBack={() => setSelectedItemId(null)}
          onClose={onClose}
        />
      ) : (
        <InventoryPanel items={items} onSelectItem={setSelectedItemId} />
      )}
    </Modal>
  );
}
