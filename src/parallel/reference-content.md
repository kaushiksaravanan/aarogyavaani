# Gitmore Landing Page Reference Content

This file captures the exact visible copy and section structure from the saved Gitmore landing page reference so another agent can rebuild it closely.

## 1. Header

- Logo text: `gitmore.io`
- Nav labels:
  - `Features`
  - `Use Cases`
  - `How It Works`
  - `Pricing`
- Header CTA label: `Get Started`

## 2. Hero

- Eyebrow: none visible
- Headline:

  `Git Reporting Tool`

  `Keep Everyone Updated`

  Visible styling emphasis:
  - `Git Reporting` is italicized
  - `Everyone` is italicized

- Paragraph:

  `Turns your commits and PRs into clear team updates delivered daily or weekly to Slack or email.`

- Supporting line:

  `Works with Github, Gitlab, and Bitbucket.`

- CTA labels:
  - `Get Started Free`
  - `View Demo Report`
- Small supporting note under CTAs:

  `No credit card required`

- Hero embed description:

  Embedded iframe demo titled `Connect a GitHub Repository and Set Up Automated Email Updates`

## 3. The Difference

- Eyebrow: `The difference`
- Heading:

  `Your team's work, summarized.`

  `Everyone stays in sync.`

- Subheading: none visible beyond the muted second line in the heading
- Slider:
  - Label: `Team size`
  - Range: `1` to `20`
  - Default visible value: `5`
  - Manual time formula: `15 min × [team size] devs × 5 days`
  - Manual weekly value behavior: `15 * team size * 5` minutes, displayed as minutes or `Xh Ym`
  - Automated weekly value stays: `~10 min / week`
  - Footer savings line updates from the manual time value and shows yearly hours as `Math.round((manualMinutes - 10) * 52 / 60) + hours`

### Left card

- Label: `Manual updates`
- Title: `Without Gitmore`
- Value at default team size 5: `6h 15m / week`
- Supporting formula line: `15 min × 5 devs × 5 days`
- Bullets:
  - `Long standups with unclear progress updates`
  - `Manually writing status updates and reports`
  - `Chasing team members for progress updates`
  - `Stakeholders asking "what shipped this week?"`

### Right card

- Label: `Automated reports`
- Title: `With Gitmore`
- Value: `~10 min / week`
- Supporting formula line: `~2 min/day × 5 days · Same for 1 or 100 devs`
- Bullets:
  - `Automated reports from actual Git activity`
  - `AI-summarized commits and PRs delivered to Slack/email`
  - `Real-time visibility for stakeholders`
  - `Come to standups already prepared`

### Footer sentence

- Default visible sentence:

  `Save 6h 15m every week — that's 316+ hours per year`

- CTA label: `Get started free`

## 4. How It Works

- Eyebrow: `How it works`
- Heading: `Seriously, it's that simple`
- Subtitle:

  `No complicated onboarding. No sales calls. No "enterprise setup wizard."`

- Exact 3 steps:
  1. `01` - `Connect Your Repo` - `With one click, we set up webhooks automatically. No configuration files, no YAML hell.`
  2. `02` - `We Watch Your Activity` - `Every commit, PR, and merge gets tracked. No manual updates needed. Your Git activity speaks for itself.`
  3. `03` - `You Get Answers` - `Check your dashboard, ask our AI, or wait for your weekly/daily email. Your choice—we're not pushy about it.`
- Bottom CTA line: `Ready to automate your team updates?`
- Bottom CTA label: `Get started free`

## 5. Features

- Eyebrow: `Features`
- Heading: `Let's dive into Gitmore`
- Subtitle:

  `Explore each feature in detail with visual examples and real-world use cases.`

- Side nav titles:
  - `Connect Your Stack`
  - `Automated Reports`
  - `Live Monitoring`
  - `AI Chat Assistant`

### Stage 1 - Connect Your Stack

- Description:

  `Gitmore works with the tools you already love. GitHub, GitLab, or Bitbucket — connecting takes just a few clicks.`

- Visible mock content:
  - Browser bar text: `app.gitmore.io/integrations`
  - Section label: `Connect your repositories`
  - Connected repo row: `GitHub` / `github.com/acme-corp` / `Connected`
  - Connectable repo rows:
    - `GitLab` / `Cloud & Self-hosted` / `Connect`
    - `Bitbucket` / `Cloud & Server` / `Connect`
  - Delivery channels label: `Delivery channels`
  - Channel rows:
    - `Slack` / `Connected`
    - `Email` / `Configured`

### Stage 2 - Automated Reports

- Description:

  `Set up once, receive intelligent summaries automatically. Come to standups prepared with all the context you need.`

