import type { ReactNode } from "react";

interface ModalProps {
  title: string;
  children: ReactNode;
  /** Extra buttons shown before the heading Close button, e.g. a "Back"
   * button for drilling back out of a sub-view. */
  headingActions?: ReactNode;
  /** Hides the heading row's own Close button - for views (like
   * InventoryModal's item detail) that supply their own Close/Back controls
   * elsewhere instead. Clicking the backdrop still closes it either way. */
  hideCloseButton?: boolean;
  onClose: () => void;
}

/** Generic in-place modal shell: dimmed backdrop + centered panel with a
 * heading row (title + actions) and a Close button. Clicking the backdrop
 * closes it; clicks inside the panel don't propagate to the backdrop. Shared
 * by MapModal and LocationActionsModal so both open/close the same way. */
export function Modal({ title, children, headingActions, hideCloseButton, onClose }: ModalProps) {
  return (
    <div className="modal__backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal__heading-row">
          <h2>{title}</h2>
          <div className="modal__heading-actions">
            {headingActions}
            {hideCloseButton ? null : (
              <button className="action-button action-button--small" onClick={onClose}>
                Close
              </button>
            )}
          </div>
        </div>
        {children}
      </div>
    </div>
  );
}
