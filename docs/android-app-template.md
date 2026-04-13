# Android App Template

This repo includes a web-first SaaS starter and a mobile path via Capacitor.

## Quick path

1. Build web app
2. Sync Capacitor
3. Open Android project
4. Add signing config
5. Build AAB
6. Publish to Play Console

## Files

- `capacitor.config.ts`
- `docs/play-store-publishing.md`
- `docs/skills/play-store-publishing-skill.md`

## Commands

```bash
npm run build
npx cap add android
npx cap sync android
npx cap open android
```

## Before publishing

- update app id
- replace icons and splash assets
- add privacy policy URL
- confirm data collection answers
- set signing keys outside git
