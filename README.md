# Hackathon SaaS Starter

Premium React + Vite marketing starter with optional FastAPI backend, SEO defaults, and reusable content architecture.

This repo is designed for one job: help you show up at a hackathon, rebrand fast, build one strong product workflow, and demo something polished.

## What is already here

- polished landing page system
- reusable design tokens and style guide
- centralized branding in `src/siteConfig.js`
- reusable marketing/content routing
- SPA SEO helper
- generated `robots.txt`, `sitemap.xml`, and `llms.txt`
- optional FastAPI backend starter in `backend/`
- provider starter modules for Supabase, Clerk, Paddle, Neon, and model APIs
- Capacitor/Android publishing starter docs
- visible starter pages for auth, billing, provider status, and mobile publishing
- Docker + Windows helper scripts
- persistent implementation notes in `docs/thinking.md`

## Fast start

### Frontend

```bash
npm install
npm run dev
```

### Backend

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
python app.py
```

## Rebrand checklist

1. Update `src/siteConfig.js`
2. Update `.env`
3. Replace assets in `public/`
4. Update product copy in `src/siteContent.js` as needed
5. Fill local provider env files if needed
6. Run `npm run build`

## Template files worth knowing first

- `src/siteConfig.js`
- `src/siteRoutes.js`
- `src/siteContent.js`
- `src/styleGuide.css`
- `src/lib/apiClient.js`
- `src/integrations/`
- `src/starter/StarterPages.jsx`
- `backend/app.py`
- `backend/integrations/`
- `docs/hackathon-playbook.md`
- `docs/template-map.md`
- `docs/play-store-publishing.md`

## SEO scripts

```bash
npm run seo:sync
npm run sitemap
```

`npm run build` runs both automatically before the production build.

## Local helper scripts

- `run.bat`
- `build.bat`
- `docker-compose.yml`

## Notes

- The old product-specific content pack has been replaced with template-first content.
- The core branding, starter hub, integrations, backend, docs, and launch surface are now template-first.
- Use ignored local env files for real secrets: `.env.providers.local` and `backend/.env.local`.
