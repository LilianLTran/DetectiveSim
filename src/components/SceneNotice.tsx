import { useEffect, useRef, useState } from "react";

interface SceneNoticeProps {
  image?: string;
  messages: string[];
  onDismiss: () => void;
}

// Must match .scene-notice__description--closing's transition duration in
// app.css - once the text is dismissed (click or Enter), it stays mounted
// fading out for exactly this long before actually being removed.
const DISMISS_FADE_MS = 500;

type Phase = "visible" | "textClosing" | "textHidden";

/** Full-screen "read and dismiss" notice shown after travel, an explore
 * action, or starting/restarting the game changes GameState - same scene/
 * hint/backdrop-image visual language as DialogueModal, but its text
 * renders as a centered glowing card (the same visual format RoomPanel's
 * description overlay used to use) rather than DialogueModal's bottom-band
 * veil, since there's no character portrait or choices to leave room for.
 *
 * Dismissing is two steps, not one: clicking anywhere on the backdrop (or
 * pressing Enter) fades the text card out over DISMISS_FADE_MS, but the
 * enlarged scene itself (backdrop image) stays up - only a second Enter
 * press (once the text has fully faded) actually calls onDismiss and lets
 * the parent unmount this. Click only ever affects the text step; the
 * scene can only be closed via Enter. Each mount is fresh (the parent only
 * renders this at all while its own notice state is non-null), so - unlike
 * RoomPanel - there's no prop that changes out from under an existing
 * instance and no need to reset state mid-life. */
export function SceneNotice({ image, messages, onDismiss }: SceneNoticeProps) {
  const [phase, setPhase] = useState<Phase>("visible");
  const dismissTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (dismissTimeoutRef.current !== null) clearTimeout(dismissTimeoutRef.current);
    };
  }, []);

  function handleDismissText() {
    if (phase !== "visible") return;
    setPhase("textClosing");
    dismissTimeoutRef.current = setTimeout(() => setPhase("textHidden"), DISMISS_FADE_MS);
  }

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key !== "Enter") return;
      e.preventDefault();
      if (phase === "textHidden") {
        onDismiss();
      } else {
        handleDismissText();
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  return (
    <div className="dialogue-modal__backdrop scene-notice__backdrop" onClick={handleDismissText}>
      <div className="dialogue-modal__scene">
        {image ? (
          <img
            className="dialogue-modal__backdrop-image"
            src={image}
            alt=""
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).style.display = "none";
            }}
          />
        ) : null}

        <div className="dialogue-modal__hint">{phase === "textHidden" ? "[Enter] to close" : "[Enter] to continue"}</div>

        {phase !== "textHidden" && (
          <div
            className={
              "scene-notice__description" + (phase === "textClosing" ? " scene-notice__description--closing" : "")
            }
          >
            <div className="scene-notice__description-scroll">
              {messages.map((message, index) => (
                <p key={index}>{message}</p>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}