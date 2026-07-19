import type { ItemView } from "../game/types";

interface ItemDetailProps {
  item: ItemView;
  onUseItem: () => void;
  onBack: () => void;
  onClose: () => void;
}

/** Full detail view for a single inventory item, opened from InventoryPanel
 * (see InventoryModal, which owns the list/detail switch). Three columns -
 * image (if any) with the item's name below it, description, and the Use
 * Item button - with Back/Close controls of its own at the bottom right
 * (Back returns to the item list, Close exits the inventory entirely) since
 * the outer Modal's own heading Close is hidden for this view. Using an
 * item isn't designed yet - "Use Item" is a placeholder button, same
 * pattern as SpecialActionPanel - so this just reports back up via
 * onUseItem for the parent to show a stub message. */
export function ItemDetail({ item, onUseItem, onBack, onClose }: ItemDetailProps) {
  return (
    <div className="item-detail">
      <div className="item-detail__columns">
        <div className="item-detail__media">
          {item.image ? (
            <img
              className="item-detail__image"
              src={item.image}
              alt=""
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).style.display = "none";
              }}
            />
          ) : null}
          <strong className="item-detail__name">{item.name}</strong>
        </div>
        <p className="item-detail__description">{item.description}</p>
        <div className="item-detail__action">
          <button className="action-button action-button--accuse" onClick={onUseItem}>
            Use Item
          </button>
        </div>
      </div>
      <div className="item-detail__footer">
        <button className="action-button action-button--small" onClick={onBack}>
          &larr; Back
        </button>
        <button className="action-button action-button--small" onClick={onClose}>
          Close
        </button>
      </div>
    </div>
  );
}
