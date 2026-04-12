import { useEffect, useRef, useState } from "react";
import {
  brand,
  urls,
  comparison,
  howItWorks,
  features,
  useCases,
  useCaseStats,
  previewTitles,
} from "../siteConfig";
import "./middle-sections.css";

function cx(...values) {
  return values.filter(Boolean).join(" ");
}

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

function ArrowRightIcon() {
  return (
    <svg viewBox="0 0 20 20" aria-hidden="true" className="ms-icon ms-icon-arrow">
      <path d="M4 10h11" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
      <path d="M11 4l5 6-5 6" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function CheckIcon() {
  return <span aria-hidden="true" className="ms-icon ms-icon-check">{"\u2713"}</span>;
}

function ServiceMark({ kind }) {
  if (kind === "github") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true" className="ms-service-mark">
        <path
          fill="currentColor"
          d="M12 3.5c-4.97 0-9 4.03-9 9 0 3.94 2.55 7.29 6.09 8.47.45.08.61-.19.61-.43 0-.21-.01-.9-.01-1.63-2.23.41-2.81-.55-2.99-1.06-.1-.26-.52-1.06-.88-1.28-.3-.16-.72-.56-.01-.57.67-.01 1.15.61 1.31.87.77 1.3 2 .93 2.49.71.08-.56.3-.93.54-1.14-1.98-.22-4.05-.99-4.05-4.41 0-.97.34-1.76.91-2.38-.09-.22-.4-1.14.08-2.37 0 0 .74-.24 2.43.9.71-.2 1.47-.3 2.22-.3.75 0 1.51.1 2.22.3 1.69-1.15 2.43-.9 2.43-.9.48 1.23.17 2.15.08 2.37.57.62.91 1.41.91 2.38 0 3.43-2.08 4.19-4.06 4.41.31.27.58.79.58 1.6 0 1.15-.01 2.08-.01 2.37 0 .24.16.52.62.43A9.01 9.01 0 0 0 21 12.5c0-4.97-4.03-9-9-9Z"
        />
      </svg>
    );
  }

  if (kind === "gitlab") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true" className="ms-service-mark">
        <path fill="currentColor" d="M12 4.2 14.2 10H9.8L12 4.2ZM6.7 10l3.1 10L3.8 10h2.9Zm7.5 10 3.1-10h2.9l-6 10ZM17.3 10l-5.3 10-5.3-10h10.6Z" />
      </svg>
    );
  }

  if (kind === "bitbucket") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true" className="ms-service-mark">
        <path fill="currentColor" d="M4 5h16l-2.3 14H6.3L4 5Zm5.2 4.1.8 5.1h4l.8-5.1H9.2Z" />
      </svg>
    );
  }

  if (kind === "slack") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true" className="ms-service-mark">
        <rect x="5" y="2.5" width="4" height="8" rx="2" fill="currentColor" />
        <rect x="8.5" y="5" width="8" height="4" rx="2" fill="currentColor" />
        <rect x="15" y="13.5" width="4" height="8" rx="2" fill="currentColor" />
        <rect x="7.5" y="15" width="8" height="4" rx="2" fill="currentColor" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="ms-service-mark">
      <path d="M4 7h16v10H4z" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
      <path d="M4 8l8 6 8-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function WindowChrome({ title }) {
  return <div className="ms-window__top">{title}</div>;
}

function SectionIntro({ eyebrow, title, subtitle, accent, accentBlock = false, accentMuted = false, accentItalic = false }) {
  return (
    <div className="ms-intro">
      <span className="ms-eyebrow">{eyebrow}</span>
      <h2>
        {title}
        {accent ? <span className={cx(accentBlock && "is-block", accentMuted && "is-muted", accentItalic && "is-italic")}>{accent}</span> : null}
      </h2>
      {subtitle ? <p>{subtitle}</p> : null}
    </div>
  );
}

