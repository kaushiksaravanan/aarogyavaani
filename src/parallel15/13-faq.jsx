import { useState } from "react";
import "./13-faq.css";

const FAQ_ITEMS = [
  {
    question: "Which repositories and platforms do you support?",
    answer:
      "We support GitHub, GitLab, and Bitbucket - including both cloud-hosted and self-hosted/enterprise versions. You can connect private and public repositories. We work with GitHub.com, GitHub Enterprise, GitLab.com, self-hosted GitLab, Bitbucket Cloud, and Bitbucket Server.",
  },
  {
    question: "What tools integrate GitHub with Slack for team reporting?",
    answer:
      "Gitmore integrates with both GitHub and Slack to deliver automated team reports. Unlike basic GitHub-Slack integrations that just forward notifications, Gitmore uses AI to aggregate and summarize all activity into meaningful reports - daily digests, weekly summaries, or custom schedules - delivered directly to your Slack channels.",
  },
  {
    question: "How can CTOs get visibility into engineering progress?",
    answer:
      "Gitmore gives CTOs and engineering leaders high-level visibility across all repositories without requiring manual reports from team leads. You get AI-generated summaries of development velocity, what features shipped, blockers, and team contributions - all extracted automatically from Git activity and delivered on your schedule.",
  },
  {
    question: "How do I connect my GitHub repository to Gitmore?",
    answer:
      "You can connect GitHub repositories in two ways: 1) OAuth integration - sign in with GitHub and select repositories to connect automatically, or 2) Manual webhook setup - add a webhook URL to your repository settings. Both methods take under 2 minutes and you'll start receiving data immediately.",
  },
  {
    question: "How does the AI analysis work and what insights do I get?",
    answer:
      "Our LLM analyzes webhook event metadata including commit messages, pull request descriptions, file names, and author information to categorize work into features, bug fixes, refactoring, documentation, and more. You'll receive intelligent summaries of team progress, development velocity metrics, and project insights via email or Slack - all without accessing your actual source code.",
  },
  {
    question: "What is Gitmind and how does it help?",
    answer:
      "Gitmind is Gitmore's AI chat agent that lets you ask questions about your repository activity in natural language. You can ask things like 'What did the team ship last week?', 'Show me all bug fixes in the last month', or 'Who worked on the authentication feature?' - and get instant, accurate answers based on your Git history.",
  },
  {
    question: "How secure are webhook integrations?",
    answer:
      "We implement enterprise-grade security measures including webhook signature verification. All webhook payloads are validated and processed in isolated environments. We only access event metadata (commit messages, PR titles, author info, timestamps) - never your actual source code or code changes. This ensures complete privacy of your codebase while providing valuable development insights.",
  },
  {
    question: "Does Gitmore access my source code?",
    answer:
      "No, Gitmore never accesses your source code. We only receive and process webhook event metadata - commit messages, PR titles and descriptions, author information, file names, and timestamps. Your actual code changes, file contents, and repository files remain completely private and are never transmitted to our servers.",
  },
  {
    question: "Is there a free plan available?",
    answer:
      "Yes, Gitmore offers a free forever plan that includes 1 repository integration, 50 AI credits/month, and Leaderboard access. No credit card required. Upgrade anytime to unlock more repositories, automations, and features.",
  },
  {
    question: "Can I cancel or downgrade my plan at any time?",
    answer:
      "Yes, you can cancel or downgrade your plan at any time from your account settings. There are no long-term contracts or cancellation fees. If you downgrade, you'll retain access to your current plan until the end of your billing period.",
  },
];

export default function Faq13() {
  const [openItem, setOpenItem] = useState(0);

  return (
    <section className="parallel15-faq" id="faq">
      <div className="parallel15-faq__container">
        <div className="parallel15-faq__layout">
          <div className="parallel15-faq__copy">
            <h2>Frequently asked questions</h2>
            <p>Everything you need to know about Gitmore.</p>

            <p className="parallel15-faq__contact">
              Have another question? Contact us on
              {" "}
              <a href="https://x.com/gitmore_io" target="_blank" rel="noreferrer">
                X (Twitter)
              </a>
              {" "}
              or by
              {" "}
              <a href="mailto:support@gitmore.io">email</a>.
            </p>
          </div>

          <div className="parallel15-faq__list" role="list">
            {FAQ_ITEMS.map((item, index) => {
              const isOpen = index === openItem;

              return (
                <article
                  key={item.question}
                  className={`parallel15-faq__item${isOpen ? " is-open" : ""}`}
                >
                  <button
                    type="button"
                    className="parallel15-faq__trigger"
                    aria-expanded={isOpen}
                    aria-controls={`parallel15-faq-panel-${index}`}
                    onClick={() => setOpenItem(isOpen ? -1 : index)}
                  >
                    <span>{item.question}</span>
                    <span className="parallel15-faq__icon" aria-hidden="true">
                      +
                    </span>
                  </button>

                  <div id={`parallel15-faq-panel-${index}`} className="parallel15-faq__panel">
                    <div>
                      <p>{item.answer}</p>
                    </div>
                  </div>
                </article>
              );
            })}

            <div className="parallel15-faq__list-end" aria-hidden="true" />
          </div>
        </div>
      </div>
    </section>
  );
}
