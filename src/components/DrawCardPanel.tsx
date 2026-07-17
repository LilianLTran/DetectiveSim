import type { CardDeckView } from "../game/types";
import { CardFan } from "./CardFan";

interface DrawCardPanelProps {
  deck: CardDeckView;
  onOpenDrawCard: () => void;
}

/** Dashboard teaser for the card deck. Shows remaining count and whether
 * drawing is currently allowed (from CardDeckView). Clicking anywhere on the
 * panel - not just the button - navigates to the DrawCardPage; it doesn't
 * draw a card itself. */
export function DrawCardPanel({ deck, onOpenDrawCard }: DrawCardPanelProps) {
  function handleClick() {
    if (deck.canDraw) onOpenDrawCard();
  }

  return (
    <section
      className={"panel draw-card-panel" + (deck.canDraw ? " draw-card-panel--clickable" : "")}
      title={deck.canDraw ? undefined : deck.disabledReason}
      onClick={handleClick}
    >
      <h3>Draw Card</h3>

      <CardFan />

      <p className="draw-card-panel__description">{deck.description}</p>

      <button
        className="action-button action-button--accuse"
        disabled={!deck.canDraw}
        title={deck.canDraw ? undefined : deck.disabledReason}
        onClick={onOpenDrawCard}
      >
        Draw a Card
      </button>

      <p className="draw-card-panel__remaining">Cards Remaining: {deck.remaining}</p>
    </section>
  );
}
