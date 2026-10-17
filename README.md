# CFE Manager

Prototype of Reliance's hourly carbon-free energy service (CF90), built for Reliance T.U.P XII.
All data is simulated (illustrative month, 1–31 October 2026). No grid, meter, exchange or registry is connected.

## Files

- `shell.html` — page markup and all styles
- `engine.js` — simulation engine: 15-minute dispatch, fixed-schedule baseline, evidence statuses, acceptance tests A–J
- `core.js` — shared data, state and chart helpers
- `story.js` — CFE promise, evidence stages, finance inputs (`FIN`), scenario briefs, same-assets comparison
- `judge.js` — four-scene judge demo
- `ops.js`, `manager.js`, `fulfil.js`, `proof.js` — operations console screens
- `business.js` — platform value, commercials, Why Reliance, expansion map
- `onboard.js`, `portals.js` — onboarding journeys and stakeholder portals
- `app.js` — routing, roles, platform tour and Q&A use cases

## Finance inputs

Commercial figures live in the `FIN` object at the top of `story.js`. Anything left `null` shows as "finance validation pending".

## Run locally

```
npm install
npm run build
open dist/index.html
```

Every push to `main` deploys to Vercel automatically.
