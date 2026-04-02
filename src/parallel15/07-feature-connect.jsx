import "./07-feature-connect.css";

const REPOSITORIES = [
  { name: "GitHub", meta: "github.com/acme-corp", tone: "dark", status: "Connected", active: true },
  { name: "GitLab", meta: "Cloud & Self-hosted", tone: "orange", action: "Connect" },
  { name: "Bitbucket", meta: "Cloud & Server", tone: "blue", action: "Connect" },
];

const CHANNELS = [
  { name: "Slack", meta: "Connected", tone: "plum" },
  { name: "Email", meta: "Configured", tone: "slate" },
];

function cx(...values) {
  return values.filter(Boolean).join(" ");
}

function WindowChrome({ title }) {
  return (
    <div className="fc15-window__top">
      <div className="fc15-window__dots" aria-hidden="true">
        <span />
        <span />
        <span />
      </div>
      <div className="fc15-window__title">{title}</div>
    </div>
  );
}

export function FeatureConnectPreview() {
  return (
    <section className="fc15-preview" aria-label="Connect Your Stack preview">
      <div className="fc15-window">
        <WindowChrome title="app.gitmore.io/integrations" />

        <div className="fc15-window__body">
          <p className="fc15-preview-label">Connect your repositories</p>

          <div className="fc15-integration-list">
            {REPOSITORIES.map((item) => (
              <div key={item.name} className={cx("fc15-integration-row", item.active && "is-active")}>
                <div className={cx("fc15-logo-box", `is-${item.tone}`)}>{item.name.slice(0, 2)}</div>

                <div className="fc15-integration-row__copy">
                  <strong>{item.name}</strong>
                  <span>{item.meta}</span>
                </div>

                {item.status ? (
                  <span className="fc15-status-pill fc15-status-pill--success">{item.status}</span>
                ) : (
                  <button type="button" className="fc15-mini-button">
                    {item.action}
                  </button>
                )}
              </div>
            ))}
          </div>

          <div className="fc15-delivery-block">
            <p className="fc15-preview-label">Delivery channels</p>

            <div className="fc15-channel-grid">
              {CHANNELS.map((item) => (
                <div key={item.name} className="fc15-channel-card">
                  <div className={cx("fc15-logo-box fc15-logo-box--small", `is-${item.tone}`)}>{item.name.slice(0, 2)}</div>
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
    </section>
  );
}

export default FeatureConnectPreview;
