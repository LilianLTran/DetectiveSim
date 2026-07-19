import { useCallback, useLayoutEffect, useRef, useState, type RefObject } from "react";

/** Watches an element's actual rendered width and returns width / referenceWidth,
 * so a fixed-size inner layer (authored at referenceWidth px) can be scaled
 * via `transform: scale()` to match however large the element actually
 * rendered - every property inside (font size, padding, image size, tail
 * size...) shrinks/grows together in lockstep, instead of needing separate
 * responsive rules for each one.
 *
 * Takes a callback ref (not a plain RefObject) because the watched element
 * can mount after this hook's first call - e.g. DialogueModal calls this
 * hook unconditionally (Rules of Hooks) but only renders its scene div once
 * `dialogue.isActive` is true, which can happen on a later render than the
 * component's first. A plain useRef's identity never changes across
 * renders, so an effect keyed on it only ever runs once, at first mount -
 * if the element wasn't attached yet, it's never retried. The callback ref
 * fires exactly when the DOM node attaches/detaches, so the observer setup
 * re-runs at the right time instead of missing it. */
export function useSceneScale(referenceWidth: number): { ref: (node: HTMLElement | null) => void; current: RefObject<HTMLElement | null>; scale: number } {
  const [scale, setScale] = useState(1);
  const [node, setNode] = useState<HTMLElement | null>(null);
  const current = useRef<HTMLElement | null>(null);

  const ref = useCallback((el: HTMLElement | null) => {
    current.current = el;
    setNode(el);
  }, []);

  useLayoutEffect(() => {
    if (!node || typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver((entries) => {
      const width = entries[0]?.contentRect.width;
      if (width) setScale(width / referenceWidth);
    });
    ro.observe(node);
    return () => ro.disconnect();
  }, [node, referenceWidth]);

  return { ref, current, scale };
}