- Visible mock content:
  - Browser bar text: `mail.google.com`
  - `From:` `reports@gitmore.io`
  - `Subject:` `Weekly Development Summary - Week 51`
  - Email body:
    - `Hi Team,`
    - `Here's your weekly development summary. Your team had an exceptionally productive week with 127 commits across 18 pull requests.`
    - `John worked on enhancing user interactions with the new authentication flow, while Sarah optimized the database queries, improving performance by 40%.`
    - `Keep up the great work! 🚀`

### Stage 3 - Live Monitoring

- Description:

  `Track all your commits and pull requests across repositories with a live monitoring board.`

- Visible mock content:
  - Browser bar text: `app.gitmore.io/board`
  - Column 1: `NEW` / `2`
    - `Add OAuth integration` / `JD · 2h ago`
    - `Update API docs` / `SK · 4h ago`
  - Column 2: `IN PROGRESS` / `2`
    - `Optimize queries` / `AM`
    - `Fix memory leak` / `TC`
  - Column 3: `MERGED` / `2`
    - `Auth refactor` / `MJ ✓`
    - `Update deps` / `LW ✓`

### Stage 4 - AI Chat Assistant

- Description:

  `Ask questions about your progress, pull requests, or commits. Get instant answers in Slack or on Gitmore.`

- Visible mock content:
  - Browser bar text: `app.gitmore.io/chat`
  - User message: `Is the checkout modal bug fixed?`
  - Assistant reply: `Yes! The checkout modal bug was fixed in PR #247 by Sarah Chen. It was merged 2 days ago in commit a3b4c5d.`
  - User message: `What was the issue?`
  - Assistant reply: `The modal wasn't closing properly on mobile devices. Sarah fixed it by updating the click handler in the overlay component.`
  - Input placeholder: `Ask anything about your progress...`

- Final stage footer CTA line: `Ready to automate your team updates?`
- Final stage footer CTA label: `Get started free`

## 6. Who It's For

- Eyebrow: `Who it's for`
- Heading: `Built for the whole team`
- Subtitle:

  `Faster standups. Better visibility. Everyone wins.`

### Card 1 - Developers

- Tagline: `Code speaks. You don't have to.`
- Body: `Push code, get recognized. Your commits tell the story — no status updates needed.`
- Bullets:
  - `Automatic activity tracking`
  - `Leaderboard recognition`
  - `Zero reporting overhead`

### Card 2 - Engineering Managers

- Tagline: `See everything. Micromanage nothing.`
- Body: `Get complete visibility into team progress without interrupting flow states.`
- Bullets:
  - `AI-generated summaries`
  - `Spot blockers early`
  - `Data-driven 1:1s`

### Card 3 - Product Managers

- Tagline: `Real-time insights, zero interruptions.`
- Body: `Know what shipped, what's in progress, and what's blocked — without asking.`
- Bullets:
  - `Automated progress reports`
  - `Feature tracking`
  - `Release visibility`

### Card 4 - CTOs & Founders

- Tagline: `High-level visibility. Low-level effort.`
- Body: `Understand engineering velocity across all repos without manual reports.`
- Bullets:
  - `Executive summaries`
  - `Cross-team insights`
  - `Strategic visibility`

### Stats row

- `3x` - `Faster reporting with AI`
- `50%` - `Shorter standup meetings`
- `100%` - `Visibility into team activity`

## 7. Pricing

- Eyebrow: `Pricing`
- Heading:

  `Simple, transparent pricing`

- Subtitle:

  `Choose the plan that fits your team. Upgrade or downgrade anytime.`

- Billing labels:
  - `Monthly`
  - `Yearly`
  - badge: `Save 17%`

### Plan 1 - Free

- Name: `Free`
- Description: `Perfect for getting started with Gitmore`
- Price note: `$0 forever`
- Features:
  - `1 integration`
  - `50 AI credits/month`
  - `Leaderboard access`
- CTA label: `Get Started`
- Note: `*No credit card required`

### Plan 2 - Pro

- Name: `Pro`
- Badge: `Most Popular`
- Description: `For professional developers and small teams`
- Price note: `$8.99/month`
- Features:
  - `5 repositories`
  - `5 automations`
  - `100 AI credits/month`
  - `Leaderboard access`
  - `Monitoring Board`
- CTA label: `Get Started`

### Plan 3 - Enterprise

- Name: `Enterprise`
- Description: `For teams that need full control`
- Price note: `$30/month`
- Features:
  - `20 repositories`
  - `20 automations`
  - `500 AI credits/month`
  - `Leaderboard access`
  - `Monitoring Board`
  - `Custom Automations`
- CTA label: `Get Started`

- Pricing footer note: `Prices excl. VAT where applicable.`

## 8. FAQ

