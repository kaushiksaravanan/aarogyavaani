import "./08-feature-reports.css";

function WindowChrome() {
  return (
    <div className="parallel15-feature-reports__top">
      <div className="parallel15-feature-reports__dots" aria-hidden="true">
        <span />
        <span />
        <span />
      </div>
      <div className="parallel15-feature-reports__title">mail.google.com</div>
    </div>
  );
}

export default function Parallel15FeatureReports08() {
  return (
    <section className="parallel15-feature-reports" aria-label="Automated Reports preview">
      <div className="parallel15-feature-reports__window">
        <WindowChrome />

        <div className="parallel15-feature-reports__body">
          <div className="parallel15-feature-reports__meta">
            <div>
              <span>From:</span>
              <strong>reports@gitmore.io</strong>
            </div>
            <div>
              <span>Subject:</span>
              <strong>Weekly Development Summary - Week 51</strong>
            </div>
          </div>

          <div className="parallel15-feature-reports__mail">
            <p>Hi Team,</p>
            <p>
              Here's your weekly development summary. Your team had an exceptionally productive
              week with <strong>127 commits</strong> across <strong>18 pull requests</strong>.
            </p>
            <p>
              <strong>John</strong> worked on enhancing user interactions with the new
              authentication flow, while <strong>Sarah</strong> optimized the database queries,
              improving performance by 40%.
            </p>
            <p className="parallel15-feature-reports__footer">Keep up the great work!</p>
          </div>
        </div>
      </div>
    </section>
  );
}
