import "./05-how-it-works.css";

const STEPS = [
  {
    number: "01",
    title: "Connect Your Repo",
    body: "With one click, we set up webhooks automatically. No configuration files, no YAML hell.",
  },
  {
    number: "02",
    title: "We Watch Your Activity",
    body: "Every commit, PR, and merge gets tracked. No manual updates needed. Your Git activity speaks for itself.",
  },
  {
    number: "03",
    title: "You Get Answers",
    body: "Check your dashboard, ask our AI, or wait for your weekly/daily email. Your choice - we're not pushy about it.",
  },
];

function ArrowRightIcon() {
  return (
    <svg viewBox="0 0 20 20" aria-hidden="true" className="parallel15-how-it-works__icon">
      <path d="M4 10h11" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
      <path d="M11 4l5 6-5 6" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default function HowItWorks05() {
  return (
    <section className="parallel15-how-it-works" id="how-it-works">
      <div className="parallel15-how-it-works__container">
        <div className="parallel15-how-it-works__intro">
          <span className="parallel15-how-it-works__eyebrow">How it works</span>
          <h2>Seriously, it's that simple</h2>
          <p>No complicated onboarding. No sales calls. No "enterprise setup wizard."</p>
        </div>

        <div className="parallel15-how-it-works__panel">
          <div className="parallel15-how-it-works__grid">
            {STEPS.map((step) => (
              <article key={step.number} className="parallel15-how-it-works__card">
                <span className="parallel15-how-it-works__number">{step.number}</span>
                <h3>{step.title}</h3>
                <p>{step.body}</p>
              </article>
            ))}
          </div>

          <div className="parallel15-how-it-works__footer">
            <p>Ready to automate your team updates?</p>
            <a className="parallel15-how-it-works__cta" href="#cta">
              Get started free
              <ArrowRightIcon />
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
