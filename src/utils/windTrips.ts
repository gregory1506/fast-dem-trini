import type { WindDataService } from '../services/WindDataService';

export type WindTrip = {
  id: string;
  path: [number, number][];
  timestamps: number[];
  speed: number;
};

type Bounds = { north: number; south: number; east: number; west: number };

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

export const buildWindTrips = (
  windService: WindDataService,
  bounds: Bounds,
  tripCount: number,
  steps: number,
  stepSeconds: number,
  stepScale: number
): { trips: WindTrip[]; maxTime: number } => {
  const trips: WindTrip[] = [];
  const seriesLength = Math.max(0, windService.getTimeSeriesLength());

  for (let i = 0; i < tripCount; i += 1) {
    let lng = bounds.west + Math.random() * (bounds.east - bounds.west);
    let lat = bounds.south + Math.random() * (bounds.north - bounds.south);
    let time = 0;
    let speedSum = 0;

    const path: [number, number][] = [];
    const timestamps: number[] = [];

    for (let step = 0; step < steps; step += 1) {
      const timeIndex =
        seriesLength > 1
          ? Math.floor((step / Math.max(1, steps - 1)) * (seriesLength - 1))
          : 0;
      const wind =
        seriesLength > 1
          ? windService.interpolateWindAtTime(lng, lat, timeIndex)
          : windService.interpolateWind(lng, lat);
      const speed = Math.sqrt(wind.u * wind.u + wind.v * wind.v);
      speedSum += speed;

      path.push([lng, lat]);
      timestamps.push(time);

      lng = clamp(lng + wind.u * stepScale, bounds.west, bounds.east);
      lat = clamp(lat + wind.v * stepScale, bounds.south, bounds.north);
      time += stepSeconds;
    }

    trips.push({
      id: `trip-${i}`,
      path,
      timestamps,
      speed: speedSum / Math.max(1, steps),
    });
  }

  return { trips, maxTime: steps * stepSeconds };
};
