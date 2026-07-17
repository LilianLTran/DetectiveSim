/** Purely decorative fanned card-back visual, shared by the dashboard's
 * DrawCardPanel teaser and the full DrawCardPage. No game data involved.
 * The card face art is public/icons/cardBackIcon.svg, applied as a CSS
 * background in app.css (`.draw-card-panel__card`) - replace that file to
 * swap in custom art without touching this component or the CSS. */
export function CardFan() {
  return (
    <div className="draw-card-panel__fan" aria-hidden="true">
      {[0, 1, 2, 3].map((i) => (
        <div key={i} className={`draw-card-panel__card draw-card-panel__card--${i}`} />
      ))}
    </div>
  );
}
