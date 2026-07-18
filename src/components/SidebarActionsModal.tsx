import type { RelationshipView } from "../game/types";
import { Modal } from "./Modal";
import { RelationshipPanel } from "./RelationshipPanel";

interface SidebarActionsModalProps {
  mode: "relationships" | "lead";
  relationships: RelationshipView[];
  currentLead: string;
  onClose: () => void;
}

/** Enlarged view of either Relationships or Current Lead, opened from
 * SidebarActionsPreview - same in-place modal pattern as
 * LocationActionsModal/MapModal. */
export function SidebarActionsModal({ mode, relationships, currentLead, onClose }: SidebarActionsModalProps) {
  return (
    <Modal title={mode === "relationships" ? "Relationships" : "Current Lead"} onClose={onClose}>
      {mode === "relationships" ? <RelationshipPanel relationships={relationships} /> : <p>{currentLead}</p>}
    </Modal>
  );
}