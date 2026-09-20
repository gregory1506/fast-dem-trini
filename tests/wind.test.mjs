import { test, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { WindDataService } from '../src/services/WindDataService.ts';
import { buildWindTrips } from '../src/utils/windTrips.ts';

const originalFetch = globalThis.fetch;
afterEach(() => { globalThis.fetch = originalFetch; });
const config = {
  bounds: { north: 11, south: 10, east: -60, west: -62 },
  gridRows: 2, gridCols: 2, cacheDuration: 3600000, particleCount: 4,
};
const response = () => Array.from({ length: 4 }, () => ({
  hourly: { time: ['2020-01-01T12:00'], wind_speed_10m: [6], wind_direction_10m: [90] },
}));

test('demo wind needs no network and blows west from the east', async () => {
  let calls = 0;
  globalThis.fetch = () => { calls++; throw new Error('Demo attempted network access'); };
  const service = new WindDataService({ ...config, demo: true });
  const grid = await service.fetchWindData();
  assert.match(grid.metadata.source, /Synthetic/);
  assert.equal(calls, 0, 'demo mode must not attempt a request');
  const wind = service.interpolateWind(-61, 10.5);
  assert.ok(wind.u < 0);
  assert.ok(Math.abs(wind.v) < 1e-10);
  assert.deepEqual(service.interpolateWind(-70, 10), { u: 0, v: 0 });
});

test('forecast timestamps are UTC and cache age uses fetch time', async () => {
  let calls = 0;
  globalThis.fetch = async () => { calls++; return { ok: true, json: async () => response() }; };
  const service = new WindDataService(config);
  const grid = await service.fetchWindData();
  assert.equal(grid.metadata.timestamp, Date.UTC(2020, 0, 1, 12));
  assert.equal(await service.fetchWindData(), grid);
  assert.equal(calls, 1, 'an old forecast timestamp must not immediately expire the fetch cache');
  assert.ok(Math.abs(service.interpolateWind(-61, 10.5).u + 6) < 1e-10);
});

test('concurrent fetches share one request', async () => {
  let calls = 0;
  globalThis.fetch = async () => { calls++; return { ok: true, json: async () => response() }; };
  const service = new WindDataService(config);
  const [grid, series] = await Promise.all([service.fetchWindData(), service.fetchWindSeries()]);
  assert.equal(calls, 1);
  assert.equal(grid, series[0]);
});

for (const [name, data] of [
  ['missing location', response().slice(1)],
  ['null speed', response().map(p => ({ hourly: { ...p.hourly, wind_speed_10m: [null] } }))],
  ['invalid timestamp', response().map(p => ({ hourly: { ...p.hourly, time: ['bad-time'] } }))],
]) {
  test(`${name} produces explicitly synthetic data`, async () => {
    globalThis.fetch = async () => ({ ok: true, json: async () => data });
    const grid = await new WindDataService(config).fetchWindData();
    assert.match(grid.metadata.source, /Synthetic/);
    assert.ok(grid.points.flat().every(p => Number.isFinite(p.u) && Number.isFinite(p.v)));
  });
}

test('network failures return labeled synthetic wind', async () => {
  globalThis.fetch = async () => { throw new Error('offline'); };
  assert.match((await new WindDataService(config).fetchWindData()).metadata.source, /Synthetic/);
});

test('trip paths stay in bounds and have increasing animation timestamps', async () => {
  const service = new WindDataService({ ...config, demo: true });
  await service.fetchWindData();
  const { trips, maxTime } = buildWindTrips(service, config.bounds, 5, 120, 1, 0.00025);
  assert.equal(trips.length, 5);
  assert.equal(maxTime, 120);
  for (const trip of trips) {
    assert.equal(trip.path.length, 120);
    assert.equal(trip.timestamps.length, 120);
    assert.ok(trip.speed > 0);
    trip.path.forEach(([lng, lat], i) => {
      assert.ok(lng >= -62 && lng <= -60 && lat >= 10 && lat <= 11);
      assert.equal(trip.timestamps[i], i);
    });
  }
});
