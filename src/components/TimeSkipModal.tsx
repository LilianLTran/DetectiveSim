import { useState } from "react";
import { Modal } from "./Modal";

interface TimeSkipPreview {
  day: number;
  date: string;
  time: string;
}

interface TimeSkipModalProps {
  currentDay: number;
  currentDate: string;
  currentTime: string;
  onPreview: (minutes: number) => TimeSkipPreview;
  onSkipTime: (minutes: number) => void;
  onClose: () => void;
}

const STEP_MINUTES = { day: 1440, hour: 60, minute: 1 } as const;

/** Car-dashboard-clock style time skip: one pending delta (in minutes),
 * adjusted by per-unit +/- steppers rather than preset jump buttons - since
 * every unit adjusts the same underlying total, incrementing Minute past
 * :59 naturally carries into Hour/Day in the live preview, no cascade logic
 * needed. The delta is clamped at 0 (can't go negative - the actual
 * GameState clock never moves until Skip Time is pressed, so there's
 * nothing to "go back" from until then). Delta is transient UI state, not
 * GameState - same reasoning as InventoryModal's selected-item state. */
export function TimeSkipModal({ currentDay, currentDate, currentTime, onPreview, onSkipTime, onClose }: TimeSkipModalProps) {
  const [deltaMinutes, setDeltaMinutes] = useState(0);

  function adjust(step: number) {
    setDeltaMinutes((prev) => Math.max(0, prev + step));
  }

  const preview: TimeSkipPreview =
    deltaMinutes === 0 ? { day: currentDay, date: currentDate, time: currentTime } : onPreview(deltaMinutes);

  return (
    <Modal title="Show Date and Time" onClose={onClose}>
      <div className="time-skip">
        <p className="time-skip__current">
          Now: Day {currentDay} · {currentDate} · {currentTime}
        </p>
        <p className="time-skip__preview">
          Skip to: Day {preview.day} · {preview.date} · {preview.time}
        </p>

        <div className="time-skip__steppers">
          {(
            [
              ["Day", STEP_MINUTES.day],
              ["Hour", STEP_MINUTES.hour],
              ["Minute", STEP_MINUTES.minute],
            ] as const
          ).map(([label, step]) => (
            <div className="time-skip__stepper" key={label}>
              <button
                type="button"
                className="action-button action-button--small time-skip__stepper-button"
                onClick={() => adjust(step)}
              >
                +
              </button>
              <span className="time-skip__stepper-label">{label}</span>
              <button
                type="button"
                className="action-button action-button--small time-skip__stepper-button"
                disabled={deltaMinutes === 0}
                onClick={() => adjust(-step)}
              >
                −
              </button>
            </div>
          ))}
        </div>

        <button
          type="button"
          className="action-button action-button--accuse"
          disabled={deltaMinutes === 0}
          onClick={() => onSkipTime(deltaMinutes)}
        >
          Skip Time
        </button>
      </div>
    </Modal>
  );
}
