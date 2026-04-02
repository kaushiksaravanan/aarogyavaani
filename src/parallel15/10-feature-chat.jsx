import "./10-feature-chat.css";

const MESSAGES = [
  { side: "user", text: "Is the checkout modal bug fixed?" },
  {
    side: "assistant",
    text: "Yes! The checkout modal bug was fixed in PR #247 by Sarah Chen. It was merged 2 days ago in commit a3b4c5d.",
  },
  { side: "user", text: "What was the issue?" },
  {
    side: "assistant",
    text: "The modal wasn't closing properly on mobile devices. Sarah fixed it by updating the click handler in the overlay component.",
  },
];

function cx(...values) {
  return values.filter(Boolean).join(" ");
}

function ArrowRightIcon() {
  return (
    <svg viewBox="0 0 20 20" aria-hidden="true" className="p15-chat__icon">
      <path d="M4 10h11" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
      <path d="M11 4l5 6-5 6" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function WindowChrome() {
  return (
    <div className="p15-chat__top">
      <div className="p15-chat__dots" aria-hidden="true">
        <span />
        <span />
        <span />
      </div>
      <div className="p15-chat__title">app.gitmore.io/chat</div>
    </div>
  );
}

export default function FeatureChatPreview() {
  return (
    <div className="p15-chat">
      <WindowChrome />

      <div className="p15-chat__thread">
        {MESSAGES.map((message) => (
          <div key={message.text} className={cx("p15-chat__row", message.side === "user" && "is-user")}>
            <div className={cx("p15-chat__bubble", message.side === "user" ? "p15-chat__bubble--user" : "p15-chat__bubble--assistant")}>
              {message.text}
            </div>
          </div>
        ))}
      </div>

      <div className="p15-chat__input">
        <input type="text" readOnly value="" placeholder="Ask anything about your progress..." aria-label="Ask about your progress" />
        <button type="button" aria-label="Send message">
          <ArrowRightIcon />
        </button>
      </div>
    </div>
  );
}
