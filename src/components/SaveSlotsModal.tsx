import { useState } from "react";
import type { SaveSlotView } from "../game/types";
import { Modal } from "./Modal";

interface SaveSlotsModalProps {
  slots: SaveSlotView[];
  onSaveToSlot: (slotIndex: number) => void;
  onLoadFromSlot: (slotIndex: number) => void;
  onRemoveSlot: (slotIndex: number) => void;
  onClose: () => void;
}

function slotCaption(slot: SaveSlotView): string {
  const parts = [`Day ${slot.day}`, slot.date, slot.time, slot.locationName].filter(Boolean);
  return parts.join(" · ");
}

function SlotThumbnail({ slot }: { slot: SaveSlotView }) {
  return (
    <>
      {slot.image && (
        <img
          className="save-slots__thumb"
          src={slot.image}
          alt=""
          onError={(e) => {
            (e.currentTarget as HTMLImageElement).style.display = "none";
          }}
        />
      )}
      <span className="save-slots__caption">{slotCaption(slot)}</span>
    </>
  );
}

/** 2x5 grid of save slots opened from Settings > Manage Saves. Every slot is
 * a single click target: an empty slot saves the current game state into it
 * immediately (nothing to lose); a filled slot opens a small
 * Load/Delete/Close prompt (same list-then-detail drill-down InventoryModal
 * uses for items) instead of acting right away, since loading discards
 * unsaved progress and deleting is permanent. The outer Modal's own heading
 * Close is hidden while that prompt is showing, so there's only ever one
 * "Close" control on screen at a time - the prompt's own Close backs out to
 * the grid. */
export function SaveSlotsModal({ slots, onSaveToSlot, onLoadFromSlot, onRemoveSlot, onClose }: SaveSlotsModalProps) {
  const [openSlotIndex, setOpenSlotIndex] = useState<number | null>(null);
  const openSlot = slots.find((slot) => slot.slotIndex === openSlotIndex) ?? null;

  function handleSlotClick(slot: SaveSlotView) {
    if (slot.isEmpty) {
      onSaveToSlot(slot.slotIndex);
      return;
    }
    setOpenSlotIndex(slot.slotIndex);
  }

  function handleDelete(slotIndex: number) {
    onRemoveSlot(slotIndex);
    setOpenSlotIndex(null);
  }

  return (
    <Modal title="Manage Saves" onClose={onClose} hideCloseButton={openSlot !== null}>
      {openSlot ? (
        <div className="save-slots__prompt">
          <div className="save-slots__prompt-thumb">
            <SlotThumbnail slot={openSlot} />
          </div>
          <div className="save-slots__prompt-actions">
            <button className="action-button action-button--small" onClick={() => onLoadFromSlot(openSlot.slotIndex)}>
              Load Saved Game
            </button>
            <button className="action-button action-button--small" onClick={() => handleDelete(openSlot.slotIndex)}>
              Delete Saved Game
            </button>
            <button className="action-button action-button--small" onClick={() => setOpenSlotIndex(null)}>
              Close
            </button>
          </div>
        </div>
      ) : (
        <div className="save-slots__grid">
          {slots.map((slot) => {
            const content = slot.isEmpty ? (
              <span className="save-slots__empty-label">Click to save</span>
            ) : (
              <SlotThumbnail slot={slot} />
            );

            return (
              <button
                key={slot.slotIndex}
                type="button"
                className="save-slots__body"
                onClick={() => handleSlotClick(slot)}
              >
                {content}
              </button>
            );
          })}
        </div>
      )}
    </Modal>
  );
}
