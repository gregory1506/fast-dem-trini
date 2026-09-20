# Contributing

1. Follow the README setup with `npm ci`; use the committed lockfile.
2. Choose a task in [the hackathon brief](docs/HACKATHON.md), state that you are
   taking it in the event board/issue. For the competition, independent teams may
   tackle the same problem on separate branches; coordinate ownership within each team.
3. Branch from the event's agreed base: `git switch -c hackathon/short-description`.
   Fork first if you do not have repository write access.
4. Make one reviewable change. Use `?demo=1` for wind work that does not need live forecasts.
5. Run `npm run check`. Tests use Node's built-in runner and mock network calls;
   no browser download is required for this command.
6. For UI work, manually check desktop and a 390 px viewport, keyboard access,
   toggles, drawer, and console errors. Record what you actually tested in the PR.
7. Open a pull request using the template. A teammate reviews before merge. For the competition, submit by the deadline
   and leave feature merges until after judging; use the agreed starting commit.

## Code and test map

- Map startup, layer controls and lifecycle: `src/App.tsx`.
- Wind retrieval, validation and interpolation: `src/services/WindDataService.ts`.
- Trail construction: `src/utils/windTrips.ts`.
- App styles: `src/index.css` (loaded by `src/main.tsx`).
- Regression tests: `tests/wind.test.mjs`.
- Deployment and checks: `.github/workflows/`.

Tests are `.mjs` files importing TypeScript with Node's type stripping flag.
Keep tests network-free and assert user/data behavior. Add regression coverage
when changing parsing, caching, interpolation, or trail construction.
Do not relax lint or type checks to make a PR pass.

## Data changes

Do not re-download all OSM data during onboarding. The existing Python script
requires the external `requests` package and overwrites `public/*.geojson`;
it is a maintenance utility, not part of the Node setup. Coordinate changes to
large datasets, record provenance and bounding boxes, and review the diff/size.
Do not commit secrets or machine-specific browser artifacts.

## Review checklist

- Clear user outcome and reproducible demo steps.
- Passing checks and relevant browser validation.
- Units, source, timestamps, synthetic data and approximations visible where relevant.
- Attribution preserved for any new source.
- No unrelated dependency upgrades or bulk data refreshes mixed into feature work.

## Troubleshooting

- Use the full `/fast-dem-trini/` path. A fork's configured base path may differ.
- If a port is occupied, use Vite's printed URL; avoid starting multiple servers.
- Blank terrain: inspect tile requests and WebGL/browser hardware acceleration.
- Synthetic wind: live retrieval failed or `?demo=1` is selected. Reload without
  that query to try the API again. The app currently fetches once per map mount.
- Buildings can take time: the 34 MiB GeoJSON downloads on first enable.
- The Vite large-chunk warning is a known performance task, not a failed build.
