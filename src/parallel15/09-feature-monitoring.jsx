import "./09-feature-monitoring.css";

const COLUMNS = [
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
      { title: "Auth refactor", meta: "MJ" },
      { title: "Update deps", meta: "LW" },
    ],
  },
];

function cx(...values) {
  return values.filter(Boolean).join(" ");
}

function WindowChrome({ title }) {
  return (
    <div className="feature-monitoring__top">
      <div className="feature-monitoring__dots" aria-hidden="true">
        <span />
        <span />
        <span />
      </div>
      <div className="feature-monitoring__title">{title}</div>
    </div>
  );
}

export default function FeatureMonitoring() {
  return (
    <div className="feature-monitoring" aria-label="Live Monitoring preview">
      <WindowChrome title="app.gitmore.io/board" />

      <div className="feature-monitoring__grid">
        {COLUMNS.map((column) => (
          <div key={column.title} className="feature-monitoring__column">
            <div className="feature-monitoring__column-header">
              <p>{column.title}</p>
              <span className="feature-monitoring__count">{column.count}</span>
            </div>

            <div className="feature-monitoring__stack">
              {column.cards.map((card) => (
                <div key={card.title} className={cx("feature-monitoring__card", `is-${column.tone}`)}>
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
