import { useEffect, useRef, useState } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { Mountain, MousePointer2, Layers, Car, Droplets, Building2, Wind } from 'lucide-react';
import { MapboxOverlay } from '@deck.gl/mapbox';
import { COORDINATE_SYSTEM } from '@deck.gl/core';
import { TripsLayer } from '@deck.gl/geo-layers';
import { WindDataService } from './services/WindDataService';
import type { WindGrid } from './services/WindDataTypes';
import { buildWindTrips, type WindTrip } from './utils/windTrips';

const TRINIDAD_TOBAGO_COORDS: [number, number] = [-61.3, 10.8];
const TRINIDAD_TOBAGO_BOUNDS = {
  north: 12.1,
  south: 9.2,
  east: -59.7,
  west: -62.9,
};

function App() {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const windDataServiceRef = useRef<WindDataService | null>(null);
  const deckOverlayRef = useRef<MapboxOverlay | null>(null);
  const tripsRef = useRef<WindTrip[]>([]);
  const maxTripTimeRef = useRef<number>(0);
  const animationFrameRef = useRef<number | null>(null);
  const currentTimeRef = useRef<number>(0);
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);
  const touchDeltaRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const [mapLoaded, setMapLoaded] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [panelOpen, setPanelOpen] = useState(true);
  const [legendBands, setLegendBands] = useState<number[]>([0, 4, 8, 12, 16, 20]);
  const [layers, setLayers] = useState({
    roads: false,
    rivers: false,
    buildings: false,
    trips: false
  });

  const buildLegendBands = (grid: WindGrid): number[] => {
    const speeds: number[] = [];
    for (const row of grid.points) {
      for (const point of row) {
        speeds.push(point.speed || 0);
      }
    }

    if (speeds.length === 0) {
      return [0, 0, 0, 0, 0, 0];
    }

    speeds.sort((a, b) => a - b);
    const n = speeds.length;
    const quantile = (p: number) => speeds[Math.floor(p * (n - 1))];

    const bands = [0, 0.2, 0.4, 0.6, 0.8, 1].map(quantile);
    const min = bands[0];
    const max = bands[bands.length - 1];

    if (max - min < 0.1) {
      return Array(6).fill(Number(min.toFixed(1)));
    }

    const rounded = bands.map((value) => Number(value.toFixed(1)));
    for (let i = 1; i < rounded.length; i += 1) {
      rounded[i] = Math.max(rounded[i], rounded[i - 1]);
    }
    return rounded;
  };

  const formatSpeed = (value: number) => (Number.isInteger(value) ? value.toFixed(0) : value.toFixed(1));

  const getQuantileColor = (speed: number): [number, number, number] => {
    const bands = legendBands.length === 6 ? legendBands : [0, 4, 8, 12, 16, 20];
    const colors: [number, number, number][] = [
      [125, 211, 252],
      [56, 189, 248],
      [34, 211, 238],
      [34, 197, 94],
      [245, 158, 11],
    ];

    if (speed <= bands[1]) return colors[0];
    if (speed <= bands[2]) return colors[1];
    if (speed <= bands[3]) return colors[2];
    if (speed <= bands[4]) return colors[3];
    return colors[4];
  };

  const buildTripsLayer = (currentTime: number) => {
    if (!layers.trips || tripsRef.current.length === 0) return null;

    return new TripsLayer<WindTrip>({
      id: 'wind-trips-layer',
      data: tripsRef.current,
      getPath: (d: WindTrip) => d.path,
      getTimestamps: (d: WindTrip) => d.timestamps,
      getColor: (d: WindTrip) => getQuantileColor(d.speed),
      opacity: 0.9,
      widthMinPixels: 2.0,
      jointRounded: true,
      capRounded: true,
      trailLength: 90,
      coordinateSystem: COORDINATE_SYSTEM.LNGLAT,
      currentTime,
    });
  };

  const updateDeckLayers = (currentTime: number) => {
    const overlay = deckOverlayRef.current;
    if (!overlay) return;
    const tripsLayer = buildTripsLayer(currentTime);
    overlay.setProps({ layers: tripsLayer ? [tripsLayer] : [] });
  };

  useEffect(() => {
    const media = window.matchMedia('(max-width: 640px)');
    const update = () => {
      setIsMobile(media.matches);
      setPanelOpen(!media.matches);
    };

    update();
    if (media.addEventListener) {
      media.addEventListener('change', update);
      return () => media.removeEventListener('change', update);
    }

    media.addListener(update);
    return () => media.removeListener(update);
  }, []);

  const handleEdgeTouchStart = (event: React.TouchEvent<HTMLDivElement>) => {
    const touch = event.touches[0];
    if (!touch) return;
    touchStartRef.current = { x: touch.clientX, y: touch.clientY };
    touchDeltaRef.current = { x: 0, y: 0 };
  };

  const handleEdgeTouchMove = (event: React.TouchEvent<HTMLDivElement>) => {
    const touch = event.touches[0];
    if (!touchStartRef.current || !touch) return;
    touchDeltaRef.current = {
      x: touch.clientX - touchStartRef.current.x,
      y: touch.clientY - touchStartRef.current.y,
    };
  };

  const handleEdgeTouchEnd = () => {
    const { x, y } = touchDeltaRef.current;
    if (x > 50 && Math.abs(y) < 40) {
      setPanelOpen(true);
    }
    touchStartRef.current = null;
    touchDeltaRef.current = { x: 0, y: 0 };
  };

  const handlePanelTouchStart = (event: React.TouchEvent<HTMLDivElement>) => {
    const touch = event.touches[0];
    if (!touch) return;
    touchStartRef.current = { x: touch.clientX, y: touch.clientY };
    touchDeltaRef.current = { x: 0, y: 0 };
  };

  const handlePanelTouchMove = (event: React.TouchEvent<HTMLDivElement>) => {
    const touch = event.touches[0];
    if (!touchStartRef.current || !touch) return;
    touchDeltaRef.current = {
      x: touch.clientX - touchStartRef.current.x,
      y: touch.clientY - touchStartRef.current.y,
    };
  };

  const handlePanelTouchEnd = () => {
    const { x, y } = touchDeltaRef.current;
    if (x < -50 && Math.abs(y) < 40) {
      setPanelOpen(false);
    }
    touchStartRef.current = null;
    touchDeltaRef.current = { x: 0, y: 0 };
  };

  useEffect(() => {
    if (!mapContainer.current || mapRef.current) return;

    // Initialize MapLibre
    const map = new maplibregl.Map({
      container: mapContainer.current,
      style: {
        version: 8,
        sources: {
          'satellite': {
            type: 'raster',
            tiles: [
              'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'
            ],
            tileSize: 256,
            attribution: '© Esri & Contributors',
            maxzoom: 19
          },
          'terrainSource': {
            type: 'raster-dem',
            tiles: [
              'https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png'
            ],
            encoding: 'terrarium',
            tileSize: 256,
            minzoom: 0,
            maxzoom: 15
          },
          // Vector Features Sources
          'roadsSource': {
            type: 'geojson',
            data: `${import.meta.env.BASE_URL}roads.geojson`
          },
          'riversSource': {
            type: 'geojson',
            data: `${import.meta.env.BASE_URL}rivers.geojson`
          },
          'buildingsSource': {
            type: 'geojson',
            data: `${import.meta.env.BASE_URL}buildings.geojson`
          }
        },
        layers: [
          {
            id: 'satellite-layer',
            type: 'raster',
            source: 'satellite',
            paint: {
              'raster-fade-duration': 0
            }
          },
          // Road layer setup
          {
            id: 'roads-layer',
            type: 'line',
            source: 'roadsSource',
            layout: {
              'visibility': 'none',
              'line-join': 'round',
              'line-cap': 'round'
            },
            paint: {
              'line-color': '#ffb703',
              'line-width': 2,
              'line-opacity': 0.8
            }
          },
          // Rivers layer setup
          {
            id: 'rivers-layer',
            type: 'line',
            source: 'riversSource',
            layout: {
              'visibility': 'none',
              'line-join': 'round',
              'line-cap': 'round'
            },
            paint: {
              'line-color': '#00b4d8',
              'line-width': 3,
              'line-opacity': 0.8
            }
          },
          // Buildings layer setup - utilizing 3D extrusion since we have terrain
          {
            id: 'buildings-layer',
            type: 'fill-extrusion', // 3D buildings!
            source: 'buildingsSource',
            layout: {
              'visibility': 'none'
            },
            paint: {
              'fill-extrusion-color': '#ffffff',
              'fill-extrusion-height': 15, // Default height if no levels tag
              'fill-extrusion-base': 0,
              'fill-extrusion-opacity': 0.7
            }
          }
        ],
        terrain: {
          source: 'terrainSource',
          exaggeration: 1.5 // Enhances the 3D effect of the terrain
        }
      },
      center: TRINIDAD_TOBAGO_COORDS,
      zoom: 8.8,
      pitch: 60,
      bearing: -20,
      maxPitch: 85,
      maxZoom: 18,
      minZoom: 8.0,
      maxBounds: [
        [TRINIDAD_TOBAGO_BOUNDS.west, TRINIDAD_TOBAGO_BOUNDS.south],
        [TRINIDAD_TOBAGO_BOUNDS.east, TRINIDAD_TOBAGO_BOUNDS.north],
      ],
      // @ts-ignore
      antialias: true // creates smoother 3D edges
    });

    map.on('load', async () => {
      setMapLoaded(true);
      map.jumpTo({ bearing: 0, pitch: 60 });

      // Add sky feature for more realistic horizon
      map.setSky({
        "sky-color": "#199EF3",
        "sky-horizon-blend": 0.5,
        "horizon-color": "#ffffff",
        "horizon-fog-blend": 0.5,
        "fog-color": "#0000ff",
        "fog-ground-blend": 0.5,
        "atmosphere-blend": [
          "interpolate",
          ["linear"],
          ["zoom"],
          0,
          1,
          10,
          1,
          12,
          0
        ]
      });

      // Initialize wind data service
      const windService = new WindDataService({
        bounds: TRINIDAD_TOBAGO_BOUNDS,
        cacheDuration: 3600000, // 1 hour
        particleCount: 875,
        forecastHours: 18
      });
      windDataServiceRef.current = windService;

      const overlay = new MapboxOverlay({ layers: [], interleaved: true });
      deckOverlayRef.current = overlay;
      map.addControl(overlay);

      // Fetch initial wind data
      try {
        const grid = await windService.fetchWindData();
        setLegendBands(buildLegendBands(grid));

        const { trips, maxTime } = buildWindTrips(
          windService,
          TRINIDAD_TOBAGO_BOUNDS,
          300,
          120,
          1,
          0.00025
        );
        tripsRef.current = trips;
        maxTripTimeRef.current = maxTime;
        console.log('Wind data loaded successfully');
      } catch (error) {
        console.error('Failed to load wind data:', error);
      }
    });

    // Add navigation controls (zoom, tilt, compass)
    map.addControl(
      new maplibregl.NavigationControl({
        visualizePitch: true,
        showZoom: true,
        showCompass: true
      }),
      'bottom-right'
    );

    // Add full-screen control
    map.addControl(new maplibregl.FullscreenControl(), 'bottom-right');

    mapRef.current = map;

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (deckOverlayRef.current) {
        map.removeControl(deckOverlayRef.current);
        deckOverlayRef.current = null;
      }
      map.remove();
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!mapLoaded) return;

    const animate = () => {
      const maxTime = maxTripTimeRef.current || 1;
      currentTimeRef.current = (currentTimeRef.current + 0.35) % maxTime;
      updateDeckLayers(currentTimeRef.current);
      animationFrameRef.current = requestAnimationFrame(animate);
    };

    if (layers.trips) {
      animationFrameRef.current = requestAnimationFrame(animate);
    } else {
      updateDeckLayers(currentTimeRef.current);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
    }

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
    };
  }, [layers.trips, mapLoaded]);

  // Update layer visibility when toggles change
  useEffect(() => {
    if (!mapLoaded || !mapRef.current) return;

    const map = mapRef.current;

    map.setLayoutProperty('roads-layer', 'visibility', layers.roads ? 'visible' : 'none');
    map.setLayoutProperty('rivers-layer', 'visibility', layers.rivers ? 'visible' : 'none');
    map.setLayoutProperty('buildings-layer', 'visibility', layers.buildings ? 'visible' : 'none');

  }, [layers, mapLoaded]);

  const toggleLayer = (layerName: keyof typeof layers) => {
    setLayers(prev => ({
      ...prev,
      [layerName]: !prev[layerName]
    }));
  };

  return (
    <>
      <div ref={mapContainer} className="map-container" />

      <div className={`ui-overlay ${panelOpen ? 'open' : 'closed'}`}>
        <div
          className="glass-panel"
          onTouchStart={isMobile ? handlePanelTouchStart : undefined}
          onTouchMove={isMobile ? handlePanelTouchMove : undefined}
          onTouchEnd={isMobile ? handlePanelTouchEnd : undefined}
        >
          <div className="panel-header">
            <h1><Mountain size={26} color="#38bdf8" /> EarthDEM Viewer</h1>
            <span className="panel-badge">Live Terrain</span>
          </div>
          <p className="subtitle">Interactive 3D elevation map of Trinidad & Tobago.</p>

          <div className="section-title">
            <Layers size={14} /> Map Layers
          </div>

          <div className="controls-hint map-layers-container">
            <button
              className={`layer-toggle ${layers.roads ? 'active' : ''}`}
              onClick={() => toggleLayer('roads')}
            >
              <Car size={18} /> Major Roads
            </button>

            <button
              className={`layer-toggle ${layers.rivers ? 'active' : ''}`}
              onClick={() => toggleLayer('rivers')}
            >
              <Droplets size={18} /> Rivers & Streams
            </button>

            <button
              className={`layer-toggle ${layers.buildings ? 'active' : ''}`}
              onClick={() => toggleLayer('buildings')}
            >
              <Building2 size={18} /> 3D Buildings (Island-wide)
            </button>

            <button
              className={`layer-toggle ${layers.trips ? 'active' : ''}`}
              onClick={() => toggleLayer('trips')}
            >
              <Wind size={18} /> Wind Trips (deck.gl)
            </button>
          </div>

          <div className="controls-hint" style={{ marginTop: '16px' }}>
            <div className="icon-wrapper">
              <MousePointer2 size={20} />
            </div>
            <div>
              <strong>Right-click & Drag</strong>
              <div style={{ fontSize: '0.8rem', opacity: 0.8 }}>Tilt and rotate the camera</div>
            </div>
          </div>
        </div>
      </div>

      {isMobile && (
        <>
          <div
            className={`panel-scrim ${panelOpen ? 'show' : ''}`}
            onClick={() => setPanelOpen(false)}
          />
          {!panelOpen && (
            <button className="panel-handle" onClick={() => setPanelOpen(true)}>
              Layers
            </button>
          )}
          {!panelOpen && (
            <div
              className="swipe-edge"
              onTouchStart={handleEdgeTouchStart}
              onTouchMove={handleEdgeTouchMove}
              onTouchEnd={handleEdgeTouchEnd}
            />
          )}
        </>
      )}

      <div className="north-arrow" aria-label="North">
        <div className="north-arrow-circle">
          <div className="north-arrow-needle" />
          <div className="north-arrow-cap" />
        </div>
        <div className="north-arrow-label">N</div>
      </div>

      <div className="map-legend">
        <div className="legend-title">Wind Speed (m/s) · Quantiles</div>
        <div className="legend-row">
          <span className="legend-item"><span className="legend-swatch swatch-1" />{formatSpeed(legendBands[0])}-{formatSpeed(legendBands[1])}</span>
          <span className="legend-item"><span className="legend-swatch swatch-2" />{formatSpeed(legendBands[1])}-{formatSpeed(legendBands[2])}</span>
          <span className="legend-item"><span className="legend-swatch swatch-3" />{formatSpeed(legendBands[2])}-{formatSpeed(legendBands[3])}</span>
          <span className="legend-item"><span className="legend-swatch swatch-4" />{formatSpeed(legendBands[3])}-{formatSpeed(legendBands[4])}</span>
          <span className="legend-item"><span className="legend-swatch swatch-5" />{formatSpeed(legendBands[4])}+</span>
        </div>
      </div>
    </>
  );
}

export default App;