- Heading: `Frequently asked questions`
- Subtitle: `Everything you need to know about Gitmore.`
- Contact line: `Have another question? Contact us on X (Twitter) or by email.`
- Contact links:
  - `X (Twitter)` -> `https://x.com/gitmore_io`
  - `email` -> `mailto:support@gitmore.io`

### Questions and answers

1. `Which repositories and platforms do you support?`

   `We support GitHub, GitLab, and Bitbucket - including both cloud-hosted and self-hosted/enterprise versions. You can connect private and public repositories. We work with GitHub.com, GitHub Enterprise, GitLab.com, self-hosted GitLab, Bitbucket Cloud, and Bitbucket Server.`

2. `What tools integrate GitHub with Slack for team reporting?`

   `Gitmore integrates with both GitHub and Slack to deliver automated team reports. Unlike basic GitHub-Slack integrations that just forward notifications, Gitmore uses AI to aggregate and summarize all activity into meaningful reports - daily digests, weekly summaries, or custom schedules - delivered directly to your Slack channels.`

3. `How can CTOs get visibility into engineering progress?`

   `Gitmore gives CTOs and engineering leaders high-level visibility across all repositories without requiring manual reports from team leads. You get AI-generated summaries of development velocity, what features shipped, blockers, and team contributions - all extracted automatically from Git activity and delivered on your schedule.`

4. `How do I connect my GitHub repository to Gitmore?`

   `You can connect GitHub repositories in two ways: 1) OAuth integration - sign in with GitHub and select repositories to connect automatically, or 2) Manual webhook setup - add a webhook URL to your repository settings. Both methods take under 2 minutes and you'll start receiving data immediately.`

5. `How does the AI analysis work and what insights do I get?`

   `Our LLM analyzes webhook event metadata including commit messages, pull request descriptions, file names, and author information to categorize work into features, bug fixes, refactoring, documentation, and more. You'll receive intelligent summaries of team progress, development velocity metrics, and project insights via email or Slack - all without accessing your actual source code.`

6. `What is Gitmind and how does it help?`

   `Gitmind is Gitmore's AI chat agent that lets you ask questions about your repository activity in natural language. You can ask things like 'What did the team ship last week?', 'Show me all bug fixes in the last month', or 'Who worked on the authentication feature?' - and get instant, accurate answers based on your Git history.`

7. `How secure are webhook integrations?`

   `We implement enterprise-grade security measures including webhook signature verification. All webhook payloads are validated and processed in isolated environments. We only access event metadata (commit messages, PR titles, author info, timestamps) - never your actual source code or code changes. This ensures complete privacy of your codebase while providing valuable development insights.`

8. `Does Gitmore access my source code?`

   `No, Gitmore never accesses your source code. We only receive and process webhook event metadata - commit messages, PR titles and descriptions, author information, file names, and timestamps. Your actual code changes, file contents, and repository files remain completely private and are never transmitted to our servers.`

9. `Is there a free plan available?`

   `Yes, Gitmore offers a free forever plan that includes 1 repository integration, 50 AI credits/month, and Leaderboard access. No credit card required. Upgrade anytime to unlock more repositories, automations, and features.`

10. `Can I cancel or downgrade my plan at any time?`

   `Yes, you can cancel or downgrade your plan at any time from your account settings. There are no long-term contracts or cancellation fees. If you downgrade, you'll retain access to your current plan until the end of your billing period.`

## 9. Final CTA and Footer

### Final CTA

- Heading: `Try it for free`
- Paragraph:

  `We're confident you'll love it. But if you don't? Just cancel. No hard feelings. No "let's schedule a call to discuss your experience" emails.`

- CTA label: `Get started`

### Footer intro and contact

- Brand label: `Gitmore`
- Intro line:

  `Automated reporting and insights for your engineering team. To contact us, please email at support@gitmore.io`

- Visible linked badges:
  - `Gitmore on Product Hunt`
  - `Gitmore on Peerlist`
  - `Gitmore on SaaSHub`

### Footer groups and links

- `Product`
  - `Features`
  - `Pricing`
  - `How it works`
  - `FAQ`
  - `Blog`
  - `Resources`

- `Solutions`
  - `GitHub Reporting`
  - `GitLab Reporting`
  - `Bitbucket Reporting`

- `Use Cases`
  - `Standup Reports`
  - `Sprint Reports`
  - `Productivity Reports`
  - `Manager Reports`
  - `Async Standups`
  - `CTO Visibility`

- `Compare`
  - `Geekbot Alternative`
  - `LinearB Alternative`
  - `Keypup Alternative`
  - `Swarmia Alternative`
  - `Standuply Alternative`

- `Company`
  - `About`
  - `Contact`
  - `Privacy Policy`
  - `Terms of Service`

### Footer copyright

- `© 2026 Gitmore. All rights reserved.`

### Footer social

- X / Twitter social link present with aria label: `Gitmore on X (Twitter)`
