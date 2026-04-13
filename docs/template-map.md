# Template Map

## Frontend

- `src/siteConfig.js` - rebrand here first
- `src/siteContent.js` - long-form marketing/SEO content
- `src/siteRoutes.js` - derived route metadata for routing and sitemap generation
- `src/styleGuide.css` - design system and token documentation
- `src/lib/apiClient.js` - backend API helper
- `src/integrations/` - provider starter modules
- `src/starter/StarterHub.jsx` - template-first starter route
- `src/starter/StarterPages.jsx` - auth, billing, provider, and mobile starter UIs
- `src/SeoHead.jsx` - SPA metadata helper

## Backend

- `backend/app.py` - FastAPI starter
- `backend/integrations/` - provider config starter modules
- `backend/integrations/dotenv_loader.py` - local env loader for ignored secret files
- `backend/requirements.txt` - Python dependencies
- `backend/.env.example` - backend env template

## SEO and Public Assets

- `public/robots.txt`
- `public/sitemap.xml`
- `public/llms.txt`
- `seos/llms.txt`
- `scripts/generate-sitemap.js`
- `scripts/sync-seo-assets.js`

## Operations

- `run.bat` - local dev helper on Windows
- `build.bat` - local build helper on Windows
- `docker-compose.yml` - frontend + backend starter
- `docs/thinking.md` - persistent implementation notes
- `docs/thinking-scratchpad.md` - rough working notes
