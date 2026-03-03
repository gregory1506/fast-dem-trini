# Fast DEM Trinidad

Interactive 3D terrain map of Trinidad & Tobago with animated wind trips rendered in deck.gl. Built for fast exploration, strong visual clarity, and a clean, public-friendly UI.

**Highlights**
1. High‑resolution terrain + satellite imagery
2. Wind trips with quantile-based color scaling
3. Lightweight UI with in‑map legend and compass
4. Layer toggles for roads, rivers, and buildings

**Tech Stack**
1. Vite + React + TypeScript
2. MapLibre GL for map rendering
3. deck.gl TripsLayer for wind trails
4. Open‑Meteo GFS API for wind data

**Local Development**
```bash
npm install
npm run dev
```

**Build**
```bash
npm run build
```

**Deploy (GitHub Pages)**
This repo includes a GitHub Actions workflow that builds on every push to `main` and publishes the `dist` folder to GitHub Pages.

If you fork or rename the repository, update the `base` path in `vite.config.ts` to match `/<repo-name>/`.

**Data & Attribution**
1. Satellite imagery: Esri World Imagery
2. Terrain tiles: Terrarium (S3 elevation tiles)
3. Wind data: Open‑Meteo GFS
4. Roads, rivers, buildings: local GeoJSON sources in `public/`

**License**
MIT. See `LICENSE`.
