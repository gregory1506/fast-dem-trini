import { useEffect, useState } from 'react';
import maplibregl from 'maplibre-gl';
import { EARTHQUAKE_FEED, parseEarthquakes, formatEarthquakeTime } from '../services/earthquakes';
import type { EarthquakeCollection } from '../services/earthquakes';

const SOURCE = 'earthquakes-source';
const LAYER = 'earthquakes-layer';
const REFRESH_MS = 5 * 60 * 1000;
type Props = { map: maplibregl.Map; bounds: { north: number; south: number; east: number; west: number } };

export function EarthquakeLayer({ map, bounds }: Props) {
  const [status, setStatus] = useState('Loading USGS earthquakes…');
  const [events, setEvents] = useState<EarthquakeCollection['features']>([]);
  const [selected, setSelected] = useState<EarthquakeCollection['features'][number] | null>(null);

  useEffect(() => {
    let disposed = false;
    let busy = false;
    let lastSuccess = '';
    const controller = new AbortController();
    map.addSource(SOURCE, {
      type: 'geojson', data: { type: 'FeatureCollection', features: [] },
      attribution: '<a href="https://earthquake.usgs.gov/">USGS earthquakes</a>',
    });
    map.addLayer({
      id: LAYER, type: 'circle', source: SOURCE,
      paint: {
        'circle-radius': ['interpolate', ['linear'], ['coalesce', ['get', 'magnitude'], 0], 0, 5, 3, 9, 5, 16, 7, 25],
        'circle-color': ['step', ['get', 'depth'], '#fbbf24', 70, '#fb7185', 300, '#c4b5fd'],
        'circle-opacity': 0.8, 'circle-stroke-width': 2, 'circle-stroke-color': '#fff',
        'circle-pitch-alignment': 'viewport',
      },
    });
    const click = (event: maplibregl.MapLayerMouseEvent) => {
      const feature = event.features?.[0];
      if (feature) setSelected(feature as unknown as EarthquakeCollection['features'][number]);
    };
    const enter = () => { map.getCanvas().style.cursor = 'pointer'; };
    const leave = () => { map.getCanvas().style.cursor = ''; };
    map.on('click', LAYER, click);
    map.on('mouseenter', LAYER, enter);
    map.on('mouseleave', LAYER, leave);

    const refresh = async () => {
      if (busy) return;
      busy = true;
      try {
        const response = await fetch(EARTHQUAKE_FEED, {
          signal: AbortSignal.any([controller.signal, AbortSignal.timeout(15000)]),
        });
        if (!response.ok) throw new Error(`USGS returned ${response.status}`);
        const data = parseEarthquakes(await response.json(), bounds);
        if (disposed) return;
        (map.getSource(SOURCE) as maplibregl.GeoJSONSource).setData(data);
        setEvents(data.features);
        lastSuccess = formatEarthquakeTime(Date.now());
        setStatus(`${data.features.length} reported in this region · Checked ${lastSuccess} (Trinidad time)`);
      } catch {
        if (!disposed) setStatus(lastSuccess
          ? `Refresh failed · Showing data checked ${lastSuccess} (Trinidad time). Retrying every 5 minutes.`
          : 'USGS unavailable · Retrying every 5 minutes. Toggle off and on to retry now.');
      } finally { busy = false; }
    };
    void refresh();
    const timer = window.setInterval(() => { void refresh(); }, REFRESH_MS);
    return () => {
      disposed = true;
      controller.abort();
      window.clearInterval(timer);
      map.off('click', LAYER, click);
      map.off('mouseenter', LAYER, enter);
      map.off('mouseleave', LAYER, leave);
      // The parent may already have removed the map during unmount.
      if (map.getLayer(LAYER)) map.removeLayer(LAYER);
      if (map.getSource(SOURCE)) map.removeSource(SOURCE);
      map.getCanvas().style.cursor = '';
    };
  }, [map, bounds]);

  return <section className="earthquake-panel" aria-label="Recent earthquakes">
    <div className="legend-title">Earthquakes · Past 30 days</div>
    <p role="status">{status}</p>
    <div className="earthquake-depths" aria-label="Marker colour by depth">
      <span><i style={{ background: '#fbbf24' }} /> &lt;70 km</span>
      <span><i style={{ background: '#fb7185' }} /> 70–299 km</span>
      <span><i style={{ background: '#c4b5fd' }} /> ≥300 km</span>
    </div>
    <p>Larger circles = stronger magnitude. Select a marker or an event below.</p>
    {events.length > 0 && <select aria-label="Select an earthquake" defaultValue="" onChange={event => {
      const feature = events[Number(event.target.value)];
      setSelected(feature);
      map.easeTo({ center: feature.geometry.coordinates as [number, number], duration: 500 });
    }}>
      <option value="" disabled>Select an earthquake…</option>
      {events.map((event, index) => <option key={`${event.properties.time}-${index}`} value={index}>
        M {event.properties.magnitude ?? '?'} · {event.properties.place}
      </option>)}
    </select>}
    {selected && <div className="earthquake-details" aria-live="polite">
      <strong>M {selected.properties.magnitude ?? '?'} · {selected.properties.place}</strong>
      <p>Depth: {selected.properties.depth.toFixed(1)} km</p>
      <p>{formatEarthquakeTime(selected.properties.time)} (Trinidad time)</p>
    </div>}
    <a href="https://earthquake.usgs.gov/earthquakes/feed/v1.0/geojson.php" target="_blank" rel="noreferrer">Source: USGS</a>
    <span> · Refreshes every 5 min</span>
  </section>;
}
