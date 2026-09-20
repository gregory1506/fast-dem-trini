import type { FeatureCollection, Point } from 'geojson';

export const EARTHQUAKE_FEED = 'https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_month.geojson';
export interface EarthquakeProperties {
  magnitude: number | null;
  depth: number;
  place: string;
  time: number;
}
export type EarthquakeCollection = FeatureCollection<Point, EarthquakeProperties>;
type Bounds = { north: number; south: number; east: number; west: number };

/** Validate untrusted feed data and keep only earthquakes in the map's region. */
export function parseEarthquakes(data: unknown, bounds: Bounds): EarthquakeCollection {
  if (!data || typeof data !== 'object' || !('type' in data) || data.type !== 'FeatureCollection' ||
      !('features' in data) || !Array.isArray(data.features)) throw new Error('Invalid USGS feed');
  const features: EarthquakeCollection['features'] = [];
  for (const feature of data.features) {
    const coordinates = feature?.geometry?.coordinates;
    const properties = feature?.properties;
    if (feature?.geometry?.type !== 'Point' || !Array.isArray(coordinates) ||
        coordinates.length < 3 || !coordinates.slice(0, 3).every(Number.isFinite) ||
        properties?.type !== 'earthquake' || !Number.isFinite(properties.time) ||
        !Number.isFinite(new Date(properties.time).getTime())) continue;
    const [lng, lat, depth] = coordinates;
    if (lng < bounds.west || lng > bounds.east || lat < bounds.south || lat > bounds.north) continue;
    features.push({
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [lng, lat] },
      properties: {
        magnitude: Number.isFinite(properties.mag) ? properties.mag : null,
        depth,
        place: typeof properties.place === 'string' ? properties.place : 'Location not reported',
        time: properties.time,
      },
    });
  }
  features.sort((a, b) => b.properties.time - a.properties.time);
  return { type: 'FeatureCollection', features };
}

export const formatEarthquakeTime = (time: number) => new Intl.DateTimeFormat('en-TT', {
  dateStyle: 'medium', timeStyle: 'short', timeZone: 'America/Port_of_Spain',
}).format(time);
