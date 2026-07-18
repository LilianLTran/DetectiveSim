import type { ReactNode } from "react";

interface ModalProps {
  title: string;
  children: ReactNode;
  /** Extra buttons shown before the always-present Close button, e.g. a
   * "Back" button for drilling back out of a sub-view. */
  headingActions?: ReactNode;
  onClose: () => void;
}

/** Generic in-place modal shell: dimmed backdrop + centered panel with a
 * heading row (title + actions) and a Close button. Clicking the backdrop
 * closes it; clicks inside the panel don't propagate to the backdrop. Shared
 * by MapModal and LocationActionsModal so both open/close the same way. */
export function Modal({ title, children, headingActions, onClose }: ModalProps) {
  return (
    <div className="modal__backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal__heading-row">
          <h2>{title}</h2>
          <div className="modal__heading-actions">
            {headingActions}
            <button className="action-button" onClick={onClose}>
              Close
            </button>
          </div>
        </div>
        {children}
      </div>
    </div>
  );
}
