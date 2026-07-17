import { useState } from "react";
import type { Accusation, EndingResult } from "../game/types";
import type { AccusationOptions } from "../game/gameService";

interface AccusationPanelProps {
  options: AccusationOptions;
  ending: EndingResult | null;
  onAccuse: (accusation: Accusation) => void;
}

/** Lets the player pick a suspect + method and submit an accusation. All of
 * the win/lose logic happens in engine.ts - this component only collects
 * the player's choice and displays whatever EndingResult comes back. */
export function AccusationPanel({ options, ending, onAccuse }: AccusationPanelProps) {
  const [culpritId, setCulpritId] = useState(options.suspects[0]?.id ?? "");
  const [method, setMethod] = useState(options.methods[0] ?? "");

  if (ending) {
    return (
      <section className="panel accusation-panel">
        <h3>{ending.title}</h3>
        <p>{ending.description}</p>
      </section>
    );
  }

  return (
    <section className="panel accusation-panel">
      <h3>Make an Accusation</h3>
      <label className="accusation-panel__field">
        Suspect
        <select value={culpritId} onChange={(e) => setCulpritId(e.target.value)}>
          {options.suspects.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
      </label>
      <label className="accusation-panel__field">
        Method
        <select value={method} onChange={(e) => setMethod(e.target.value)}>
          {options.methods.map((m) => (
            <option key={m} value={m}>
              {m}
            </option>
          ))}
        </select>
      </label>
      <button
        className="action-button action-button--accuse"
        onClick={() => onAccuse({ culpritId, method })}
        disabled={!culpritId || !method}
      >
        Submit Accusation
      </button>
    </section>
  );
}
