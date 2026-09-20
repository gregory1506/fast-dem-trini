# Data inventory

Inventory inspected 2026-09-19. File counts and bounds are measured from the
checked-in files; retrieval dates and exact upstream dataset versions are not
recorded. Bounding boxes are extent checks, not evidence of complete coverage.

| Layer | Source in code | Local data / behavior | Known limitation |
| --- | --- | --- | --- |
| Satellite | Esri World Imagery raster endpoint in `App.tsx` | Network tiles | No offline package or imagery capture date displayed |
| Terrain | `https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png` | Terrarium raster DEM, zooms 0–15 | No documented local vertical accuracy; displayed at 1.5× exaggeration |
| Wind | `https://api.open-meteo.com/v1/gfs` | 8×8 locations, 18 hours, m/s, UTC | Coarse model input; visual paths do not model terrain interactions |
| Roads | OSM ways via `fetch_osm_data.py` | 2,344 LineStrings; ~1.2 MiB | Query selects motorway/trunk/primary, not all roads |
| Rivers | OSM ways via `fetch_osm_data.py` | 361 LineStrings; ~456 KiB | Query selects rivers, not all streams |
| Buildings | OSM ways via `fetch_osm_data.py` | 130,039 Polygons; ~34 MiB | OSM coverage varies; extrusion is always 15 m |

Measured bounds, ordered west/south/east/north:

- Roads: `[-61.6842904, 10.143733, -60.5329641, 11.3246857]`.
- Rivers: `[-61.7979911, 10.0676079, -60.540526, 11.3053958]`.
- Buildings: `[-61.9300702, 10.0434952, -60.504043, 11.3338607]`.

The extraction script requests OSM data for the TT administrative area using
Overpass. The repo does not contain a capture manifest linking these snapshots
to exact query runs. Do not claim survey-grade or complete island-wide coverage.

The map includes Esri and OpenStreetMap credit. Before public event publication,
assign a data steward to record upstream attribution/usage requirements for
every layer, including terrain and wind, and implement any missing required
links. The code's MIT license does not establish rights to third-party data.
This review did not perform an upstream licensing audit.

For any new or refreshed dataset, record source, extraction date, query/version,
coordinate reference system, bounds, feature count, units, license/attribution,
known exclusions, and file size. Validate the file before replacing the current
snapshot. Do not run the overwrite-oriented extraction script casually.
