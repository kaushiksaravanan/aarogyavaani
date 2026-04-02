# Visual QA - Gitmore Fidelity Gaps

Compared saved Gitmore sources in `src/parallel/reference-content.md`, `src/parallel/HeroTop.jsx`, `src/parallel/MiddleSections.jsx`, and `src/parallel/LowerSections.jsx` against the current app in `src/App.jsx` and `src/styles.css`.

Ordered by impact for exact visual fidelity:

1. Product identity is still the biggest blocker.
   - Saved Gitmore shows `gitmore.io` / `Gitmore`; the live app is branded `Pulseboard` with different logo art, app URLs, and email addresses.
   - Fix: swap all visible brand strings, lockups, URL text, email text, iframe titles, and footer branding to the Gitmore equivalents before tuning anything smaller.

2. The hero message is a different product pitch.
   - Saved Gitmore hero is `Git Reporting Tool` / `Keep Everyone Updated`; the current hero uses new Pulseboard headline and paragraph copy.
   - Fix: restore the exact Gitmore headline line breaks, italic emphasis on `Git Reporting` and `Everyone`, the original body copy, and the `Works with Github, Gitlab, and Bitbucket.` supporting line.

3. The hero still has structural elements the original does not.
   - The current app adds an eyebrow pill above the headline and changes the overall reading order; the reference hero has no visible eyebrow.
   - Fix: remove the hero eyebrow from the main app and match the simpler Gitmore stack from `src/parallel/HeroTop.jsx`.

4. Hero CTA treatment is not exact.
   - The current `View Demo Report` CTA is plain text; the saved Gitmore version includes the mail icon and slightly different button treatment.
   - Fix: copy the Gitmore hero CTA composition from `src/parallel/HeroTop.jsx`, including the mail icon, spacing, and button proportions.

5. The comparison section copy is still re-authored.
   - Current cards say `Without Pulseboard`, `With Pulseboard`, `Automated reporting`, and use different bullet copy; saved Gitmore says `Without Gitmore`, `With Gitmore`, `Automated reports`, plus different pain/benefit bullets.
   - Fix: replace the comparison labels, titles, formulas, bullets, and footer sentence with the exact Gitmore copy from `src/parallel/reference-content.md`.

6. The `How it works` section is missing the original section-ending CTA block.
   - Saved Gitmore keeps `Ready to automate your team updates?` and `Get started free` inside the section footer; the current app ends after the 3 cards.
   - Fix: add the footer CTA row back into the `How it works` section and mirror the spacing from `src/parallel/MiddleSections.jsx`.

7. The `How it works` step copy is not the Gitmore copy.
   - Current step titles and bodies are reworded (`Connect your repos`, `We watch the flow`, `Everyone gets answers`); the reference uses `Connect Your Repo`, `We Watch Your Activity`, and `You Get Answers` with different descriptions.
   - Fix: restore the exact saved step titles and body text, including the more opinionated copy tone.

8. The features section is still positioned as a different product.
   - Current heading says `Let's dive into Pulseboard`, and the nav labels are `Automated Digests`, `Live Activity Board`, and `Ask Pulseboard`; saved Gitmore uses `Let's dive into Gitmore`, `Automated Reports`, `Live Monitoring`, and `AI Chat Assistant`.
   - Fix: revert the features heading, nav labels, and stage headings to the Gitmore versions before polishing panel visuals.

9. Feature stage descriptions are not exact.
   - Every stage body under the features stack is re-authored and softer in tone than the saved Gitmore content.
   - Fix: replace each stage description with the exact text from `src/parallel/reference-content.md` or `src/parallel/MiddleSections.jsx`.

10. The connect preview still looks like a different app mock.
   - Current mock uses `app.pulseboard.io/integrations`, different helper text (`Cloud and self-hosted`, `weekly summary`), row layout changes, and an extra webhook/setup summary bar not in the saved Gitmore source.
   - Fix: switch the preview to the Gitmore version: `app.gitmore.io/integrations`, exact row labels, Gitmore channel states, and the simpler lower-information layout from `src/parallel/MiddleSections.jsx`.

