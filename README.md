# 🧹 Room Clean Spinner

A colourful, kid-friendly spinner that picks which room the family cleans next.
Each picked room comes off the wheel; **Reset** puts them all back. Picks are remembered
on the device, and it installs as an offline PWA ("Add to Home Screen").

Live: https://wildmanpeace.github.io/RoomCleanSpinner/

## Develop

```bash
npm install
npm run dev        # local dev server
npm test           # unit tests (Vitest)
npm run build      # type-check + production build to dist/
npm run preview    # serve the production build (incl. service worker)
```

Rooms live in `src/rooms.ts`. Icons are generated from `public/icon.svg` with `npm run generate-icons`.

Pushing to `main` runs tests, builds, and deploys to GitHub Pages via `.github/workflows/deploy.yml`.
