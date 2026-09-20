# Lessons Learned

## 2026-09-19 — Distinguish the active renderer and data clocks

**Context:** Prepare the existing viewer for new contributors.
**What happened:** Historical docs described custom GPU particles, but the app uses deck.gl trips. Forecast valid time doubled as cache age, and hidden buildings still downloaded ~34 MiB.
**Lesson:** Trace imports before assigning work; separate forecast validity from fetch time, expose synthetic data, and inspect network costs of disabled layers.
**Tags:** #onboarding #wind #performance

## 2026-09-20 — Earthquake depth and development effect replay

**Context:** Add USGS events to a terrain map and test refresh failure handling.
**What happened:** USGS coordinates include depth in kilometres as their third value, while mapped positions should remain on the surface. React StrictMode also replays mount effects, consuming a naive one-success-then-fail browser fixture early.
**Lesson:** Store earthquake depth as a property, use two-dimensional marker coordinates, and switch browser routes to failure only after successful rendering is observed.
**Tags:** #geojson #testing #react
