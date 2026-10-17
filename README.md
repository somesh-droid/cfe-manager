# CFE Manager

Prototype of Reliance's hourly carbon-free energy service (CF90), built for Reliance T.U.P XII.
All data is simulated. No grid, meter, exchange or registry is connected.

## Structure

- `src/shell.html` — page markup and all styles
- `src/engine.js` — the simulation engine (15-minute dispatch, evidence, acceptance tests A–J)
- `src/core.js` — shared data, state and chart helpers
- `src/manager.js`, `src/ops.js`, `src/fulfil.js`, `src/onboard.js` — operations console screens
- `src/portals.js` — customer, supplier, trading member and verifier portals
- `src/app.js` — routing, roles, presentation demo and Q&A use cases

## Run locally

```
npm install
npm run build
open dist/index.html
```

## Deploy

Every push to `main` deploys to Vercel automatically.
