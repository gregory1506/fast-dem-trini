# Work Log

## 2026-09-20 — Wind visibility over land

- Render wind trails without terrain depth occlusion or writes to the shared depth buffer, so existing paths remain visible over land as well as water.
- `npm run check` passed (lint, 12 tests, TypeScript and build; existing bundle-size warnings remain). Visually confirmed trails across Trinidad in the local demo with Playwright; screenshot: `output/playwright/wind-over-land.png`.
- Status: implemented locally; not committed or deployed.

## 2026-09-20 — Wind visibility publication

- User authorized deployment of the validated wind visibility fix.
- Publishing through the existing main-branch GitHub Pages workflow, which runs lint, tests and the production build before deployment.
- Status: deployment initiated; verify the workflow against the pushed commit and the public bundle.

## 2026-09-19 — October hackathon preparation

**What was done:**
- Reviewed source, data inventory and baseline checks; wrote critique, architecture, onboarding and event task briefs.
- Fixed lint/hooks, wind UTC/cache/validation, source labels, demo mode, elapsed animation, async disposal and deferred buildings.
- Added network-free service/path tests, Node baseline, PR CI and contribution templates; marked old renderer docs historical.

**Files touched:** README, CONTRIBUTING, docs, src/App.tsx, wind service/layer, package files, tests and .github.

**Status:** preparation implemented; validation and event decisions recorded below. No commit, push or deployment performed.

## 2026-09-20 — Validation and competition framing

**What was done:**
- Owner clarified the likely format is a competition for repo improvements; brief now includes open proposals, equal starting commit, rubric, submission rules and post-judging merge decisions.
- `npm run check` passed: zero-warning lint, 8/8 tests, TypeScript and production build. `git diff --check` passed. Large bundle warnings remain.
- Playwright desktop demo loaded, wind toggle reported pressed and synthetic source appeared. At 390×844, Layers opened the drawer and there was no horizontal page overflow. Browser console recorded zero errors/warnings.
- Browser resource entries showed no wind API request and no building file request before enabling buildings. Screenshot: `output/playwright/hackathon-mobile.png` (ignored artifact). Full live API, building rendering, physical-device and offline-map checks were not performed.

**Status:** local preparation complete; organizer decisions and remaining product tasks are in `docs/HACKATHON.md`. No commit, push, remote issues or deployment made.

## 2026-09-20 — Pull request preparation

**What was done:**
- User requested submission of the prepared changes as a pull request.
- Fetched origin and checked for existing open PRs; aligned the submission branch with current main, whose file tree matches the reviewed baseline.
- Prepared branch `hackathon/october-readiness` with the critique, event materials, checks and runtime fixes. Prior validation is recorded above.

**Status:** submitting for review; no merge or production deployment authorized by this step.

## 2026-09-20 — PR #8 review before merge

**What was done:**
- Reviewed runtime changes, tests, CI/deployment configuration and documentation; GitHub CI passed and there were no inline review comments. CodeRabbit explicitly skipped review.
- Reproduced valid offset-bearing forecast timestamps being rejected by validation and replaced duplicated parsing with one shared UTC/offset parser.
- Added a regression test; all nine tests, zero-warning lint, TypeScript and production build now pass. Large bundle warnings and previously documented product follow-ups remain.

**Status:** review fix ready; user authorized merging after the updated GitHub checks pass.

## 2026-09-20 — Recent earthquakes layer

**What was done:**
- Added an opt-in USGS past-30-days layer filtered to the map region, with magnitude-sized circles, depth colours, marker/keyboard-selectable details and Trinidad event times.
- Added five-minute refresh, request cancellation, honest empty/error states and preservation of the last successful data on refresh failure; made the control panel scrollable on short screens.
- Verified the live feed (zero matching regional events at check time), browser marker clicks and selection using labelled fixtures, failed refresh retention, disabled-layer request cleanup and 390×844 mobile layout.
- `npm run check` passed: lint, 12 tests, TypeScript and production build; existing large-bundle warnings remain. Browser 503 errors were intentionally injected for failure checks. Screenshots are in ignored `output/playwright/`.

**Files touched:** src/App.tsx, src/index.css, src/components/EarthquakeLayer.tsx, src/services/earthquakes.ts, tests/earthquakes.test.mjs, README.md and work records.

**Status:** complete locally; no commit, push or deployment.

## 2026-09-20 — Earthquake layer publication

**What was done:**
- User authorized pushing and deploying the validated earthquake layer.
- Confirmed main is the deployment branch and GitHub Pages runs the full check suite before publishing.

**Status:** deployment verified. GitHub Pages run `35489548773` and quality-check run `35489548759` both completed successfully for commit `35e216dbaf4f8ea0e05f48cba58800f5357d2be7`. The public site returned its app HTML, and its referenced JavaScript bundle includes the earthquake controls and USGS endpoint. This follow-up checked publication; browser interaction checks are recorded above.

## 2026-09-20 — README refresh

- Refreshed the README with a centred introduction, CI/deployment/license/Node badges, live demo links, feature and stack tables, and a clearer setup and contribution flow.
- Added relevant geographic, GIS, wind, earthquake and technology keywords and hashtags; preserved source credits, demo behavior and visualization limitations.
- Validated local Markdown links, code fences and whitespace. Documentation-only change; no application tests rerun.
- Status: complete locally; not committed or pushed.

## 2026-09-20 — README publication

- User authorized committing and pushing the README refresh and its work record.
- Confirmed the diff contains only README and work-log changes; whitespace validation passed.
- Publishing to `main` through the existing GitHub workflows.
