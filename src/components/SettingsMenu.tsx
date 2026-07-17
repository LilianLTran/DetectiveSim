import { useState } from "react";

// Still dummy for now - not wired to gameService yet. When it is, this
// becomes the natural place for onSaveGame/onLoadGame props, called the
// same way every other component calls into gameService.
const DUMMY_OPTIONS = ["Save Game", "Load Game"];

interface SettingsMenuProps {
  /** Starts a brand-new game for the active case, discarding current progress. */
  onRestartGame: () => void;
  /** Returns the player to the case-selection homepage. */
  onQuitToTitle: () => void;
}

/** Gear icon at the top-right of the dashboard. Opens a small dropdown of
 * settings actions - "Restart Game" and "Quit to Title" are wired up, the
 * rest are placeholders. */
export function SettingsMenu({ onRestartGame, onQuitToTitle }: SettingsMenuProps) {
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
            {DUMMY_OPTIONS.map((option) => (
              <button key={option} className="settings-menu__option" onClick={() => setIsOpen(false)}>
                {option}
              </button>
            ))}
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
