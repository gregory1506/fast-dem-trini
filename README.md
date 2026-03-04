# Fast DEM Trinidad

**Live demo:** https://gregory1506.github.io/fast-dem-trini/

Immersive 3D terrain of Trinidad & Tobago with wind‑driven trip trails, quantile color scaling, and clean layer controls. Built for fast visual exploration and public sharing.

---

**What you get**
1. High‑resolution terrain + satellite imagery
2. Wind trips with quantile‑based color scaling
3. In‑map legend + compass for quick orientation
4. Toggleable roads, rivers, and 3D buildings
5. Mobile‑friendly layer panel with swipe gestures

**Tech stack**
1. Vite + React + TypeScript
2. MapLibre GL for map rendering
3. deck.gl TripsLayer for wind trails
4. Open‑Meteo GFS API for wind data

**Local development**
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

**Controls**
1. Right‑click + drag to tilt/rotate (desktop)
2. Pinch/drag to navigate (mobile)
3. Swipe from the left edge to open the layer panel (mobile)

**Data & attribution**
1. Satellite imagery: Esri World Imagery
2. Terrain tiles: Terrarium (S3 elevation tiles)
3. Wind data: Open‑Meteo GFS
4. Roads, rivers, buildings: local GeoJSON sources in `public/`

**License**
MIT. See `LICENSE`.
