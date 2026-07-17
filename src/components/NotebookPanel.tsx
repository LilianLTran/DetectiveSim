import type { NotebookEntry } from "../game/types";

interface NotebookPanelProps {
  entries: NotebookEntry[];
}

export function NotebookPanel({ entries }: NotebookPanelProps) {
  return (
    <section className="panel notebook-panel">
      <h3>Notebook</h3>
      {entries.length === 0 ? (
        <p className="room-panel__empty">Your notebook is empty.</p>
      ) : (
        <ul className="notebook-panel__list">
          {entries.map((entry) => (
            <li key={entry.id} className="notebook-panel__item">
              <span className="notebook-panel__day">Day {entry.addedAtDay}</span>
              <span>{entry.text}</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
