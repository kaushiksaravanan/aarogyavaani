# Thinking File

Purpose: persistent implementation notes so work can resume quickly in later sessions.

## Current Goal

Turn `enigma` into a hackathon-ready SaaS starter that lets you:
- ship a polished landing page fast
- keep strong SEO defaults
- add a lightweight backend quickly
- rebrand from a few central files
- preserve this repo's existing strong marketing/design system

## Current Branding Direction

- Working brand: `LaunchForge`
- Purpose: reusable SaaS starter for hackathons, indie products, and AI SaaS builds
- The previous Gitmore content pack has now been replaced with template-first starter content

## Reference Repos Reviewed

### `SAAS-Template`
- Useful for folder shape: `backend/` + `frontend/`
- Has a simple FastAPI backend pattern
- Has docker-compose and Windows batch helpers
- Existing implementation is rough and contains files that should not be copied as-is (for example credentials and ad hoc setup)

### `swapgiftscorrect`
- Useful for SEO/public asset patterns
- Includes route-aware SEO utility ideas
- Includes `robots.txt` and script-driven sitemap generation
- No `llms.txt` file exists there, so we should add our own clean starter version

## Decisions

1. Keep this repo's main Vite frontend at the root.
2. Add `backend/` as an optional API starter instead of forcing a monorepo move right now.
3. Add a `docs/` layer for startup instructions and hackathon workflows.
4. Add `scripts/` for sitemap generation and helper tasks.
5. Add `seos/llms.txt` plus public-facing copies where useful.
6. Preserve current landing-page routes and content, but make the repo easier to repurpose.
7. Store real secrets only in ignored local env files, never tracked template files.
8. Add a template-first `/starter` route so the repo presents itself as a reusable launch engine even before the full content pack is rewritten.

## Template Direction

Frontend starter should include:
- central branding in `src/siteConfig.js`
- reusable landing page already present
- SEO helpers
- sitemap generation
- robots + llms starter files
- deploy-friendly env template

Backend starter should include:
- FastAPI app
- health endpoint
- example API router
- env template
- requirements file
- README for local run

Project-level starter should include:
- clear README
- run/build scripts
- docker-compose starter
- gitignore cleanup

## Risks / Notes

- Current `siteContent.js` still contains product-specific copy; that is okay for now, but a future pass should split content packs from engine code.
- `SeoHead.jsx` exists, but some routes still use a lighter `usePageMeta` path. A later improvement can unify metadata handling.
- Sitemap is currently static. We should move to generation from route config/content where practical.
- The user provided many live secrets. They were written only to ignored local env files, not tracked repo files.
- Provider starter code is scaffolded, not production-complete integration logic.

## Next Practical Improvements After This Pass

1. Split content from product-specific keywords into reusable content packs.
2. Add a starter app shell page for authenticated product UI, not just marketing pages.
3. Add API client helper and environment-aware base URL handling.
4. Add deployment presets for Vercel/Netlify/Render.
