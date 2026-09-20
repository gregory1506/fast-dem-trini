# Lessons Learned

## 2026-09-19 — Distinguish the active renderer and data clocks

**Context:** Prepare the existing viewer for new contributors.
**What happened:** Historical docs described custom GPU particles, but the app uses deck.gl trips. Forecast valid time doubled as cache age, and hidden buildings still downloaded ~34 MiB.
**Lesson:** Trace imports before assigning work; separate forecast validity from fetch time, expose synthetic data, and inspect network costs of disabled layers.
**Tags:** #onboarding #wind #performance