export function DifferenceSection({ teamSize, onTeamSizeChange }) {
  const manualMinutes = teamSize * 15 * 5;
  const sliderPercent = ((teamSize - 1) / 19) * 100;
  const yearlyHours = Math.round(((manualMinutes - 10) * 52) / 60);

  return (
    <section className="ms-section" id="difference">
      <div className="ms-container ms-container--narrow">
        <SectionIntro
          eyebrow="The difference"
          title="Your team's work, summarized."
          accent="Everyone stays in sync."
          accentBlock
          accentMuted
        />

        <div className="ms-panel ms-compare">
          <div className="ms-compare__controls">
            <label htmlFor="team-size-slider">Team size</label>

            <div className="ms-range">
              <div className="ms-range__track">
                <div className="ms-range__fill" style={{ width: `${sliderPercent}%` }} />
              </div>
              <input
                id="team-size-slider"
                type="range"
                min="1"
                max="20"
                value={teamSize}
                onChange={(event) => onTeamSizeChange(Number(event.target.value))}
                aria-label="Team size"
              />
              <div className="ms-range__thumb" style={{ left: `calc(${sliderPercent}% - 8px)` }} />
            </div>

            <strong>{teamSize}</strong>
          </div>

          <div className="ms-compare__grid">
            <article className="ms-compare-card">
              <div className="ms-compare-card__header">
                <p>Manual updates</p>
                <h3>{comparison.withoutLabel}</h3>
              </div>

              <div className="ms-compare-card__metric">
                <strong>{formatMinutes(manualMinutes)}</strong>
                <span>/ week</span>
              </div>

              <p className="ms-compare-card__formula">15 min × {teamSize} devs × 5 days</p>

              <ul>
                {comparison.painPoints.map((item) => (
                  <li key={item}>
                    <span className="ms-compare-card__cross" aria-hidden="true">{"\u2717"}</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </article>

            <article className="ms-compare-card ms-compare-card--positive">
              <div className="ms-compare-card__header">
                <p>Automated reports</p>
                <h3>{comparison.withLabel}</h3>
              </div>

              <div className="ms-compare-card__metric">
                <strong>~10 min</strong>
                <span>/ week</span>
              </div>

              <p className="ms-compare-card__formula">~2 min/day × 5 days · Same for 1 or 100 devs</p>

              <ul>
                {comparison.benefits.map((item) => (
                  <li key={item}>
                    <CheckIcon />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </article>
          </div>

          <div className="ms-compare__footer">
            <p>
              Save <strong>{formatMinutes(manualMinutes)}</strong> every week — that's <strong>{yearlyHours}+ hours</strong> per year
            </p>

            <a className="ms-button ms-button--primary" href={urls.app} target="_blank" rel="noreferrer">
              Get started free
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}

export function HowItWorksSection() {
  return (
    <section className="ms-section" id="how-it-works">
      <div className="ms-container ms-container--narrow">
        <SectionIntro
          eyebrow="How it works"
          title={"Seriously, it\u2019s that "}
          accent="simple"
          accentItalic
          subtitle={'No complicated onboarding. No sales calls. No "enterprise setup wizard."'}
        />

        <div className="ms-panel ms-steps">
          <div className="ms-steps__grid">
            {howItWorks.steps.map((step) => (
              <article key={step.number} className="ms-step-card">
                <span className="ms-step-card__number">{step.number}</span>
                <h3>{step.title}</h3>
                <p>{step.body}</p>
              </article>
            ))}
          </div>

          <div className="ms-steps__footer">
            <p>Ready to automate your team updates?</p>

            <a className="ms-button ms-button--primary" href={urls.app} target="_blank" rel="noreferrer">
              Get started free
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}

function ConnectPreview() {
  const repositories = [
    { name: "GitHub", meta: "github.com/acme-corp", tone: "dark", kind: "github", status: "Connected", active: true },
    { name: "GitLab", meta: "Cloud & Self-hosted", tone: "orange", kind: "gitlab", action: "Connect" },
    { name: "Bitbucket", meta: "Cloud & Server", tone: "blue", kind: "bitbucket", action: "Connect" },
  ];

  const channels = [
    { name: "Slack", meta: "Connected", tone: "plum", kind: "slack" },
    { name: "Email", meta: "Configured", tone: "slate", kind: "email" },
  ];

  return (
    <div className="ms-window">
      <WindowChrome title={previewTitles.integrations} icon="lock" />

      <div className="ms-window__body">
        <p className="ms-preview-label">Connect your repositories</p>

        <div className="ms-integration-list">
          {repositories.map((item) => (
            <div key={item.name} className={cx("ms-integration-row", item.active && "is-active")}>
              <div className={cx("ms-logo-box", `is-${item.tone}`)} aria-hidden="true">
                <ServiceMark kind={item.kind} />
              </div>

              <div className="ms-integration-row__copy">
                <strong>{item.name}</strong>
                <span>{item.meta}</span>
              </div>

              {item.status ? (
                <span className="ms-status-pill ms-status-pill--success">
                  <span className="ms-status-pill__dot" aria-hidden="true" />
                  <span>{item.status}</span>
                </span>
              ) : (
                <button type="button" className="ms-mini-button">
                  {item.action}
                </button>
              )}
            </div>
          ))}
        </div>

        <div className="ms-delivery-block">
          <p className="ms-preview-label">Delivery channels</p>

          <div className="ms-channel-grid">
            {channels.map((item) => (
              <div key={item.name} className="ms-channel-card">
                <div className={cx("ms-logo-box ms-logo-box--small", `is-${item.tone}`)} aria-hidden="true">
                  <ServiceMark kind={item.kind} />
                </div>
                <div>
                  <strong>{item.name}</strong>
                  <span>{item.meta}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function ReportsPreview() {
  return (
    <div className="ms-window">
      <WindowChrome title={previewTitles.mail} icon="mail" />

      <div className="ms-window__body ms-window__body--tight">
        <div className="ms-mail-meta">
          <div className="ms-mail-meta__row">
            <span className="ms-mail-meta__label">From:</span>
            <strong className="ms-mail-meta__value">{urls.reportsEmail}</strong>
          </div>
          <div className="ms-mail-meta__row">
            <span className="ms-mail-meta__label">Subject:</span>
            <strong className="ms-mail-meta__value">Weekly Development Summary - Week 51</strong>
          </div>
        </div>

        <div className="ms-mail-copy">
          <p>Hi Team,</p>
          <p>
            Here's your weekly development summary. Your team had an exceptionally productive week with <strong>127 commits</strong> across <strong>18 pull requests</strong>.
          </p>
          <p>
            <strong>John</strong> worked on enhancing user interactions with the new authentication flow, while <strong>Sarah</strong> optimized the database queries, improving performance by 40%.
          </p>
          <p className="ms-mail-body__footer">{"Keep up the great work! \uD83D\uDE80"}</p>
        </div>
      </div>
    </div>
  );
}

function MonitoringPreview() {
  const columns = [
    {
      title: "NEW",
      count: 2,
      tone: "blue",
      cards: [
        { title: "Add OAuth integration", meta: "JD · 2h ago" },
        { title: "Update API docs", meta: "SK · 4h ago" },
      ],
    },
    {
      title: "IN PROGRESS",
      count: 2,
      tone: "amber",
      cards: [
        { title: "Optimize queries", meta: "AM" },
        { title: "Fix memory leak", meta: "TC" },
      ],
    },
    {
      title: "MERGED",
      count: 2,
      tone: "green",
      cards: [
        { title: "Auth refactor", meta: "MJ \u2713" },
        { title: "Update deps", meta: "LW \u2713" },
      ],
    },
  ];

  return (
    <div className="ms-window">
      <WindowChrome title={previewTitles.board} icon="lock" />

      <div className="ms-board-grid">
        {columns.map((column) => (
          <div key={column.title} className="ms-board-column">
            <div className="ms-board-column__header">
              <p>{column.title}</p>
              <span className="ms-count-pill">{column.count}</span>
            </div>

            <div className="ms-board-column__stack">
              {column.cards.map((card) => (
                <div key={card.title} className={cx("ms-board-card", `is-${column.tone}`)}>
                  <strong>{card.title}</strong>
                  <span>{card.meta}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ChatPreview() {
  const messages = [
    { side: "user", content: "Is the checkout modal bug fixed?" },
    {
      side: "assistant",
      content: (
        <>
          Yes! The checkout modal bug was fixed in PR #247 by Sarah Chen. It was merged 2 days ago in commit <span className="ms-inline-code">a3b4c5d</span>.
        </>
      ),
    },
    { side: "user", content: "What was the issue?" },
    {
      side: "assistant",
      content: "The modal wasn't closing properly on mobile devices. Sarah fixed it by updating the click handler in the overlay component.",
    },
  ];

  return (
    <div className="ms-window">
      <WindowChrome title={previewTitles.chat} icon="chat" />

      <div className="ms-chat-thread">
        {messages.map((message, index) => (
          <div key={index} className={cx("ms-chat-row", message.side === "user" && "is-user")}>
            <div className={cx("ms-chat-bubble", message.side === "user" ? "ms-chat-bubble--user" : "ms-chat-bubble--assistant")}>{message.content}</div>
          </div>
        ))}
      </div>

      <div className="ms-chat-composer">
        <input type="text" readOnly value="" placeholder="Ask anything about your progress..." aria-label="Ask about your progress" />
        <button type="button" aria-label="Send message">
          <ArrowRightIcon />
        </button>
      </div>
    </div>
  );
}

function FeaturePreview({ featureId }) {
  if (featureId === "connect") {
    return <ConnectPreview />;
  }

  if (featureId === "reports") {
    return <ReportsPreview />;
  }

  if (featureId === "monitoring") {
    return <MonitoringPreview />;
  }

  return <ChatPreview />;
}

export function DetailedFeaturesSection({ activeFeature, onFeatureChange, featureRefs }) {
  const scrollToFeature = (index) => {
    onFeatureChange(index);
    featureRefs.current[index]?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <section className="ms-section ms-section--features" id="features">
      <div className="ms-container ms-container--wide">
        <SectionIntro
          eyebrow="Features"
          title="Let's dive into "
          accent={brand.name}
          accentItalic
          subtitle="Explore each feature in detail with visual examples and real-world use cases."
        />

        <div className="ms-feature-layout">
          <div className="ms-feature-nav-wrap">
            <nav className="ms-feature-nav" aria-label={`${brand.name} feature walkthrough`}>
              {features.map((feature, index) => (
                <button
                  key={feature.id}
                  type="button"
                  className={cx("ms-feature-nav__button", activeFeature === index && "is-active")}
                  onClick={() => scrollToFeature(index)}
                >
                  <span className="ms-feature-nav__dot" />
                  <span>{feature.title}</span>
                </button>
              ))}
            </nav>
          </div>

          <div className="ms-feature-stack">
            {features.map((feature, index) => (
              <article
                key={feature.id}
                ref={(node) => {
                  featureRefs.current[index] = node;
                }}
                className="ms-feature-stage"
                data-feature-index={index}
                style={{
                  "--ms-stack-order": index,
                  "--ms-stack-top": `${feature.stickyTop}px`,
                  "--ms-stack-z": index + 1,
                  minHeight: feature.minHeight,
                }}
              >
                <div className="ms-feature-stage__header">
                  <div className="ms-feature-stage__wash" aria-hidden="true">
                    <div className="ms-feature-stage__wash-shader" data-paper-shader="" />
                  </div>
                  <span className="ms-feature-stage__count">{index + 1}</span>
                  <h3>{feature.title}</h3>
                </div>

                <div className="ms-feature-stage__body">
                  <p>{feature.description}</p>
                  <FeaturePreview featureId={feature.id} />
                </div>

                {index === features.length - 1 ? (
                  <div className="ms-feature-stage__footer">
                    <p>Ready to automate your team updates?</p>

                    <a className="ms-button ms-button--primary" href={urls.app} target="_blank" rel="noreferrer">
                      Get started free
                    </a>
                  </div>
                ) : null}
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

export function UseCasesSection() {
  return (
    <section className="ms-section ms-section--muted" id="use-cases">
      <div className="ms-container ms-container--wide">
        <SectionIntro
          eyebrow="Who it's for"
          title="Built for the whole team"
          subtitle="Faster standups. Better visibility. Everyone wins."
        />

        <div className="ms-panel ms-use-cases">
          <div className="ms-use-cases__grid">
            {useCases.map((useCase, index) => (
              <a key={useCase.title} className={cx("ms-use-case-card", index === 0 && "is-first")} href={useCase.href}>
                <div className="ms-use-case-card__header">
                  <span className="ms-use-case-card__badge" aria-hidden="true">{useCase.emoji}</span>
                  <div>
                    <h3>{useCase.title}</h3>
                    <p className="ms-use-case-card__tagline">{useCase.tagline}</p>
                  </div>
                </div>

                <p className="ms-use-case-card__description">{useCase.description}</p>

                <ul>
                  {useCase.benefits.map((benefit) => (
                    <li key={benefit}>
                      <CheckIcon />
                      <span>{benefit}</span>
                    </li>
                  ))}
                </ul>
              </a>
            ))}
          </div>
        </div>

        <div className="ms-panel ms-stats">
          {useCaseStats.map((stat) => (
            <div key={stat.label} className="ms-stats__item">
              <strong>{stat.value}</strong>
              <span>{stat.label}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default function MiddleSections() {
  const [teamSize, setTeamSize] = useState(5);
  const [activeFeature, setActiveFeature] = useState(0);
  const featureRefs = useRef([]);

  useEffect(() => {
    const nodes = featureRefs.current.filter(Boolean);

    if (!nodes.length) {
      return undefined;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const visibleEntries = entries
          .filter((entry) => entry.isIntersecting)
          .sort((first, second) => second.intersectionRatio - first.intersectionRatio);

        if (!visibleEntries.length) {
          return;
        }

        const nextIndex = Number(visibleEntries[0].target.dataset.featureIndex);
        setActiveFeature((currentIndex) => (currentIndex === nextIndex ? currentIndex : nextIndex));
      },
      {
        rootMargin: "-30% 0px -45% 0px",
        threshold: [0.2, 0.35, 0.5, 0.65],
      },
    );

    nodes.forEach((node) => observer.observe(node));

    return () => observer.disconnect();
  }, []);

  return (
    <div className="middle-sections">
      <DifferenceSection teamSize={teamSize} onTeamSizeChange={setTeamSize} />
      <HowItWorksSection />
      <DetailedFeaturesSection activeFeature={activeFeature} onFeatureChange={setActiveFeature} featureRefs={featureRefs} />
      <UseCasesSection />
    </div>
  );
}
