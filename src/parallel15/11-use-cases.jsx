import "./11-use-cases.css";

const USE_CASES = [
  {
    title: "Developers",
    badge: "DE",
    tagline: "Code speaks. You don't have to.",
    description: "Push code, get recognized. Your commits tell the story - no status updates needed.",
    benefits: ["Automatic activity tracking", "Leaderboard recognition", "Zero reporting overhead"],
  },
  {
    title: "Engineering Managers",
    badge: "EM",
    tagline: "See everything. Micromanage nothing.",
    description: "Get complete visibility into team progress without interrupting flow states.",
    benefits: ["AI-generated summaries", "Spot blockers early", "Data-driven 1:1s"],
  },
  {
    title: "Product Managers",
    badge: "PM",
    tagline: "Real-time insights, zero interruptions.",
    description: "Know what shipped, what's in progress, and what's blocked - without asking.",
    benefits: ["Automated progress reports", "Feature tracking", "Release visibility"],
  },
  {
    title: "CTOs & Founders",
    badge: "CX",
    tagline: "High-level visibility. Low-level effort.",
    description: "Understand engineering velocity across all repos without manual reports.",
    benefits: ["Executive summaries", "Cross-team insights", "Strategic visibility"],
  },
];

const USE_CASE_STATS = [
  { value: "3x", label: "Faster reporting with AI" },
  { value: "50%", label: "Shorter standup meetings" },
  { value: "100%", label: "Visibility into team activity" },
];

function CheckIcon() {
  return (
    <svg viewBox="0 0 16 16" aria-hidden="true" className="p15-use-cases__check-icon">
      <path d="M3.25 8.25 6.4 11.4 12.75 5.05" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function UseCasesSection() {
  return (
    <section className="p15-use-cases" id="use-cases">
      <div className="p15-use-cases__container">
        <div className="p15-use-cases__intro">
          <p className="p15-use-cases__eyebrow">Who it's for</p>
          <h2>Built for the whole team</h2>
          <p className="p15-use-cases__subtitle">Faster standups. Better visibility. Everyone wins.</p>
        </div>

        <div className="p15-use-cases__panel">
          <div className="p15-use-cases__grid">
            {USE_CASES.map((useCase) => (
              <article key={useCase.title} className="p15-use-cases__card">
                <div className="p15-use-cases__card-header">
                  <span className="p15-use-cases__badge">{useCase.badge}</span>
                  <div>
                    <h3>{useCase.title}</h3>
                    <p className="p15-use-cases__tagline">{useCase.tagline}</p>
                  </div>
                </div>

                <p className="p15-use-cases__description">{useCase.description}</p>

                <ul className="p15-use-cases__benefits">
                  {useCase.benefits.map((benefit) => (
                    <li key={benefit}>
                      <CheckIcon />
                      <span>{benefit}</span>
                    </li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        </div>

        <div className="p15-use-cases__stats" aria-label="Use case outcomes">
          {USE_CASE_STATS.map((stat) => (
            <div key={stat.label} className="p15-use-cases__stat-item">
              <strong>{stat.value}</strong>
              <span>{stat.label}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default UseCasesSection;
