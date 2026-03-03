/**
 * Wind Data Types
 * Type definitions for wind data structures used in the wind animation layer
 */

/**
 * Represents wind data at a specific geographic point
 */
export interface WindGridPoint {
  /** Longitude in degrees */
  lng: number;
  /** Latitude in degrees */
  lat: number;
  /** U-component of wind (east-west direction) in m/s. Positive = eastward */
  u: number;
  /** V-component of wind (north-south direction) in m/s. Positive = northward */
  v: number;
  /** Wind speed in m/s (calculated from u and v components) */
  speed: number;
  /** Wind direction in degrees (0-360, where 0 is North) */
  direction: number;
}

/**
 * Represents a 2D grid of wind data points covering a geographic area
 */
export interface WindGrid {
  /** 2D array of wind points organized as [row][column] where row is latitude */
  points: WindGridPoint[][];
  /** Metadata about the wind grid */
  metadata: {
    /** Timestamp when this data was fetched */
    timestamp: number;
    /** Geographic bounds of the grid */
    bounds: {
      north: number;
      south: number;
      east: number;
      west: number;
    };
    /** Number of grid rows (latitude divisions) */
    rows: number;
    /** Number of grid columns (longitude divisions) */
    cols: number;
    /** Data source identifier */
    source: string;
  };
}

/**
 * Configuration for the Wind Data Service
 */
export interface WindDataConfig {
  /** Geographic bounds for wind data coverage */
  bounds: {
    north: number;
    south: number;
    east: number;
    west: number;
  };
  /** Cache duration in milliseconds (default: 1 hour) */
  cacheDuration: number;
  /** Number of particles to render */
  particleCount: number;
  /** Number of grid rows for interpolation (default: 20) */
  gridRows?: number;
  /** Number of grid columns for interpolation (default: 20) */
  gridCols?: number;
  /** Number of forecast hours to request for hourly data (default: 12) */
  forecastHours?: number;
}

/**
 * Response structure from Open-Meteo GFS API
 */
export interface OpenMeteoResponse {
  latitude: number;
  longitude: number;
  current?: {
    time: string;
    wind_speed_10m: number;
    wind_direction_10m: number;
  };
  hourly?: {
    time: string[];
    wind_speed_10m: number[];
    wind_direction_10m: number[];
  };
  hourly_units?: {
    time?: string;
    wind_speed_10m?: string;
    wind_direction_10m?: string;
  };
}

export type OpenMeteoMultiResponse = OpenMeteoResponse[];
