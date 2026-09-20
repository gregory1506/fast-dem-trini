# October 2026 hackathon

## Proposed brief

**Make Trinidad & Tobago terrain easier to explore and its data easier to trust.**
Run this as a **repo improvement competition**: teams propose a useful change,
build it, and submit a pull request plus a two-minute demonstration for judging.
The event purpose is provisional; this format follows the owner’s expectation
that participants will compete to improve the repo. No specific organization is
assumed. The proposed one-day format, date, participants, venue/network and team
size still need organizer confirmation.

Start with the [README](../README.md), [contribution guide](../CONTRIBUTING.md),
[architecture](ARCHITECTURE.md), and [critique](REPO_REVIEW.md).

## Organizer checklist

### Two weeks before

- [ ] Confirm audience, date, duration, team sizes, and one primary user outcome.
- [ ] Assign a maintainer/merge captain, data steward, and onboarding helper.
- [ ] Turn the chosen tasks below into issues with named owners; these are local
      task briefs, not already-created GitHub issues.
- [ ] Verify contributor access/fork workflow and enable the CI check as a required
      branch protection rule where available. A workflow file alone does not enforce it.
- [ ] Resolve required data attribution/usage checks before public publishing.

### One week before

- [ ] Have someone unfamiliar with the repo complete a fresh clone → `npm ci` →
      `npm run check` → visible terrain in 20 minutes; record blockers.
- [ ] Rehearse on venue Wi-Fi and a modest laptop plus an actual phone.
- [ ] Run dependency/security review and triage before freezing the event baseline.
- [ ] Select 3–5 tasks and pre-download dependencies on participant machines.
      `?demo=1` avoids forecast API traffic but still requires terrain/imagery access.
- [ ] Agree a fallback presentation using existing screenshots if tile services fail.

### Competition rules (proposed)

- Everyone starts from the same recorded commit and submits by the same deadline.
- Teams use separate branches/forks. Competing solutions to the same problem are
  allowed; announce shared interests so teams can choose collaboration or competition.
- Choose a prepared task or propose a change with a user outcome, scope and
  acceptance criteria agreed at kickoff. The backlog is inspiration, not a limit.
- Submit a PR, setup/demo instructions, evidence of passing checks, and known
  limitations. Disclose pre-existing work, borrowed code and AI assistance.
- Judge each submission against the starting commit; avoid merging competitors’
  features into the competition baseline mid-event.
- Judges score independently using the published rubric, then discuss differences.
  Break ties by reliability/data honesty, then usefulness.
- Winning does not guarantee merging. Maintainers review compatibility, quality
  and maintenance cost after judging; useful non-winning changes can also merge.
- Confirm eligibility, prizes (if any), judges and final rules before invitations.

### Day before

- [ ] Record the agreed starting commit and verify all checks at that revision.
- [ ] Prepare a shared issue board: Ready → Claimed → Review → Demo-ready.
- [ ] Confirm there is one owner coordinating `App.tsx` edits across teams.
- [ ] Rehearse the demo, projection setup, and production build's subpath URL.

## Suggested one-day schedule

| Time | Activity | Outcome |
| --- | --- | --- |
| 09:00–09:30 | Product walkthrough, data limitations, setup | Everyone can run the viewer |
| 09:30–10:00 | Claim tasks, agree interfaces and acceptance criteria | One scoped outcome per team |
| 10:00–12:00 | Build in pairs; open early PRs | First testable increment |
| 12:00–13:00 | Lunch and integration check | Review integration plans |
| 13:00–15:00 | Complete feature and tests | Acceptance criteria demonstrated |
| 15:00–16:00 | Peer review, mobile checks, submission freeze | Green checks and reviewable submissions |
| 16:00–17:00 | Two-minute demos, feedback, next steps | Record results and unfinished work |

## Ready-to-copy tasks

Estimates are working time per pair; they exclude setup and review. Choose a
small subset. Tasks touching `App.tsx` require coordination with its owner.

### H01 — Explain what the map is showing

**Beginner, 1–2 hours · UI/data · no dependency.**
Files: `src/App.tsx`, `src/index.css`, `docs/DATA.md`.
Add a compact accessible explanation of 1.5× terrain, 15 m building placeholders,
wind source, UTC time and relative colors. Keep details available on mobile.
Acceptance: keyboard-accessible help; no “live elevation” or measured-height
claims; a reviewer can explain source/units after reading it. Demo both wind modes.

### H02 — Finish the mobile drawer's keyboard behavior

