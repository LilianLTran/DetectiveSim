import { CardFan } from "./CardFan";

interface DrawCardPageProps {
  onBack: () => void;
}

/** Placeholder full-page card-draw experience. The real draw (gameService.drawCard,
 * already implemented) isn't wired in here yet - this is just the destination
 * the dashboard's "Draw a Card" button navigates to. Replace the body below
 * with the actual reveal flow when it's designed. */
export function DrawCardPage({ onBack }: DrawCardPageProps) {
  return (
    <div className="draw-card-page">
      <button className="action-button draw-card-page__back" onClick={onBack}>
        &larr; Back to Case
      </button>

      <div className="draw-card-page__content">
        <h2>Draw a Card</h2>
        <CardFan />
        <p className="draw-card-page__placeholder">
          This is a placeholder for the card draw experience. The reveal, card art, and outcome
          text will go here.
        </p>
      </div>
    </div>
  );
}
