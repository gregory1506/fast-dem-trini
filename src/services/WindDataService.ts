/**
 * Wind Data Service
 * Handles fetching, caching, and interpolation of wind data from Open-Meteo GFS API
 */

import type {
  WindDataConfig,
  WindGrid,
  WindGridPoint,
  OpenMeteoResponse,
  OpenMeteoMultiResponse,
} from './WindDataTypes';

export class WindDataService {
  private config: WindDataConfig;
  private cachedData: WindGrid | null = null;
  private cachedSeries: WindGrid[] | null = null;
  private fetchPromise: Promise<WindGrid[]> | null = null;

  constructor(config: WindDataConfig) {
    this.config = {
      ...config,
      gridRows: config.gridRows || 8,
      gridCols: config.gridCols || 8,
    };
  }

  /**
   * Fetches wind data from Open-Meteo GFS API
   * Returns cached data if available and fresh
   */
  async fetchWindData(): Promise<WindGrid> {
    // Return cached data if still fresh
    if (this.cachedData && this.isCacheFresh()) {
      console.log('Using cached wind data');
      return this.cachedData;
    }

    // If fetch is already in progress, return that promise
    if (this.fetchPromise) {
      await this.fetchPromise;
      if (this.cachedData) {
        return this.cachedData;
      }
      if (this.cachedSeries && this.cachedSeries[0]) {
        return this.cachedSeries[0];
      }
      return this.createTestWindGrid();
    }

    // Start new fetch
    this.fetchPromise = this.performSeriesFetch();

    try {
      const series = await this.fetchPromise;
      this.cachedSeries = series;
      this.cachedData = series[0] || this.createTestWindGrid();
      return this.cachedData;
    } finally {
      this.fetchPromise = null;
    }
  }

  /**
   * Fetches hourly wind data for multiple forecast hours
   * Returns cached series if available and fresh
   */
  async fetchWindSeries(): Promise<WindGrid[]> {
    if (this.cachedSeries && this.cachedSeries.length > 0 && this.isCacheFresh()) {
      return this.cachedSeries;
    }

    if (this.fetchPromise) {
      const series = await this.fetchPromise;
      this.cachedSeries = series;
      this.cachedData = series[0] || this.cachedData;
      return series;
    }

    this.fetchPromise = this.performSeriesFetch();

    try {
      const series = await this.fetchPromise;
      this.cachedSeries = series;
      this.cachedData = series[0] || this.createTestWindGrid();
      return series;
    } finally {
      this.fetchPromise = null;
    }
  }

