import { useEffect, useLayoutEffect, useRef, useState, type RefObject } from "react";

interface PaginatedChoicesResult<T> {
  pageItems: T[];
  hasMultiplePages: boolean;
  canGoPrev: boolean;
  canGoNext: boolean;
  choicesContainerRef: RefObject<HTMLDivElement>;
  registerItemRef: (id: string) => (el: HTMLButtonElement | null) => void;
}

/** Arrow-key pagination *and* navigation for a list of choice buttons that
 * must all fit inside a fixed-height band (DialogueModal's dialogue choices,
 * ActionModal's action choices): measures how many of the remaining items
 * actually fit before paint, trims to that count, and pages left/right
 * through the rest with the ArrowLeft/ArrowRight keys - no on-screen
 * prev/next buttons, same keyboard-only design both callers want.
 * ArrowUp/ArrowDown move real browser focus between the current page's
 * choice buttons (clamped at the first/last item, not wrapping) rather than
 * tracking a separate highlighted-index concept - a focused `<button>`
 * already fires a click on Enter/Space natively, so "Enter selects the
 * highlighted option" needs no extra listener here, and callers don't need
 * to change anything to get it. The first item on a page is auto-focused
 * whenever the visible set changes, so Enter works immediately.
 *
 * `active` gates both the keyboard listener and the measurement (only
 * meaningful once this list is actually the thing on screen - e.g.
 * DialogueModal's "lines" phase has no choices to paginate yet). `resetKey`
 * drops all paging state when it changes (a new dialogue node, or a freshly
 * opened action scene). `sceneNode` is watched so a resize (e.g. the window
 * resizing) re-measures from the first page instead of leaving stale page
 * boundaries in place. */
export function usePaginatedChoices<T extends { id: string; disabled?: boolean }>(
  items: T[],
  resetKey: string | undefined,
  active: boolean,
  sceneNode: RefObject<HTMLElement | null>
): PaginatedChoicesResult<T> {
  const [pageIndex, setPageIndex] = useState(0);
  const [pageStarts, setPageStarts] = useState<number[]>([0]);
  const [pageEnd, setPageEnd] = useState<number | null>(null);

  const choicesContainerRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<Map<string, HTMLButtonElement>>(new Map());

  const pageStart = pageStarts[pageIndex] ?? 0;
  const candidateItems = items.slice(pageStart);
  const pageItems = pageEnd !== null ? items.slice(pageStart, pageEnd) : candidateItems;
  const hasMultiplePages = pageIndex > 0 || (pageEnd !== null && pageEnd < items.length);
  const canGoPrev = pageIndex > 0;
  const canGoNext = pageEnd !== null && pageEnd < items.length;

  function goToPrevPage() {
    if (pageIndex === 0) return;
    setPageIndex((p) => p - 1);
    setPageEnd(null);
  }

  function goToNextPage() {
    if (pageEnd === null || pageEnd >= items.length) return;
    setPageStarts((prev) => {
      const next = [...prev];
      next[pageIndex + 1] = pageEnd;
      return next;
    });
    setPageIndex((p) => p + 1);
    setPageEnd(null);
  }

  // A new list just loaded (new dialogue node / freshly opened scene) - drop
  // any pagination state left over from before.
  useEffect(() => {
    setPageIndex(0);
    setPageStarts([0]);
    setPageEnd(null);
    itemRefs.current.clear();
  }, [resetKey]);

  useEffect(() => {
    if (!active) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        goToPrevPage();
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        goToNextPage();
      } else if (e.key === "ArrowUp" || e.key === "ArrowDown") {
        e.preventDefault();
        const currentIndex = pageItems.findIndex((item) => itemRefs.current.get(item.id) === document.activeElement);
        const delta = e.key === "ArrowDown" ? 1 : -1;
        const nextIndex =
          currentIndex === -1 ? 0 : Math.min(Math.max(currentIndex + delta, 0), pageItems.length - 1);
        itemRefs.current.get(pageItems[nextIndex]?.id ?? "")?.focus();
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, pageIndex, pageEnd, items.length]);

  // Auto-focus the first item whenever the currently-focused element isn't
  // one of this page's own choice buttons - covers becoming active, a page
  // change, the fit-count measurement below finishing, *and* a button that
  // was focused becoming disabled out from under the player (e.g. a
  // once-only action completing): browsers blur a control the instant it's
  // disabled, and nothing else here would notice that and refocus. Checked
  // on every render (via the `items` dependency, which callers rebuild
  // fresh each render) rather than only on page/measurement changes, since
  // disabling can happen without the page or fit-count changing at all. */
  useEffect(() => {
    if (!active) return;
    const activeIsTracked = pageItems.some((item) => itemRefs.current.get(item.id) === document.activeElement);
    if (activeIsTracked) return;
    // A disabled button can't actually receive focus (browsers refuse it),
    // so landing on the first *focusable* item matters here, not just the
    // first item - e.g. a once-only action that just got completed.
    const focusable = pageItems.find((item) => !item.disabled) ?? pageItems[0];
    if (!focusable) return;
    itemRefs.current.get(focusable.id)?.focus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, pageStart, pageEnd, items]);

  // Measure how many of this page's candidate items actually fit in the
  // band before paint, then trim to that count. Two-pass (measure the full
  // remainder, then re-render trimmed) instead of clipping with CSS forever,
  // so there's no flash of untrimmed content and off-page buttons don't
  // linger in the DOM/tab order. Compares against the clipping container's
  // own bounding-box bottom edge (not offsetTop/clientHeight) since the
  // container shrink-wraps its own content and is centered independently of
  // its offsetParent - getBoundingClientRect stays correct regardless.
  useLayoutEffect(() => {
    if (!active || candidateItems.length === 0) return;
    const container = choicesContainerRef.current;
    if (!container) return;
    const bandBottom = container.getBoundingClientRect().bottom;
    let fitCount = 0;
    for (let i = 0; i < candidateItems.length; i++) {
      const el = itemRefs.current.get(candidateItems[i].id);
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
  }, [active, pageStart, items.length]);

  // Pagination boundaries depend on the band's actual rendered height -
  // recompute from the first page if the scene resizes.
  useEffect(() => {
    const scene = sceneNode.current;
    if (!scene || typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(() => {
      setPageIndex(0);
      setPageStarts([0]);
      setPageEnd(null);
    });
    ro.observe(scene);
    return () => ro.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resetKey]);

  function registerItemRef(id: string) {
    return (el: HTMLButtonElement | null) => {
      if (el) itemRefs.current.set(id, el);
      else itemRefs.current.delete(id);
    };
  }

  return { pageItems, hasMultiplePages, canGoPrev, canGoNext, choicesContainerRef, registerItemRef };
}
