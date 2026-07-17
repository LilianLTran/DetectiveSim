import type { DashboardInfo } from "../game/gameService";
import { SettingsMenu } from "./SettingsMenu";

interface DashboardHeaderProps {
  info: DashboardInfo;
  onRestartGame: () => void;
  onQuitToTitle: () => void;
}

// Rendered as a CSS mask (not <img>) so its color comes from var(--gold) -
// the active case's accent color - instead of being baked into the SVG file.
function StatIcon({ src }: { src: string }) {
  const maskImage = `url(${src})`;
  return (
    <span
      className="dashboard-header__stat-icon"
      style={{ WebkitMaskImage: maskImage, maskImage }}
      aria-hidden="true"
    />
  );
}

/** Pure display of the top status bar. Knows nothing about game rules. */
export function DashboardHeader({ info, onRestartGame, onQuitToTitle }: DashboardHeaderProps) {
  return (
    <header className="dashboard-header">
      <div className="dashboard-header__title">
        <span className="dashboard-header__badge">Case File</span>
        <h1>{info.caseTitle}</h1>
      </div>

      <div className="dashboard-header__right">
        <div className="dashboard-header__stats">
          <div className="dashboard-header__stat">
            <StatIcon src="/icons/calendarIcon.svg" />
            <div className="dashboard-header__stat-text">
              <span className="dashboard-header__label">Day {info.day}</span>
              <span className="dashboard-header__value">{info.date}</span>
            </div>
          </div>
          <div className="dashboard-header__stat">
            <StatIcon src="/icons/timeIcon.svg" />
            <div className="dashboard-header__stat-text">
              <span className="dashboard-header__label">Time</span>
              <span className="dashboard-header__value">{info.time}</span>
            </div>
          </div>
          <div className="dashboard-header__stat">
            <StatIcon src="/icons/locationIcon.svg" />
            <div className="dashboard-header__stat-text">
              <span className="dashboard-header__label">Location</span>
              <span className="dashboard-header__value">{info.locationName}</span>
            </div>
          </div>
          <div className="dashboard-header__stat">
            <StatIcon src="/icons/weatherIcon.svg" />
            <div className="dashboard-header__stat-text">
              <span className="dashboard-header__label">Weather</span>
              <span className="dashboard-header__value">{info.period}</span>
              <span className="dashboard-header__sublabel">{info.weather}</span>
            </div>
          </div>
        </div>

        <SettingsMenu onRestartGame={onRestartGame} onQuitToTitle={onQuitToTitle} />
      </div>
    </header>
  );
}
