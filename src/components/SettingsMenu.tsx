import { useState } from "react";

interface SettingsMenuProps {
  /** Starts a brand-new game for the active case, discarding current progress. */
  onRestartGame: () => void;
  /** Returns the player to the case-selection homepage. */
  onQuitToTitle: () => void;
  /** Opens the 10-slot save/load modal. */
  onManageSaves: () => void;
}

/** Gear icon at the top-right of the dashboard. Opens a small dropdown of
 * settings actions. */
export function SettingsMenu({ onRestartGame, onQuitToTitle, onManageSaves }: SettingsMenuProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="settings-menu">
      <button
        className="settings-menu__trigger"
        aria-label="Settings"
        aria-expanded={isOpen}
        onClick={() => setIsOpen((open) => !open)}
      >
        {/* Rendered as a CSS mask so its color comes from var(--gold) - the
            active case's accent color - instead of being baked into the SVG. */}
        <span
          className="settings-menu__icon"
          style={{ WebkitMaskImage: "url(/icons/settingIcon.svg)", maskImage: "url(/icons/settingIcon.svg)" }}
          aria-hidden="true"
        />
      </button>

      {isOpen && (
        <>
          <div className="settings-menu__backdrop" onClick={() => setIsOpen(false)} />
          <div className="settings-menu__panel">
            <button
              className="settings-menu__option"
              onClick={() => {
                setIsOpen(false);
                onRestartGame();
              }}
            >
              Restart Game
            </button>
            <button
              className="settings-menu__option"
              onClick={() => {
                setIsOpen(false);
                onManageSaves();
              }}
            >
              Manage Saves
            </button>
            <button
              className="settings-menu__option"
              onClick={() => {
                setIsOpen(false);
                onQuitToTitle();
              }}
            >
              Quit to Title
            </button>
          </div>
        </>
      )}
    </div>
  );
}
