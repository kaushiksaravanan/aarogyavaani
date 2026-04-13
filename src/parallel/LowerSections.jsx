import { useState } from "react";
import {
  brand,
  urls,
  social,
  badges,
  legal,
  pricingPlans,
  faqItems,
  footerGroups,
} from "../siteConfig";
import "./lower-sections.css";

function formatPrice(value) {
  if (value === 0) {
    return "0";
  }

  return Number.isInteger(value) ? String(value) : value.toFixed(2);
}

function getSavings(plan) {
  if (plan.isFree) {
    return null;
  }

  const savings = Math.round((plan.monthlyPrice * 12 - plan.yearlyPrice) * 100) / 100;
  return savings > 0 ? `Save $${formatPrice(savings)}` : null;
}

function CheckIcon() {
  return <span aria-hidden="true" className="lower-sections__check-icon">{"\u2713"}</span>;
}

function XIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="lower-sections__social-icon">
      <path d="M18.9 3H21l-4.6 5.26L21.8 21h-4.24l-3.32-4.73L10.1 21H8l4.92-5.62L7.7 3h4.35l3 4.28L18.9 3Zm-1.49 16.42h1.17L11.06 4.5H9.8l7.61 14.92Z" fill="currentColor" />
    </svg>
  );
}

function LinkedInIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="lower-sections__social-icon">
      <path d="M19 0H5C2.24 0 0 2.24 0 5v14c0 2.76 2.24 5 5 5h14c2.76 0 5-2.24 5-5V5c0-2.76-2.24-5-5-5ZM8 19H5V8h3v11ZM6.5 6.73A1.76 1.76 0 1 1 6.5 3.2a1.76 1.76 0 0 1 0 3.53ZM20 19h-3v-5.6c0-3.37-4-3.11-4 0V19h-3V8h3v1.77c1.4-2.59 7-2.78 7 2.47V19Z" fill="currentColor" />
    </svg>
  );
}

function useLowerSectionsState(controlledValue, controlledSetter, defaultValue) {
  const [localValue, setLocalValue] = useState(defaultValue);
  const isControlled = typeof controlledSetter === "function" && controlledValue !== undefined;

  return [isControlled ? controlledValue : localValue, isControlled ? controlledSetter : setLocalValue];
}

function PricingCard({ plan, yearlyBilling }) {
  const price = plan.isFree ? 0 : yearlyBilling ? plan.yearlyPrice : plan.monthlyPrice;
  const savings = yearlyBilling ? getSavings(plan) : null;

  return (
    <article className={`lower-plan-card${plan.popular ? " is-popular" : ""}`}>
      {plan.popular ? <div className="lower-plan-card__badge">Most Popular</div> : null}
      <div className="lower-plan-card__header">
        <h3>{plan.name}</h3>
        <p>{plan.description}</p>
      </div>

      <div className="lower-plan-card__price-row">
        <span className="lower-plan-card__price">${formatPrice(price)}</span>
        <span className="lower-plan-card__period">{plan.isFree ? "forever" : yearlyBilling ? "/year" : "/month"}</span>
      </div>

      {savings ? <div className="lower-plan-card__savings">{savings}</div> : null}

      <ul className="lower-plan-card__features">
        {plan.features.map((feature) => (
          <li key={feature}>
            <CheckIcon />
            <span>{feature}</span>
          </li>
        ))}
      </ul>

      <a href={urls.app} target="_blank" rel="noopener noreferrer" className={`lower-sections__button lower-sections__button--full${plan.popular ? " lower-sections__button--inverted" : " lower-sections__button--muted"}`}>
        {plan.cta}
      </a>

      {plan.isFree ? <p className="lower-plan-card__fine-print">*No credit card required</p> : null}
    </article>
  );
}

export function PricingSection({ yearlyBilling: controlledYearlyBilling, setYearlyBilling: controlledSetYearlyBilling }) {
  const [yearlyBilling, setYearlyBilling] = useLowerSectionsState(controlledYearlyBilling, controlledSetYearlyBilling, false);
  const toggleBilling = () => setYearlyBilling((value) => !value);
  const setBillingPeriod = (period) => setYearlyBilling(period === "yearly");

  return (
    <section id="pricing" className="lower-section lower-section--pricing">
      <div className="lower-sections__container lower-sections__container--wide">
        <div className="lower-sections__intro">
          <span className="lower-sections__eyebrow">Pricing</span>
          <h2>
            Simple, transparent
            <br />
            pricing
          </h2>
          <p>Choose the plan that fits your team. Upgrade or downgrade anytime.</p>
        </div>

        <div className="lower-billing-toggle" role="group" aria-label="Billing period selector">
          <button
            type="button"
            className={`lower-billing-toggle__label${!yearlyBilling ? " is-active" : ""}`}
            aria-pressed={!yearlyBilling}
            onClick={() => setBillingPeriod("monthly")}
          >
            Monthly
          </button>
          <button
            type="button"
            className="lower-billing-toggle__button"
            aria-label="Toggle billing period"
            role="switch"
            aria-checked={yearlyBilling}
            onClick={toggleBilling}
          >
            <span className={`lower-billing-toggle__thumb${yearlyBilling ? " is-yearly" : ""}`} />
          </button>
          <button
            type="button"
            className={`lower-billing-toggle__label${yearlyBilling ? " is-active" : ""}`}
            aria-pressed={yearlyBilling}
            onClick={() => setBillingPeriod("yearly")}
          >
            Yearly
          </button>
          <span className="lower-billing-toggle__save">Save 17%</span>
        </div>

        <div className="lower-plan-grid">
          {pricingPlans.map((plan) => (
            <PricingCard key={plan.name} plan={plan} yearlyBilling={yearlyBilling} />
          ))}
        </div>

        <p className="lower-pricing__footer-note">
          <span>Prices excl. VAT where applicable.</span>
        </p>
      </div>
    </section>
  );
}