**Intermediate, 3–4 hours · accessibility · no dependency.**
Files: `src/App.tsx`, `src/index.css`.
Acceptance: explicit close button and Escape; focus returns to the opener;
closed controls are not tabbable; appropriate expanded/controls semantics;
no clipping at 390×844 or 200% zoom. Verify keyboard and touch with map gestures.

### H03 — Make map failures understandable

**Intermediate, 3–4 hours · reliability · coordinate with H02.**
Files: map lifecycle in `src/App.tsx`.
Acceptance: WebGL startup failure has a readable message; tile failure is
separate from wind fallback; users have a useful retry; repeated retry does not
create duplicate maps or animation loops. Demonstrate blocked tiles and an API
failure. Include automated coverage where practical and manual reproduction steps.

### H04 — Refactor the active map lifecycle

**Advanced, 4–6 hours · architecture · agree interfaces before other map edits.**
Files: `src/App.tsx`; new map hook and layer-control components.
Acceptance: controls, wind status, layer visibility and mobile behavior unchanged;
StrictMode mount/unmount releases resources and ignores late requests; tests/checks
pass; other teams can edit controls without touching initialization. No new features
or dependency upgrades in this PR. Pair with the maintainer for review.

### H05 — Add a reproducible data manifest and validator

**Beginner/intermediate, 2–4 hours · data · independent of UI work.**
Files: `public/*.geojson`, `fetch_osm_data.py`, `docs/DATA.md`, new validation script.
Acceptance: validate FeatureCollection, geometry types, finite coordinates and TT
bounds; record counts/bytes and source metadata; unknown extraction dates explicitly
stay unknown; malformed fixtures fail checks. Do not refresh bulk OSM data.

### H06 — Measure and improve building performance

**Advanced, 4–6 hours · geospatial/performance · optional H05.**
Files: building source/layer configuration and a documented preprocessing tool.
Acceptance: record transfer/parse/render timing on the same device before/after;
propose or implement tiled/zoom-filtered delivery with reproducible generation;
retain attribution and representative footprints; no building download when off.
Demo the slowest tested device. Do not commit an unexplained second large dataset.

### H07 — Honest building heights

**Intermediate, 3–4 hours · geospatial · coordinate building source with H06.**
Files: building layer paint expression, new height normalizer/tests.
Acceptance: valid OSM height or building-level tags handled with documented units;
missing/invalid data retains a visibly explained fallback; feet/metres and malformed
values tested; distinguish estimated from measured values. No blanket completeness claim.

### H08 — Wind refresh and stale-data state

**Intermediate/advanced, 3–5 hours · data reliability · service tests available.**
Files: `WindDataService.ts`, wind status/control UI, `tests/wind.test.mjs`.
Acceptance: explicit refresh with loading/error/fallback/stale states; previous good
data survives an unsuccessful refresh; concurrent refreshes do not overwrite newer
results; mock time/network tests; avoid automatic per-participant request storms.
Current `refresh()` clears the cache, so change its semantics deliberately.

### H09 — Orientation and first-use navigation

**Beginner/intermediate, 2–3 hours · UX · no dependency.**
Files: north-arrow markup/styles and map controls in `App.tsx`.
Acceptance: compass follows bearing or duplicate static north arrow is removed;
reset view restores TT bounds; controls have accessible names; desktop and touch
instructions match device behavior. Demo after rotating and zooming the map.

### H10 — Repeatable browser smoke checks

**Intermediate, 3–4 hours · tooling · after agreeing UI selectors.**
Files: new browser test/config, retire or replace `check_errors.js` and
`check_playwright.cjs` with maintainer agreement.
Acceptance: use the correct base path; mock wind and external tiles or explicitly
separate online checks; fail on uncaught page errors; desktop/mobile toggles and
wind-source state asserted; document browser installation. Run on CI without
production API dependence. Do not treat a screenshot alone as a passing test.

## Demo and definition of done

Show the user problem, demonstrate the new behavior, then show tests and one
remaining limitation. A task is done when its acceptance criteria are met,
`npm run check` passes, a peer reviews it, and UI/data changes have appropriate
manual evidence and attribution. Prefer a finished small task over partial
changes across multiple tracks. For competition scoring, a submission need not be merged. Unfinished work remains
in a named follow-up issue.

Suggested judging: useful outcome 40%, reliability/data honesty 30%, usability 20%,
clarity of handoff 10%. No points for feature count or unverified scientific claims.