11. The email/report preview is materially different.
   - Current mock uses `mail.pulseboard.io`, `updates@pulseboard.app`, a different subject, different body copy, and a highlight box; saved Gitmore uses `mail.google.com`, `reports@gitmore.io`, `Weekly Development Summary - Week 51`, and plain email paragraphs.
   - Fix: match the Gitmore browser chrome, sender/subject lines, exact email body, and flatter email styling.

12. The monitoring preview content is not exact.
   - Current board labels are title case (`New`, `In progress`, `Merged`) and card text differs; saved Gitmore uses uppercase labels and specific card/meta content, including check-marked merged initials.
   - Fix: restore the exact Gitmore board labels, titles, meta strings, and merged-state detail treatment.

13. The chat preview conversation is different.
   - Current mock asks `Anything still at risk for launch?`; saved Gitmore asks `What was the issue?` and uses different assistant answers.
   - Fix: replace the message sequence with the exact four-message Gitmore exchange from the saved source.

14. The `Who it's for` cards still use the wrong copy set.
   - Titles, taglines, body copy, and bullets differ across all four cards; `Product Leaders` and `Founders and CTOs` do not match the saved `Product Managers` and `CTOs & Founders` labeling.
   - Fix: restore the exact Gitmore card titles, taglines, bodies, and bullet lists from `src/parallel/reference-content.md`.

15. The `Who it's for` card art style is off.
   - Current app uses custom SVG icons; saved Gitmore uses simple letter badges like `DE`, `EM`, `PM`, and `CX`, which changes the whole visual tone.
   - Fix: replace the icon blocks with the badge treatment used in `src/parallel/MiddleSections.jsx` and `src/parallel/middle-sections.css`.

16. The stats strip still misses exact numbers and wording.
   - Current stats are `52% shorter standups` and `100% team activity visibility`; saved Gitmore shows `50%` and `Visibility into team activity`, plus `Faster reporting with AI` wording.
   - Fix: restore the exact three saved stats values and labels.

17. Pricing is still far from the saved Gitmore structure.
   - Current plans are `Starter`, `Growth`, and `Scale` with different prices, feature counts, and notes; saved Gitmore uses `Free`, `Pro`, and `Enterprise` with its own pricing grid.
   - Fix: replace the whole pricing dataset, card copy, badges, feature lists, and CTA labels with the Gitmore pricing model from `src/parallel/LowerSections.jsx`.

18. Pricing layout details are still missing.
   - The current section has no `Prices excl. VAT where applicable.` footer note and does not match the saved Gitmore note placement and card emphasis.
   - Fix: add the VAT note, move fine print to the free plan only, and mirror the Gitmore card emphasis and spacing from `src/parallel/lower-sections.css`.

19. FAQ layout and content are still substantially different.
   - Current app uses a centered intro with 6 generic Pulseboard questions; saved Gitmore uses a two-column layout, 10 specific Gitmore questions, `Everything you need to know about Gitmore.`, and a visible contact line linking to X and email.
   - Fix: replace the FAQ data with the saved 10-item set and rebuild the section shell to match `src/parallel/LowerSections.jsx`.

20. The final CTA and footer are still the least faithful end-of-page area.
   - Current CTA talks about the React rebuild, includes `Back to top` and `founders@pulseboard.app`, and the footer is missing the Gitmore intro copy, badge row, 5-column nav taxonomy, giant `gitmore.io` wordmark, and the correct social treatment.
   - Fix: swap in the saved Gitmore final CTA and footer structure from `src/parallel/LowerSections.jsx`, including Product Hunt/Peerlist/SaaSHub badges, full footer groups, copyright text, X link, and oversized wordmark.

## Fastest path to near-exact fidelity

1. Reapply Gitmore branding and hero copy everywhere.
2. Replace all section datasets with the saved Gitmore content set.
3. Port the feature preview mocks and footer/FAQ structures from `src/parallel/*` into the current app shell.
4. Only after content parity, tune spacing, typography, and button styling for pixel-level matching.
