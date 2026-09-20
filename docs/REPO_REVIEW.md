# Repository critique — October hackathon readiness

Reviewed 2026-09-19. Verdict: a useful visual prototype with an approachable static
stack, but initially a fragile handoff. The preparation work provides a tested
contribution baseline; it does not turn the viewer into a geospatial analysis tool.

## Strengths

- Static Vite/React/TypeScript setup; no credentials or backend needed to contribute.
- Local roads/rivers/buildings and a visually useful terrain/wind concept.
- Wind service and path builder already separate data work from rendering.
- Existing Pages deployment and MIT code license.

## Findings, ordered by impact

| Priority | Finding and evidence | Impact | Disposition |
| --- | --- | --- | --- |
| P0 | `npm run lint` failed: four errors and two hook dependency warnings | Contributors inherit a failing baseline | Fixed; zero warnings enforced |
| P0 | No tests, PR CI, or contributor guide | Regressions reach main; onboarding depends on the author | Added tests, checks workflow, guide and templates |
| P0 | Service silently generated fallback wind; UI said “Live Terrain” and implied island-wide buildings | Viewers can mistake illustrative output for measured data | Wind source/time displayed; explicit synthetic mode; honest terrain/building labels |
| P1 | Forecast timestamp used for cache freshness; timezone-free dates parsed locally | Incorrect cache lifetime and time display | Retrieval clock separated and UTC parsing tested |
| P1 | Missing current locations could shift the remaining values; hourly gaps became zero wind | Wrong spatial values or invented calm conditions | Reject incomplete/invalid responses before normalization |
| P1 | Building source loaded ~34 MiB / 130,039 polygons while hidden | Unnecessary startup transfer and parsing | Deferred until first enable; tiling remains a task |
| P1 | Wind frame advanced by a fixed value; renderer closure could retain old legend bands | Animation varies by frame rate; colors drift from legend | Elapsed-time stepping and effect dependencies corrected |
| P1 | `App.tsx` combines lifecycle, controls, gestures, legend and animation | Shared-file conflicts and difficult feature testing | Scoped extraction task; avoid a speculative rewrite before the event |
| P1 | Tile failures/WebGL initialization have no dedicated recovery UI | Venue connectivity or GPU issues can spoil the demo | Open task; synthetic wind does not make the map offline |
| P1 | Mobile drawer lacks explicit close/focus management; decorative north arrow is static | Keyboard access and orientation are unreliable | Open accessibility/orientation tasks; toggles now expose pressed state |
| P1 | Data capture dates/accuracy and complete attribution records absent | Claims cannot be checked by contributors | Inventory added; data steward task remains |
| P2 | Older particle docs describe a renderer absent from the active app | Contributors improve the wrong pipeline | Historical banners and current architecture map added |
| P2 | deck.gl ~706 kB and MapLibre ~1,023 kB minified chunks | Performance risk on slower devices | Warning retained; measure then optimize |
| P2 | Ad hoc browser scripts are not reliable checks | Failures may be swallowed or tooling missing | Documented as legacy; replacement is a task |

## Scientific/product boundaries

Terrain is exaggerated 1.5×, all buildings use 15 m, and wind paths use an
arbitrary degree scale. There is no DEM upload, elevation query, flood analysis,
wind/terrain coupling, or geospatial export. Quantile colors are relative, not
fixed hazard categories. Choose one user need for the hackathon rather than
promising a complete GIS platform.

## Validation and limits

Baseline build passed; baseline lint failed. After preparation, `npm run check`
passes lint, eight network-free regression tests, TypeScript and production build.
The large-chunk warning remains visible. Test coverage targets data behavior;
it does not certify GPU rendering, browser accessibility, or upstream availability.
Dependency vulnerability and upstream licensing audits were not performed.
Browser observations are recorded in `work_log.md`.
