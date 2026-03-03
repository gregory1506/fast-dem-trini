/**
 * Wind Interpolation Utilities
 * Provides bilinear interpolation for smooth wind field calculations
 */

import type { WindGrid } from '../services/WindDataTypes';

/**
 * Performs bilinear interpolation on a wind grid to get wind vector at any point
 * @param grid The wind data grid
 * @param lng Longitude of the point to interpolate
 * @param lat Latitude of the point to interpolate
 * @returns Wind vector {u, v} at the specified point
 */
export function interpolateWindVector(
  grid: WindGrid,
  lng: number,
  lat: number
): { u: number; v: number } {
  const { points, metadata } = grid;
  const { bounds, rows, cols } = metadata;

  // Check if point is within bounds
  if (lng < bounds.west || lng > bounds.east || lat < bounds.south || lat > bounds.north) {
    return { u: 0, v: 0 };
  }

  // Normalize coordinates to grid space (0 to rows-1, 0 to cols-1)
  const latNorm = (bounds.north - lat) / (bounds.north - bounds.south);
  const lngNorm = (lng - bounds.west) / (bounds.east - bounds.west);

  const row = latNorm * (rows - 1);
  const col = lngNorm * (cols - 1);

  // Get integer indices of the four surrounding grid points
  const row0 = Math.floor(row);
  const col0 = Math.floor(col);
  const row1 = Math.min(row0 + 1, rows - 1);
  const col1 = Math.min(col0 + 1, cols - 1);

  // Get the four surrounding grid points
  const p00 = points[row0][col0]; // Top-left
  const p01 = points[row0][col1]; // Top-right
  const p10 = points[row1][col0]; // Bottom-left
  const p11 = points[row1][col1]; // Bottom-right

  // Calculate interpolation weights
  const dy = row - row0; // 0 to 1
  const dx = col - col0; // 0 to 1

  // Bilinear interpolation for U component
  const u =
    p00.u * (1 - dx) * (1 - dy) + // Top-left weight
    p01.u * dx * (1 - dy) + // Top-right weight
    p10.u * (1 - dx) * dy + // Bottom-left weight
    p11.u * dx * dy; // Bottom-right weight

  // Bilinear interpolation for V component
  const v =
    p00.v * (1 - dx) * (1 - dy) +
    p01.v * dx * (1 - dy) +
    p10.v * (1 - dx) * dy +
    p11.v * dx * dy;

  return { u, v };
}

/**
 * Converts wind U/V components to speed and direction
 * @param u U-component (east-west) in m/s
 * @param v V-component (north-south) in m/s
 * @returns {speed, direction} Speed in m/s and direction in degrees (0-360, 0=North)
 */
export function uvToSpeedDirection(u: number, v: number): { speed: number; direction: number } {
  const speed = Math.sqrt(u * u + v * v);

  // Calculate direction in mathematical angle (0° = East, counterclockwise)
  let angleRad = Math.atan2(v, u);

  // Convert to meteorological direction (0° = North, clockwise, "from" direction)
  let direction = (270 - (angleRad * 180) / Math.PI) % 360;
  if (direction < 0) direction += 360;

  return { speed, direction };
}

/**
 * Applies Perlin-like noise to wind field for visual turbulence
 * This adds realistic variation to the wind field visualization
 * @param u Base U-component
 * @param v Base V-component
 * @param lng Longitude for noise seed
 * @param lat Latitude for noise seed
 * @param time Time factor for animation
 * @param intensity Noise intensity (0-1)
 * @returns Modified {u, v} with added turbulence
 */
export function addTurbulence(
  u: number,
  v: number,
  lng: number,
  lat: number,
  time: number,
  intensity: number = 0.1
): { u: number; v: number } {
  // Simple pseudo-random noise based on position and time
  const noise1 = Math.sin(lng * 10 + time * 0.001) * Math.cos(lat * 10);
  const noise2 = Math.cos(lng * 10 - time * 0.001) * Math.sin(lat * 10);

  return {
    u: u + noise1 * intensity * Math.sqrt(u * u + v * v),
    v: v + noise2 * intensity * Math.sqrt(u * u + v * v),
  };
}

/**
 * Maps wind speed to a color value for visualization
 * @param speed Wind speed in m/s
 * @returns RGB color object {r, g, b} with values 0-1
 */
export function speedToColor(speed: number): { r: number; g: number; b: number } {
  const clampedSpeed = Math.min(speed, 20);
  const t = clampedSpeed / 20; // Normalize to 0-1

  if (t < 0.2) {
    // Sky to blue (0-4 m/s)
    const localT = t / 0.2;
    return {
      r: 0.49 * (1 - localT) + 0.22 * localT,
      g: 0.83 * (1 - localT) + 0.74 * localT,
      b: 0.99 * (1 - localT) + 0.97 * localT,
    };
  } else if (t < 0.4) {
    // Blue to cyan (4-8 m/s)
    const localT = (t - 0.2) / 0.2;
    return {
      r: 0.22 * (1 - localT) + 0.13 * localT,
      g: 0.74 * (1 - localT) + 0.83 * localT,
      b: 0.97 * (1 - localT) + 0.93 * localT,
    };
  } else if (t < 0.6) {
    // Cyan to green (8-12 m/s)
    const localT = (t - 0.4) / 0.2;
    return {
      r: 0.13 * (1 - localT) + 0.13 * localT,
      g: 0.83 * (1 - localT) + 0.77 * localT,
      b: 0.93 * (1 - localT) + 0.37 * localT,
    };
  } else if (t < 0.8) {
    // Green to lime (12-16 m/s)
    const localT = (t - 0.6) / 0.2;
    return {
      r: 0.13 * (1 - localT) + 0.64 * localT,
      g: 0.77 * (1 - localT) + 0.9 * localT,
      b: 0.37 * (1 - localT) + 0.21 * localT,
    };
  } else {
    // Lime to amber (16-20+ m/s)
    const localT = (t - 0.8) / 0.2;
    return {
      r: 0.64 * (1 - localT) + 0.96 * localT,
      g: 0.9 * (1 - localT) + 0.62 * localT,
      b: 0.21 * (1 - localT) + 0.04 * localT,
    };
  }
}
