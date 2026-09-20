<div align="center">

# Fast DEM Trinidad & Tobago

**Explore the islands in 3D — terrain, wind trails and recent earthquakes.**

An interactive Caribbean geospatial viewer built with React, TypeScript, MapLibre GL JS and deck.gl.

[![Quality checks](https://github.com/gregory1506/fast-dem-trini/actions/workflows/ci.yml/badge.svg)](https://github.com/gregory1506/fast-dem-trini/actions/workflows/ci.yml)
[![GitHub Pages](https://github.com/gregory1506/fast-dem-trini/actions/workflows/deploy.yml/badge.svg)](https://github.com/gregory1506/fast-dem-trini/actions/workflows/deploy.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-22c55e.svg)](LICENSE)
[![Node.js 22](https://img.shields.io/badge/Node.js-22.x-339933?logo=nodedotjs&logoColor=white)](.nvmrc)

[**Explore the live map →**](https://gregory1506.github.io/fast-dem-trini/) · [Try wind demo](https://gregory1506.github.io/fast-dem-trini/?demo=1) · [Contribute](CONTRIBUTING.md) · [Hackathon](docs/HACKATHON.md)

</div>

![3D satellite terrain of Trinidad and Tobago with animated wind trails](docs/assets/readme-hero.png)

## The islands, layer by layer

Fast DEM Trinidad brings **Trinidad and Tobago terrain visualization**, satellite imagery, animated wind and regional earthquake data into one browser-based map. DEM stands for **digital elevation model**. Tilt the landscape, explore the coastline and switch on the layers you want to investigate.

| Layer | What you can explore |
| --- | --- |
| **3D terrain** | Satellite imagery over a digital elevation model, with 1.5× vertical exaggeration. |
| **Wind trails** | Animated, speed-coloured paths visible over both land and sea, using Open-Meteo GFS input. |
| **Recent earthquakes** | USGS events from the past 30 days within the map region; marker size shows magnitude and colour shows depth. |
| **Roads & rivers** | Local GeoJSON overlays of major roads and rivers from OpenStreetMap. |
| **Buildings** | Building footprints with illustrative 15 m extrusions, downloaded only when enabled. |

**Built for exploration:** desktop tilt and rotation, a mobile layer drawer, wind-source labels and earthquake details with Trinidad local times.

## Explore in a minute

1. Open the [live map](https://gregory1506.github.io/fast-dem-trini/).
2. Enable **Wind Trails** in the layer panel to see the animated flow across land and water.
3. Enable **Recent Earthquakes**, then click a marker or choose an event from the selector.
4. Right-click and drag on desktop to tilt and rotate; use touch navigation and the layer drawer on mobile.

Earthquakes refresh every five minutes while enabled. An empty regional feed is shown explicitly; a failed refresh keeps the previous data with a stale-data message. Coverage reflects events reported by USGS.

> **About the visualization:** terrain is exaggerated, building heights are illustrative, and wind paths are animated visualizations rather than physical trajectories or simulations of terrain-driven airflow. This prototype is not a surveying or operational weather tool.

## Run locally

You need **Node.js 22.19.0 or a later 22.x release**, npm and a WebGL-capable browser. No API keys, account, database or Python setup is required.

```sh
git clone https://github.com/gregory1506/fast-dem-trini.git
cd fast-dem-trini
nvm install
nvm use
npm ci
npm run dev
```

Open the URL printed by Vite, including **`/fast-dem-trini/`**. If you do not use nvm, install the version in [`.nvmrc`](.nvmrc) with your preferred version manager.

### Repeatable wind demo

Open `http://localhost:5173/fast-dem-trini/?demo=1` (use Vite’s actual port if different). This supplies labelled synthetic wind without contacting Open-Meteo. Wind trails start disabled; enable them in the layer panel.

Demo mode replaces **only wind data**. Satellite and elevation tiles still need internet access, and enabling earthquakes still requests the live USGS feed. Roads, rivers and buildings are checked into `public/`.

### Development commands

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start the Vite development server. |
| `npm run check` | Run zero-warning lint, network-free regression tests, TypeScript checks and the production build. |
| `npm test` | Run the network-free regression suite. |
| `npm run build` | Type-check and build the app into `dist/`. |
| `npm run preview` | Preview an existing production build locally. |

## Under the hood

| Area | Technology |
| --- | --- |
| Interface | React · TypeScript · Lucide icons |
| Map & terrain | MapLibre GL JS · Esri imagery · Terrarium elevation tiles |
| Wind rendering | deck.gl `TripsLayer` · Open-Meteo GFS |
| Earthquake data | USGS GeoJSON feed |
| Local map data | OpenStreetMap-derived GeoJSON |
| Tooling & hosting | Vite · ESLint · Node.js test runner · GitHub Actions · GitHub Pages |

The app runs in the browser with no backend. The active wind renderer uses deck.gl; the older custom WebGL particle renderer remains in the repository as historical code.

## Build with us

Contributions can improve map usability, accessibility, data clarity, rendering performance or test coverage. Start with the [contribution guide](CONTRIBUTING.md), choose a focused change and run `npm run check` before opening a pull request.

### October 2026 hackathon

The proposed format is a **repository improvement competition**: teams submit tested changes and a two-minute demo, with maintainers deciding what to merge after judging. The [event brief and task board](docs/HACKATHON.md) include beginner-to-advanced tasks, acceptance criteria, a proposed schedule and a pre-event checklist. Dates, team size and participants remain organizer decisions.

## Project guides

| Guide | Start here when you want to… |
| --- | --- |
| [Architecture](docs/ARCHITECTURE.md) | Understand the map lifecycle, wind data and active renderer. |
| [Data inventory](docs/DATA.md) | Review source URLs, local dataset coverage, sizes and known gaps. |
| [Contributing](CONTRIBUTING.md) | Set up a contribution, validate a change or troubleshoot locally. |
| [Deployment](docs/deployment.md) | Publish with GitHub Pages or configure a fork. |
| [Repository review](docs/REPO_REVIEW.md) | Explore technical findings and improvement opportunities. |

Pull requests run quality checks. Updates to `main` run checks before GitHub Pages deployment. Forks must update the Vite base path and enable GitHub Pages.

## Data credits & license

Map imagery comes from **Esri**, elevation from **Terrarium tiles**, wind input from **Open-Meteo GFS**, regional earthquakes from **USGS**, and local roads, rivers and building footprints from **OpenStreetMap**.

The code is [MIT licensed](LICENSE). Third-party datasets and imagery retain their own terms; see the [data notes](docs/DATA.md) for provenance limitations and attribution follow-ups.

## Keywords & hashtags

**Keywords:** Trinidad and Tobago, Caribbean GIS, 3D terrain map, digital elevation model, DEM viewer, geospatial visualization, WebGL mapping, wind visualization, animated wind trails, regional earthquakes, satellite imagery, GeoJSON, MapLibre GL JS, deck.gl, OpenStreetMap, Open-Meteo, USGS, React, TypeScript, open source.

**Hashtags:** #TrinidadAndTobago #CaribbeanGIS #Geospatial #GIS #DigitalElevationModel #3DMapping #WindVisualization #EarthquakeData #MapLibre #DeckGL #OpenStreetMap #OpenSource
