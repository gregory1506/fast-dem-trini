# Work Log

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
