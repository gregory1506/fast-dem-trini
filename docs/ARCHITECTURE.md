# Architecture

## Active path

```text
src/main.tsx (React StrictMode)
  → App.tsx
      → MapLibre: satellite + Terrarium DEM + GeoJSON overlays
      → WindDataService: Open-Meteo → validated grid/time series → cache
      → buildWindTrips: interpolated vectors → animated paths
      → deck.gl MapboxOverlay / TripsLayer
```

There is no backend, database, authentication, or private configuration. Vite
serves local assets from `public/`; the build uses `/fast-dem-trini/` as its base.
External tile and wind requests come directly from the browser.

`App.tsx` owns MapLibre lifecycle, the wind service, overlay, requestAnimationFrame,
quantile legend and mobile panel. Map effects clean up the overlay and map; async
wind completion is ignored after disposal. Animation uses elapsed time capped at
50 ms to prevent large jumps after a suspended tab.

The service requests an 8×8 spatial grid and 18 forecast hours from the app.
Wind speed is requested in m/s. Meteorological direction describes where wind
comes **from**: east (90°) produces a westward vector. Forecast times are parsed
as UTC; cache age is measured independently from retrieval time.

Network failure uses previous cached data when available, otherwise labeled
synthetic trade winds. Requests time out after 15 seconds. Incomplete grids and
invalid values fall back instead of silently assigning calm winds or shifting
locations. `?demo=1` skips the wind API entirely. Synthetic data has at most a
60-second service cache TTL, but the UI does not poll or refresh automatically.

The app builds 300 paths with 120 samples each, then loops their animation.
Coordinates use a visual scale factor, not physical trajectory integration.
Quantiles describe generated trip-average speeds; they are relative color bands,
not warning thresholds. This is a visual exploration feature.

## Files that are not the active renderer

`src/layers/WindLayer.ts`, `src/utils/windParticleSystem.ts` and `src/shaders/*`
are an earlier custom WebGL implementation. Preserve them until a task explicitly
archives or removes them. `docs/WIND_LAYER_STATUS.md`, `docs/DEBUGGING_GUIDE.md`
and `docs/next_steps.md` are historical notes about that experiment.
`src/App.css` and starter SVGs are not the primary app stylesheet/assets.

`check_errors.js` is an old CommonJS/Puppeteer script in an ESM package, with no
Puppeteer dependency. `check_playwright.cjs` uses a hard-coded root URL and catches
navigation errors. Neither is an automated quality gate; use `npm run check`.

## Recommended boundaries for hackathon work

Extract pure legend/color functions before redesigning the legend. Isolate map
lifecycle into a hook before adding multiple UI panels. Keep source validation
and physical data semantics in the service; rendering components should consume
normalized data. Agree an owner for `App.tsx` to avoid merge conflicts.
