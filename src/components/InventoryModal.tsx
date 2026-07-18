import type { EvidenceView } from "../game/types";
import { Modal } from "./Modal";
import { InventoryPanel } from "./InventoryPanel";

interface InventoryModalProps {
  evidence: EvidenceView[];
  onClose: () => void;
}

/** Enlarged view of the inventory, opened from InventoryPreview - same
 * in-place modal pattern as SidebarActionsModal/LocationActionsModal. */
export function InventoryModal({ evidence, onClose }: InventoryModalProps) {
  return (
    <Modal title="Inventory" onClose={onClose}>
      <InventoryPanel evidence={evidence} />
    </Modal>
  );
}