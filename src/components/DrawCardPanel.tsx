import type { CardDeckView } from "../game/types";
import { CardFan } from "./CardFan";

interface DrawCardPanelProps {
  deck: CardDeckView;
  onOpenDrawCard: () => void;
}

/** Dashboard teaser for the card deck. Shows remaining count and whether
 * drawing is currently allowed (from CardDeckView). Only the "Draw a Card"
 * button navigates to the DrawCardPage - the rest of the panel is inert. */
export function DrawCardPanel({ deck, onOpenDrawCard }: DrawCardPanelProps) {
  return (
    <section className="panel draw-card-panel">
      <div className="draw-card-panel__content">
        <CardFan />

        <button
          className="action-button action-button--accuse"
          disabled={!deck.canDraw}
          title={deck.canDraw ? undefined : deck.disabledReason}
          onClick={onOpenDrawCard}
        >
          Draw a Card
        </button>

        <p className="draw-card-panel__remaining">Cards Remaining: {deck.remaining}</p>
      </div>
    </section>
  );
}
