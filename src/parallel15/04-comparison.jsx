import { useMemo, useState } from "react";
import "./04-comparison.css";

const PAIN_POINTS = [
  "Long standups with unclear progress updates",
  "Manually writing status updates and reports",
  "Chasing team members for progress updates",
  'Stakeholders asking "what shipped this week?"',
];

const BENEFITS = [
  "Automated reports from actual Git activity",
  "AI-summarized commits and PRs delivered to Slack/email",
  "Real-time visibility for stakeholders",
  "Come to standups already prepared",
];

function formatMinutes(totalMinutes) {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (!hours) {
    return `${minutes} min`;
  }

  if (!minutes) {
    return `${hours}h`;
  }

  return `${hours}h ${minutes}m`;
}

function CheckIcon() {
  return (
    <svg viewBox="0 0 20 20" aria-hidden="true" className="p15-comparison__check">
      <path
        d="M4 10.5l3.5 3.5L16 5.8"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function ComparisonSection({ defaultTeamSize = 5, min = 1, max = 20 }) {
  const safeDefault = Math.min(Math.max(defaultTeamSize, min), max);
  const [teamSize, setTeamSize] = useState(safeDefault);

  const { manualMinutes, sliderPercent, footerCopy } = useMemo(() => {
    const weeklyManualMinutes = teamSize * 15 * 5;
    const savedMinutes = weeklyManualMinutes;
    const annualHours = Math.round(((weeklyManualMinutes - 10) * 52) / 60);
    const percent = ((teamSize - min) / (max - min)) * 100;

    return {
      manualMinutes: weeklyManualMinutes,
      sliderPercent: percent,
      footerCopy: `Save ${formatMinutes(savedMinutes)} every week — that's ${annualHours}+ hours per year`,
    };
  }, [max, min, teamSize]);

  const [footerLead, footerTail] = footerCopy.split(" — ");

  return (
    <section className="p15-comparison" id="difference">
      <div className="p15-comparison__container">
        <div className="p15-comparison__intro">
          <span className="p15-comparison__eyebrow">The difference</span>
          <h2>
            <span>Your team's work, summarized.</span>
            <span>Everyone stays in sync.</span>
          </h2>
        </div>

        <div className="p15-comparison__panel">
          <div className="p15-comparison__controls">
            <label htmlFor="p15-team-size">Team size</label>

            <div className="p15-comparison__range-wrap">
              <div className="p15-comparison__track" aria-hidden="true">
                <div className="p15-comparison__fill" style={{ width: `${sliderPercent}%` }} />
              </div>

              <input
                id="p15-team-size"
                className="p15-comparison__range"
                type="range"
                min={min}
                max={max}
                value={teamSize}
                onChange={(event) => setTeamSize(Number(event.target.value))}
                aria-label="Team size"
              />

              <div className="p15-comparison__thumb" style={{ left: `calc(${sliderPercent}% - 8px)` }} aria-hidden="true" />
            </div>

            <strong className="p15-comparison__team-size">{teamSize}</strong>
          </div>

          <div className="p15-comparison__grid">
            <article className="p15-comparison__card">
              <div className="p15-comparison__card-header">
                <p>Manual updates</p>
                <h3>Without Gitmore</h3>
              </div>

              <div className="p15-comparison__metric">
                <strong>{formatMinutes(manualMinutes)}</strong>
                <span>/ week</span>
              </div>

              <p className="p15-comparison__formula">15 min × {teamSize} devs × 5 days</p>

              <ul>
                {PAIN_POINTS.map((item) => (
                  <li key={item}>
                    <span className="p15-comparison__cross" aria-hidden="true">
                      +
                    </span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </article>

            <article className="p15-comparison__card p15-comparison__card--positive">
              <div className="p15-comparison__card-header">
                <p>Automated reports</p>
                <h3>With Gitmore</h3>
              </div>

              <div className="p15-comparison__metric">
                <strong>~10 min</strong>
                <span>/ week</span>
              </div>

              <p className="p15-comparison__formula">~2 min/day × 5 days · Same for 1 or 100 devs</p>

              <ul>
                {BENEFITS.map((item) => (
                  <li key={item}>
                    <CheckIcon />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </article>
          </div>

          <div className="p15-comparison__footer">
            <p>
              {footerLead} <span>—</span> {footerTail}
            </p>

            <a className="p15-comparison__cta" href="#cta">
              Get started free
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
