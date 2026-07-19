import { useEffect, useLayoutEffect, useRef, useState } from "react";
import type { DialogueView } from "../game/types";
import { useSceneScale } from "../hooks/useSceneScale";

const SCENE_REFERENCE_WIDTH = 1400;

interface DialogueModalProps {
  dialogue: DialogueView;
  locationImage?: string;
  onChoose: (choiceId: string) => void;
}

/** Visual-novel style version of the conversation, opened as soon as a
 * dialogue starts. No title bar or close button, and the backdrop isn't
 * clickable - a conversation can only be left by reaching a choice with
 * `nextDialogueId: null`, not backed out of early. Character art (if any)
 * stands on the left, full height. Both phases share one middle-third band
 * (mutually exclusive content, not two separate bands): the character's
 * line(s) show first, each its own chat bubble with a left-pointing tail
 * (mirroring the character portrait's side); pressing Enter swaps that for
 * the player's response choices, as right-tailed bubbles instead - the
 * left/right split reads as a real back-and-forth. Neither phase needs a
 * veil behind it, since every bubble already paints its own opaque
 * background. If a node's choices don't all fit in the band, they
 * paginate - navigated with the ← / → keyboard arrow keys, not on-screen
 * buttons - instead of scrolling as a group (an individual choice's own
 * text still scrolls internally past 3 lines). */
export function DialogueModal({ dialogue, locationImage, onChoose }: DialogueModalProps) {
  const [revealed, setRevealed] = useState(false);
  const [pageIndex, setPageIndex] = useState(0);
  const [pageStarts, setPageStarts] = useState<number[]>([0]);
  const [pageEnd, setPageEnd] = useState<number | null>(null);

  const choicesContainerRef = useRef<HTMLDivElement>(null);
  const choiceRefs = useRef<Map<string, HTMLButtonElement>>(new Map());
  const { ref: sceneRef, current: sceneNodeRef, scale } = useSceneScale(SCENE_REFERENCE_WIDTH);

  const choices = dialogue.choices ?? [];
  const pageStart = pageStarts[pageIndex] ?? 0;
  const candidateChoices = choices.slice(pageStart);
  const pageChoices = pageEnd !== null ? choices.slice(pageStart, pageEnd) : candidateChoices;
  const hasMultiplePages = pageIndex > 0 || (pageEnd !== null && pageEnd < choices.length);
  const canGoPrev = pageIndex > 0;
  const canGoNext = pageEnd !== null && pageEnd < choices.length;

  function goToPrevPage() {
    if (pageIndex === 0) return;
    setPageIndex((p) => p - 1);
    setPageEnd(null);
  }

  function goToNextPage() {
    if (pageEnd === null || pageEnd >= choices.length) return;
    setPageStarts((prev) => {
      const next = [...prev];
      next[pageIndex + 1] = pageEnd;
      return next;
    });
    setPageIndex((p) => p + 1);
    setPageEnd(null);
  }

  // A new dialogue node just loaded - drop any staging/pagination state
  // left over from the previous node.
  useEffect(() => {
    setRevealed(false);
    setPageIndex(0);
    setPageStarts([0]);
    setPageEnd(null);
    choiceRefs.current.clear();
  }, [dialogue.nodeId]);

  // Enter reveals the player's choices (one-way per node).
  useEffect(() => {
    if (!dialogue.isActive || revealed) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Enter") {
        e.preventDefault();
        setRevealed(true);
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [dialogue.isActive, revealed]);

  // Once choices are revealed, the left/right arrow keys page through them
  // (no on-screen prev/next buttons - keyboard only, same as Enter above).
  useEffect(() => {
    if (!dialogue.isActive || !revealed) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        goToPrevPage();
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        goToNextPage();
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dialogue.isActive, revealed, pageIndex, pageEnd, choices.length]);

  // Measure how many of this page's candidate choices actually fit in the
  // band before paint, then trim to that count. Two-pass (measure the full
  // remainder, then re-render trimmed) instead of clipping with CSS forever,
  // so there's no flash of untrimmed content and off-page buttons don't
  // linger in the DOM/tab order.
  //
  // Compares against the clipping container's own bounding-box bottom edge
  // (not offsetTop/clientHeight): .dialogue-panel__choices shrink-wraps to
  // its own content and is centered via `margin: auto 0`, so it doesn't
  // share an origin with .dialogue-modal__overlay (the nearest positioned
  // ancestor, and therefore every button's offsetParent) - offsetTop would
  // be measured from the wrong edge. getBoundingClientRect is viewport-
  // relative for both, so it stays correct regardless of that mismatch.
  useLayoutEffect(() => {
    if (!revealed || candidateChoices.length === 0) return;
    const container = choicesContainerRef.current;
    if (!container) return;
    const bandBottom = container.getBoundingClientRect().bottom;
    let fitCount = 0;
    for (let i = 0; i < candidateChoices.length; i++) {
      const el = choiceRefs.current.get(candidateChoices[i].id);
      if (!el) break;
      if (el.getBoundingClientRect().bottom <= bandBottom + 0.5) {
        fitCount = i + 1;
      } else {
        break;
      }
    }
    if (fitCount === 0) fitCount = 1;
    setPageEnd(pageStart + fitCount);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [revealed, pageStart, choices.length]);

  // Pagination boundaries depend on the band's actual rendered height -
  // recompute from the first page if the scene resizes.
  useEffect(() => {
    const scene = sceneNodeRef.current;
    if (!scene || typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(() => {
      setPageIndex(0);
      setPageStarts([0]);
      setPageEnd(null);
    });
    ro.observe(scene);
    return () => ro.disconnect();
  }, [dialogue.nodeId]);

  if (!dialogue.isActive) return null;

  return (
    <div className="dialogue-modal__backdrop">
      <div className="dialogue-modal__scene" ref={sceneRef}>
        {locationImage ? (
          <img
            className="dialogue-modal__backdrop-image"
            src={locationImage}
            alt=""
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).style.display = "none";
            }}
          />
        ) : null}
        <div className="dialogue-modal__scale-wrapper" style={{ transform: `scale(${scale})` }}>
          {dialogue.characterImage ? (
            <img className="dialogue-modal__character" src={dialogue.characterImage} alt="" />
          ) : null}

          {!revealed && <div className="dialogue-modal__hint">[Enter] to continue</div>}
          {revealed && hasMultiplePages && (
            <div className="dialogue-modal__hint">
              {canGoPrev ? "←" : ""} {canGoNext ? "→" : ""}
            </div>
          )}

          <div className="dialogue-modal__overlay">
            <div className="dialogue-modal__content">
              {!revealed ? (
                <div className="dialogue-modal__lines-view">
                  <div className="dialogue-modal__lines-inner">
                    <div className="dialogue-panel__speaker">{dialogue.characterName}</div>
                    <div className="dialogue-panel__lines">
                      {dialogue.lines?.map((line, index) => (
                        <p key={index} className="dialogue-panel__line dialogue-panel__line--tail-left">
                          {line.text}
                        </p>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="dialogue-modal__choices-view" ref={choicesContainerRef}>
                  <div className="dialogue-panel__choices">
                    {pageChoices.map((choice) => (
                      <button
                        key={choice.id}
                        ref={(el) => {
                          if (el) choiceRefs.current.set(choice.id, el);
                          else choiceRefs.current.delete(choice.id);
                        }}
                        className="action-button dialogue-choice dialogue-choice--tail-right"
                        disabled={choice.disabled}
                        title={choice.disabled ? choice.disabledReason : undefined}
                        onClick={() => onChoose(choice.id)}
                      >
                        <span className="dialogue-choice__text">{choice.text}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
