import type { EvidenceView } from "../game/types";
import { InventoryPanel } from "./InventoryPanel";

interface InventoryPreviewProps {
  itemCount: number;
  evidence: EvidenceView[];
  onOpen: () => void;
}

const MAX_BADGE_COUNT = 99;

function formatBadgeCount(count: number): string {
  return count > MAX_BADGE_COUNT ? `${MAX_BADGE_COUNT}+` : String(count);
}

export function InventoryPreview({
  evidence,
  onOpen,
}: InventoryPreviewProps) {
  return (
    <div className="inventory-preview">
      <button
        type="button"
        className="location-actions-preview__button inventory-preview__button"
        onClick={onOpen}
      >
        <span className="inventory-preview__heading">
          <span className="location-actions-preview__label">
            Inventory
          </span>

          <span className="location-actions-preview__badge">
            {formatBadgeCount(evidence.length)}
          </span>
        </span>
        
        <InventoryPanel evidence={evidence}/>
      </button>
    </div>
  );
}