  /**
   * Performs the actual API fetch and data processing for hourly series
   */
  private async performSeriesFetch(): Promise<WindGrid[]> {
    try {
      // Generate grid points for API request
      const { latitudes, longitudes } = this.generateGridPoints();

      // Build API URL
      const url = this.buildApiUrl(latitudes, longitudes);

      console.log('Fetching wind data from Open-Meteo...');
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status} ${response.statusText}`);
      }

      const data: OpenMeteoResponse | OpenMeteoMultiResponse = await response.json();
      const series = this.processHourlyResponse(data, latitudes, longitudes);

      if (series.length === 0) {
        const { speeds, directions } = this.normalizeApiResponse(data);

        console.log('Raw API response (current):', {
          totalPoints: latitudes.length,
          windDataPoints: speeds.length,
          sampleSpeed: speeds[0],
          sampleDirection: directions[0]
        });

        if (speeds.length === 0 || directions.length === 0) {
          console.warn('API returned no wind data, using test data for visualization');
          return [this.createTestWindGrid()];
        }

        const windGrid = this.processApiResponse(speeds, directions, latitudes, longitudes);
        console.log(`Wind data fetched successfully: ${windGrid.metadata.rows}x${windGrid.metadata.cols} grid`);
        const lastRow = windGrid.metadata.rows - 1;
        const lastCol = windGrid.metadata.cols - 1;
        console.log('Sample wind values:', {
          point00: windGrid.points[0][0],
          pointLast: windGrid.points[lastRow][lastCol]
        });

        return [windGrid];
      }

      const firstGrid = series[0];
      console.log(`Wind data fetched successfully: ${firstGrid.metadata.rows}x${firstGrid.metadata.cols} grid`);
      const lastRow = firstGrid.metadata.rows - 1;
      const lastCol = firstGrid.metadata.cols - 1;
      console.log('Sample wind values:', {
        point00: firstGrid.points[0][0],
        pointLast: firstGrid.points[lastRow][lastCol]
      });

      return series;
    } catch (error) {
      console.error('Failed to fetch wind data:', error);

      // If we have cached data, return it even if stale
      if (this.cachedData) {
        console.warn('Using stale cached data due to fetch error');
        return this.cachedSeries && this.cachedSeries.length > 0
          ? this.cachedSeries
          : [this.cachedData];
      }

      // Return test wind grid fallback for visualization
      console.warn('Using test wind grid due to fetch error');
      return [this.createTestWindGrid()];
    }
  }

  /**
   * Generates evenly-spaced grid points for API request
   * Creates matched lat/lng pairs for each grid point
   */
  private generateGridPoints(): { latitudes: number[]; longitudes: number[] } {
    const { bounds, gridRows = 8, gridCols = 8 } = this.config;

    const latitudes: number[] = [];
    const longitudes: number[] = [];

    // Generate grid points as matched pairs
    for (let row = 0; row < gridRows; row++) {
      const lat = bounds.north - (row / (gridRows - 1)) * (bounds.north - bounds.south);

      for (let col = 0; col < gridCols; col++) {
        const lng = bounds.west + (col / (gridCols - 1)) * (bounds.east - bounds.west);

        latitudes.push(Number(lat.toFixed(4)));
        longitudes.push(Number(lng.toFixed(4)));
      }
    }

    return { latitudes, longitudes };
  }

  /**
   * Builds the Open-Meteo API URL with all grid points
   */
  private buildApiUrl(latitudes: number[], longitudes: number[]): string {
    const baseUrl = 'https://api.open-meteo.com/v1/gfs';
    const forecastHours = this.config.forecastHours || 12;

    const params = new URLSearchParams({
      latitude: latitudes.join(','),
      longitude: longitudes.join(','),
      current: 'wind_speed_10m,wind_direction_10m',
      hourly: 'wind_speed_10m,wind_direction_10m',
      forecast_hours: String(forecastHours),
      timezone: 'UTC',
      wind_speed_unit: 'ms',
    });

    return `${baseUrl}?${params.toString()}`;
  }

  /**
   * Processes API response into WindGrid structure
   */
  private processApiResponse(
    speeds: number[],
    directions: number[],
    latitudes: number[],
    longitudes: number[],
    timestamp?: number,
    sourceOverride?: string
  ): WindGrid {
    const { gridRows = 8, gridCols = 8 } = this.config;
    const points: WindGridPoint[][] = [];

    // Organize data into 2D grid [row][col]
    for (let row = 0; row < gridRows; row++) {
      const rowPoints: WindGridPoint[] = [];

      for (let col = 0; col < gridCols; col++) {
        const index = row * gridCols + col;
        const lat = latitudes[index];
        const lng = longitudes[index];

        // Get wind data for this point (or use defaults if missing)
        const speed = speeds[index] ?? 0;
        const direction = directions[index] ?? 0;

        // Convert wind speed and direction to u/v components
        const { u, v } = this.windToUV(speed, direction);

        rowPoints.push({
          lng,
          lat,
          u,
          v,
          speed,
          direction,
        });
      }

      points.push(rowPoints);
    }

    return {
      points,
      metadata: {
        timestamp: timestamp ?? Date.now(),
        bounds: this.config.bounds,
        rows: gridRows,
        cols: gridCols,
        source: sourceOverride ?? 'Open-Meteo GFS',
      },
    };
  }

  /**
   * Normalizes Open-Meteo responses for single or multi-location requests
   */
  private normalizeApiResponse(
    data: OpenMeteoResponse | OpenMeteoMultiResponse
  ): { speeds: number[]; directions: number[] } {
    const locations = Array.isArray(data) ? data : [data];

    const speeds: number[] = [];
    const directions: number[] = [];

    for (const location of locations) {
      const speed = location.current?.wind_speed_10m;
      const direction = location.current?.wind_direction_10m;

      if (typeof speed === 'number' && typeof direction === 'number') {
        speeds.push(speed);
        directions.push(direction);
      }
    }

    return { speeds, directions };
  }

  /**
   * Builds a time series of wind grids from hourly Open-Meteo response
   */
  private processHourlyResponse(
    data: OpenMeteoResponse | OpenMeteoMultiResponse,
    latitudes: number[],
    longitudes: number[]
  ): WindGrid[] {
    const locations = Array.isArray(data) ? data : [data];
    const firstHourly = locations[0]?.hourly;

    if (!firstHourly?.time || firstHourly.time.length === 0) {
      return [];
    }

    const timeCount = firstHourly.time.length;
    const timeStamps: number[] = [];
    for (let t = 0; t < timeCount; t += 1) {
      const rawTime = firstHourly.time[t];
      const parsed = Date.parse(rawTime);
      timeStamps.push(Number.isFinite(parsed) ? parsed : Date.now() + t * 3600000);
    }

    const series: WindGrid[] = [];
    const source = 'Open-Meteo GFS (Hourly)';

    for (let t = 0; t < timeCount; t += 1) {
      const speeds: number[] = [];
      const directions: number[] = [];

      for (const location of locations) {
        const speed =
          location.hourly?.wind_speed_10m?.[t] ??
          location.current?.wind_speed_10m ??
          0;
        const direction =
          location.hourly?.wind_direction_10m?.[t] ??
          location.current?.wind_direction_10m ??
          0;

        speeds.push(speed);
        directions.push(direction);
      }

      series.push(
        this.processApiResponse(
          speeds,
          directions,
          latitudes,
          longitudes,
          timeStamps[t],
          source
        )
      );
    }

    return series;
  }

  /**
   * Converts wind speed and direction to U/V components
   * @param speed Wind speed in m/s
   * @param direction Wind direction in degrees (0-360, where 0 is North)
   * @returns {u, v} U (east-west) and V (north-south) components
   */
  private windToUV(speed: number, direction: number): { u: number; v: number } {
    // Convert meteorological direction to mathematical angle
    // Meteorological: 0° = from North, 90° = from East
    // Mathematical: 0° = East, 90° = North
    const angleRad = ((270 - direction) * Math.PI) / 180;

    return {
      u: speed * Math.cos(angleRad),
      v: speed * Math.sin(angleRad),
    };
  }

  /**
   * Creates test wind grid with realistic wind patterns for visualization
   */
  private createTestWindGrid(): WindGrid {
    const { gridRows = 8, gridCols = 8, bounds } = this.config;
    const points: WindGridPoint[][] = [];

    for (let row = 0; row < gridRows; row++) {
      const rowPoints: WindGridPoint[] = [];
      const lat = bounds.north - (row / (gridRows - 1)) * (bounds.north - bounds.south);

      for (let col = 0; col < gridCols; col++) {
        const lng = bounds.west + (col / (gridCols - 1)) * (bounds.east - bounds.west);

        // Create realistic east-to-west trade wind pattern for Caribbean
        // Trade winds blow from east to west at ~5-8 m/s
        const baseSpeed = 6; // m/s
        const variation = Math.sin(row * 0.5) * 2; // Add some variation
        const speed = baseSpeed + variation;

        // Wind from east (270 degrees in meteorological convention)
        const direction = 90; // From East
        const { u, v } = this.windToUV(speed, direction);

        rowPoints.push({
          lng,
          lat,
          u,
          v,
          speed,
          direction,
        });
      }
      points.push(rowPoints);
    }

    return {
      points,
      metadata: {
        timestamp: Date.now(),
        bounds,
        rows: gridRows,
        cols: gridCols,
        source: 'Test Wind Data (East Trade Winds)',
      },
    };
  }

  /**
   * Creates a zero-wind fallback grid (used when API fails and no cache)
   */
  /**
   * Checks if cached data is still fresh
   */
  private isCacheFresh(): boolean {
    if (!this.cachedData) return false;

    const age = Date.now() - this.cachedData.metadata.timestamp;
    return age < this.config.cacheDuration;
  }

  /**
   * Gets cached wind data (may be stale or null)
   */
  getCachedData(): WindGrid | null {
    return this.cachedData;
  }

  /**
   * Interpolates wind vector at a specific geographic point
   * Uses bilinear interpolation between grid points
   */
  interpolateWind(lng: number, lat: number): { u: number; v: number } {
    if (!this.cachedData) {
      return { u: 0, v: 0 };
    }

    return this.interpolateFromGrid(this.cachedData, lng, lat);
  }

  /**
   * Interpolates wind vector at a specific time index (hourly series)
   */
  interpolateWindAtTime(lng: number, lat: number, timeIndex: number): { u: number; v: number } {
    if (this.cachedSeries && this.cachedSeries.length > 0) {
      const clampedIndex = Math.max(0, Math.min(this.cachedSeries.length - 1, timeIndex));
      return this.interpolateFromGrid(this.cachedSeries[clampedIndex], lng, lat);
    }

    return this.interpolateWind(lng, lat);
  }

  /**
   * Returns cached hourly series (if available)
   */
  getTimeSeries(): WindGrid[] | null {
    return this.cachedSeries;
  }

  getTimeSeriesLength(): number {
    return this.cachedSeries ? this.cachedSeries.length : 0;
  }

  private interpolateFromGrid(grid: WindGrid, lng: number, lat: number): { u: number; v: number } {
    const { points, metadata } = grid;
    const { bounds, rows, cols } = metadata;

    // Check if point is within bounds
    if (lng < bounds.west || lng > bounds.east || lat < bounds.south || lat > bounds.north) {
      return { u: 0, v: 0 };
    }

    // Find grid cell containing this point
    const latNorm = (bounds.north - lat) / (bounds.north - bounds.south);
    const lngNorm = (lng - bounds.west) / (bounds.east - bounds.west);

    const row = latNorm * (rows - 1);
    const col = lngNorm * (cols - 1);

    const row0 = Math.floor(row);
    const col0 = Math.floor(col);
    const row1 = Math.min(row0 + 1, rows - 1);
    const col1 = Math.min(col0 + 1, cols - 1);

    // Get the four surrounding grid points
    const p00 = points[row0][col0];
    const p01 = points[row0][col1];
    const p10 = points[row1][col0];
    const p11 = points[row1][col1];

    // Bilinear interpolation weights
    const dy = row - row0;
    const dx = col - col0;

    // Interpolate U component
    const u =
      p00.u * (1 - dx) * (1 - dy) +
      p01.u * dx * (1 - dy) +
      p10.u * (1 - dx) * dy +
      p11.u * dx * dy;

    // Interpolate V component
    const v =
      p00.v * (1 - dx) * (1 - dy) +
      p01.v * dx * (1 - dy) +
      p10.v * (1 - dx) * dy +
      p11.v * dx * dy;

    return { u, v };
  }

  /**
   * Forces a refresh of wind data (ignores cache)
   */
  async refresh(): Promise<WindGrid> {
    this.cachedData = null;
    this.cachedSeries = null;
    return this.fetchWindData();
  }
}
