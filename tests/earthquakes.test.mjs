import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseEarthquakes, formatEarthquakeTime } from '../src/services/earthquakes.ts';

const bounds = { north: 12.1, south: 9.2, east: -59.7, west: -62.9 };
const event = (properties = {}, coordinates = [-61, 10.5, 80]) => ({
  type: 'Feature', geometry: { type: 'Point', coordinates },
  properties: { type: 'earthquake', mag: 4, time: 1000, place: 'Test event', ...properties },
});
const feed = features => ({ type: 'FeatureCollection', features });

test('filters outside region, non-earthquakes and malformed events; sorts latest first', () => {
  const result = parseEarthquakes(feed([
    event(), event({ time: 2000 }), event({}, [-70, 10, 5]),
    event({ type: 'quarry blast' }), event({ time: null }), event({}, [-61, 10, null]), null,
  ]), bounds);
  assert.deepEqual(result.features.map(f => f.properties.time), [2000, 1000]);
  assert.deepEqual(result.features[0].geometry.coordinates, [-61, 10.5]);
  assert.equal(result.features[0].properties.depth, 80);
});

test('unknown magnitude stays unknown and invalid feeds are not empty success', () => {
  assert.equal(parseEarthquakes(feed([event({ mag: null })]), bounds).features[0].properties.magnitude, null);
  assert.throws(() => parseEarthquakes({ error: 'unavailable' }, bounds), /Invalid USGS/);
  assert.deepEqual(parseEarthquakes(feed([]), bounds).features, []);
});

test('event time explicitly uses Trinidad timezone across UTC midnight', () => {
  assert.match(formatEarthquakeTime(Date.UTC(2026, 8, 20, 2)), /19 Sept 2026/);
});
