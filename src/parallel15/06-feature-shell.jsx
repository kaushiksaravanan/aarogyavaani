import { useEffect, useRef, useState } from "react";
import "./06-feature-shell.css";

const DEFAULT_FEATURES = [
  {
    id: "connect",
    title: "Connect Your Stack",
    description:
      "Gitmore works with the tools you already love. GitHub, GitLab, or Bitbucket - connecting takes just a few clicks.",
  },
  {
    id: "reports",
    title: "Automated Reports",
    description:
      "Set up once, receive intelligent summaries automatically. Come to standups prepared with all the context you need.",
  },
  {
    id: "monitoring",
    title: "Live Monitoring",
    description:
      "Track all your commits and pull requests across repositories with a live monitoring board.",
  },
  {
    id: "chat",
    title: "AI Chat Assistant",
    description:
      "Ask questions about your progress, pull requests, or commits. Get instant answers in Slack or on Gitmore.",
  },
];

function cx(...values) {
  return values.filter(Boolean).join(" ");
}

function SectionIntro({ eyebrow, title, accent, subtitle }) {
  return (
    <div className="p15fs-intro">
      <span className="p15fs-eyebrow">{eyebrow}</span>
      <h2>
        {title}
        {accent ? <span>{accent}</span> : null}
      </h2>
      {subtitle ? <p>{subtitle}</p> : null}
    </div>
  );
}

export default function FeatureShellSection({
  features = DEFAULT_FEATURES,
  eyebrow = "Features",
  title = "Let's dive into",
  accent = "Gitmore",
  subtitle = "Explore each feature in detail with visual examples and real-world use cases.",
  sectionId = "features-detailed",
  renderStage,
}) {
  const [activeFeature, setActiveFeature] = useState(0);
  const stageRefs = useRef([]);

  useEffect(() => {
    const handleScroll = () => {
      const viewportHeight = window.innerHeight;
      let nextActive = activeFeature;

      stageRefs.current.forEach((node, index) => {
        if (!node) {
          return;
        }

        const rect = node.getBoundingClientRect();

        if (rect.top < viewportHeight * 0.5 && rect.bottom > viewportHeight * 0.3) {
          nextActive = index;
        }
      });

      if (nextActive !== activeFeature) {
        setActiveFeature(nextActive);
      }
    };

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => window.removeEventListener("scroll", handleScroll);
  }, [activeFeature, features]);

  const scrollToFeature = (index) => {
    setActiveFeature(index);
    stageRefs.current[index]?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <section className="feature-shell-section" id={sectionId}>
      <div className="p15fs-container">
        <SectionIntro eyebrow={eyebrow} title={title} accent={accent} subtitle={subtitle} />

        <div className="p15fs-layout">
          <div className="p15fs-nav-wrap">
            <nav className="p15fs-nav" aria-label="Feature walkthrough">
              {features.map((feature, index) => (
                <button
                  key={feature.id}
                  type="button"
                  className={cx("p15fs-nav__button", activeFeature === index && "is-active")}
                  onClick={() => scrollToFeature(index)}
                >
                  <span className="p15fs-nav__dot" />
                  <span>{feature.title}</span>
                </button>
              ))}
            </nav>
          </div>

          <div className="p15fs-stack">
            {features.map((feature, index) => (
              <article
                key={feature.id}
                ref={(node) => {
                  stageRefs.current[index] = node;
                }}
                className="p15fs-stage"
                style={{
                  "--p15fs-stack-order": index,
                  minHeight: index === features.length - 1 ? "44rem" : "33rem",
                }}
              >
                <div className="p15fs-stage__header">
                  <div className="p15fs-stage__wash" aria-hidden="true" />
                  <span className="p15fs-stage__count">{index + 1}</span>
                  <h3>{feature.title}</h3>
                </div>

                <div className="p15fs-stage__body">
                  {feature.description ? <p>{feature.description}</p> : null}
                  {renderStage ? (
                    renderStage(feature, index)
                  ) : (
                    <div className="p15fs-stage__placeholder" aria-hidden="true">
                      <div className="p15fs-stage__surface" />
                    </div>
                  )}
                </div>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
