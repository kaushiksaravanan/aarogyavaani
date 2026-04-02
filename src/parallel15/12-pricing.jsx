import { useState } from "react";
import "./12-pricing.css";

const PRICING_PLANS = [
  {
    name: "Free",
    monthlyPrice: 0,
    yearlyPrice: 0,
    description: "Perfect for getting started with Gitmore",
    features: ["1 integration", "50 AI credits/month", "Leaderboard access"],
    cta: "Get Started",
    popular: false,
    isFree: true,
  },
  {
    name: "Pro",
    monthlyPrice: 8.99,
    yearlyPrice: 89.9,
    description: "For professional developers and small teams",
    features: [
      "5 repositories",
      "5 automations",
      "100 AI credits/month",
      "Leaderboard access",
      "Monitoring Board",
    ],
    cta: "Get Started",
    popular: true,
    isFree: false,
  },
  {
    name: "Enterprise",
    monthlyPrice: 30,
    yearlyPrice: 300,
    description: "For teams that need full control",
    features: [
      "20 repositories",
      "20 automations",
      "500 AI credits/month",
      "Leaderboard access",
      "Monitoring Board",
      "Custom Automations",
    ],
    cta: "Get Started",
    popular: false,
    isFree: false,
  },
];

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
  return (
    <svg viewBox="0 0 16 16" aria-hidden="true" className="p15-pricing__check-icon">
      <path d="M3.25 8.25 6.4 11.4 12.75 5.05" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function PricingCard({ plan, yearlyBilling }) {
  const price = plan.isFree ? 0 : yearlyBilling ? plan.yearlyPrice : plan.monthlyPrice;
  const savings = yearlyBilling ? getSavings(plan) : null;

  return (
    <article className={`p15-pricing-card${plan.popular ? " is-popular" : ""}`}>
      {plan.popular ? <div className="p15-pricing-card__badge">Most Popular</div> : null}

      <div className="p15-pricing-card__header">
        <h3>{plan.name}</h3>
        <p>{plan.description}</p>
      </div>

      <div className="p15-pricing-card__price-row">
        <span className="p15-pricing-card__price">${formatPrice(price)}</span>
        <span className="p15-pricing-card__period">{plan.isFree ? "forever" : yearlyBilling ? "/year" : "/month"}</span>
      </div>

      {savings ? <div className="p15-pricing-card__savings">{savings}</div> : <div className="p15-pricing-card__savings" aria-hidden="true" />}

      <ul className="p15-pricing-card__features">
        {plan.features.map((feature) => (
          <li key={feature}>
            <CheckIcon />
            <span>{feature}</span>
          </li>
        ))}
      </ul>

      <a
        href="https://app.gitmore.io"
        target="_blank"
        rel="noopener noreferrer"
        className={`p15-pricing__button p15-pricing__button--full${plan.popular ? " p15-pricing__button--inverted" : " p15-pricing__button--muted"}`}
      >
        {plan.cta}
      </a>

      {plan.isFree ? <p className="p15-pricing-card__fine-print">*No credit card required</p> : null}
    </article>
  );
}

export default function PricingSection12({
  yearlyBilling: controlledYearlyBilling,
  setYearlyBilling: controlledSetYearlyBilling,
}) {
  const [localYearlyBilling, setLocalYearlyBilling] = useState(false);
  const isControlled = typeof controlledSetYearlyBilling === "function" && controlledYearlyBilling !== undefined;
  const yearlyBilling = isControlled ? controlledYearlyBilling : localYearlyBilling;
  const setYearlyBilling = isControlled ? controlledSetYearlyBilling : setLocalYearlyBilling;

  return (
    <section id="pricing" className="p15-pricing-section">
      <div className="p15-pricing__container">
        <div className="p15-pricing__intro">
          <span className="p15-pricing__eyebrow">Pricing</span>
          <h2>
            Simple, transparent
            <br />
            pricing
          </h2>
          <p>Choose the plan that fits your team. Upgrade or downgrade anytime.</p>
        </div>

        <div className="p15-billing-toggle" role="group" aria-label="Billing period selector">
          <span className={!yearlyBilling ? "is-active" : undefined}>Monthly</span>
          <button
            type="button"
            className="p15-billing-toggle__button"
            aria-label="Toggle billing period"
            role="switch"
            aria-checked={yearlyBilling}
            onClick={() => setYearlyBilling((value) => !value)}
          >
            <span className={`p15-billing-toggle__thumb${yearlyBilling ? " is-yearly" : ""}`} />
          </button>
          <span className={yearlyBilling ? "is-active" : undefined}>Yearly</span>
          <span className="p15-billing-toggle__save">Save 17%</span>
        </div>

        <div className="p15-pricing-grid">
          {PRICING_PLANS.map((plan) => (
            <PricingCard key={plan.name} plan={plan} yearlyBilling={yearlyBilling} />
          ))}
        </div>

        <p className="p15-pricing__footer-note">Prices excl. VAT where applicable.</p>
      </div>
    </section>
  );
}