export function FaqSection({ openFaq: controlledOpenFaq, setOpenFaq: controlledSetOpenFaq }) {
  const [openFaq, setOpenFaq] = useLowerSectionsState(controlledOpenFaq, controlledSetOpenFaq, null);

  return (
    <section id="faq" className="lower-section lower-section--faq">
      <div className="lower-sections__container lower-sections__container--faq">
        <div className="lower-faq-layout">
          <div className="lower-faq-copy">
            <h2>
              Frequently asked
              <br />
              questions
            </h2>
            <p>Everything you need to know about {brand.name}.</p>
            <div className="lower-faq-copy__contact">
              <p>
                Have another question? Contact us on <a href={social.twitter.url} target="_blank" rel="noopener noreferrer">{social.twitter.label}</a> or by <a href={`mailto:${urls.supportEmail}`}>email</a>.
              </p>
            </div>
          </div>

          <div className="lower-faq-list" role="list">
            {faqItems.map((item, index) => {
              const isOpen = openFaq === index;

              return (
                <div key={item.question} className={`lower-faq-item${isOpen ? " is-open" : ""}`}>
                  <button
                    type="button"
                    className="lower-faq-item__trigger"
                    aria-expanded={isOpen}
                    aria-controls={`lower-faq-panel-${index}`}
                    onClick={() => setOpenFaq(isOpen ? null : index)}
                  >
                    <span>{item.question}</span>
                    <span className="lower-faq-item__icon">+</span>
                  </button>
                  <div id={`lower-faq-panel-${index}`} className="lower-faq-item__panel">
                    <div>
                      <p>{item.answer}</p>
                    </div>
                  </div>
                </div>
              );
            })}
            <div className="lower-faq-list__end" aria-hidden="true" />
          </div>
        </div>
      </div>
    </section>
  );
}

export function FinalCtaSection() {
  return (
    <section id="cta" className="lower-section lower-section--cta">
      <div className="lower-sections__cta-surface" />
      <div className="lower-sections__container lower-sections__container--cta">
        <div className="lower-final-cta">
          <h2>Start from a stronger base</h2>
          <p>
            Rebrand the starter, wire the providers you need, and spend your energy on the workflow that makes the product worth paying for.
          </p>
          <a href={`${urls.app}/`} target="_blank" rel="noopener noreferrer" className="lower-sections__button lower-sections__button--dark">
            Use this template
          </a>
        </div>
      </div>
    </section>
  );
}

export function LowerSectionsFooter() {
  return (
    <footer className="lower-footer">
      <div className="lower-sections__container lower-sections__container--wide">
        <div className="lower-footer__main">
          <div className="lower-footer__brand-block">
            <a className="lower-footer__brand" href="/">
              {brand.name}
            </a>
            <p>
              {brand.tagline} To contact us, please email at{" "}
              <a className="lower-footer__inline-link" href={`mailto:${urls.supportEmail}`}>
                {urls.supportEmail}
              </a>
            </p>
            <div className="lower-footer__badges">
              {badges.map((badge) => (
                <a key={badge.alt} href={badge.href} target="_blank" rel="noopener noreferrer">
                  <img src={badge.src} alt={badge.alt} loading="lazy" />
                </a>
              ))}
            </div>
          </div>

          <div className="lower-footer__nav-grid">
            {footerGroups.map((group) => (
              <div key={group.title} className="lower-footer__group">
                <h3>{group.title}</h3>
                <nav>
                  {group.links.map((link) => (
                    <a key={link.label} href={link.href}>
                      {link.label}
                    </a>
                  ))}
                </nav>
              </div>
            ))}
          </div>
        </div>

        <div className="lower-footer__bottom">
          <p>{legal.copyright}</p>
          <div className="lower-footer__socials">
            <a href={social.twitter.url} target="_blank" rel="noopener noreferrer" aria-label={`${brand.name} on ${social.twitter.label}`}>
              <span className="sr-only">{brand.name} on {social.twitter.label}</span>
              <XIcon />
            </a>
            <a href={social.linkedin.url} target="_blank" rel="noopener noreferrer" aria-label={`${brand.name} on ${social.linkedin.label}`}>
              <span className="sr-only">{brand.name} on {social.linkedin.label}</span>
              <LinkedInIcon />
            </a>
          </div>
        </div>
      </div>

      <div className="lower-footer__wordmark-wrap" aria-hidden="true">
        <h2 className="lower-footer__wordmark">{brand.domain}</h2>
      </div>
    </footer>
  );
}

export default function LowerSections(props) {
  return (
    <div className="lower-sections">
      <PricingSection yearlyBilling={props.yearlyBilling} setYearlyBilling={props.setYearlyBilling} />
      <FaqSection openFaq={props.openFaq} setOpenFaq={props.setOpenFaq} />
      <FinalCtaSection />
      <LowerSectionsFooter />
    </div>
  );
}
