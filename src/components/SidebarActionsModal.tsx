import type { RelationshipView } from "../game/types";
import { Modal } from "./Modal";
import { RelationshipPanel } from "./RelationshipPanel";

interface SidebarActionsModalProps {
  relationships: RelationshipView[];
  onClose: () => void;
}

/** Enlarged view of Relationships, opened from SidebarActionsPreview - same
 * in-place modal pattern as LocationActionsModal/MapModal. Current Lead used
 * to share this modal too, but now renders inline via CurrentLeadPanel. */
export function SidebarActionsModal({ relationships, onClose }: SidebarActionsModalProps) {
  return (
    <Modal title="Relationships" onClose={onClose}>
      <RelationshipPanel relationships={relationships} />
    </Modal>
  );
}
