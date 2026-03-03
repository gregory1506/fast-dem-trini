/**
 * Wind Particle System
 * Manages particle lifecycle, positions, and physics for wind visualization
 */

import maplibregl from 'maplibre-gl';
import type { WindDataService } from '../services/WindDataService';

interface Particle {
  lng: number;
  lat: number;
  age: number;
  speed: number;
  angle: number;
}

export class WindParticleSystem {
  private particles: Particle[];
  private particleCount: number;
  private maxAge: number = 220;
  private bounds = {
    north: 11.7,
    south: 9.7,
    east: -60.2,
    west: -62.4,
  };

  // Typed arrays for WebGL buffers
  public positionBuffer: Float32Array;
  public speedBuffer: Float32Array;
  public ageBuffer: Float32Array;
  public angleBuffer: Float32Array;

  constructor(particleCount: number) {
    this.particleCount = particleCount;
    this.particles = [];

    this.positionBuffer = new Float32Array(particleCount * 2);
    this.speedBuffer = new Float32Array(particleCount);
    this.ageBuffer = new Float32Array(particleCount);
    this.angleBuffer = new Float32Array(particleCount);

    this.initializeParticles();
  }

  private initializeParticles(): void {
    for (let i = 0; i < this.particleCount; i++) {
      this.particles[i] = this.createRandomParticle();
      this.updateBuffers(i);
    }
  }

  private createRandomParticle(): Particle {
    return {
      lng: this.bounds.west + Math.random() * (this.bounds.east - this.bounds.west),
      lat: this.bounds.south + Math.random() * (this.bounds.north - this.bounds.south),
      age: Math.random() * this.maxAge,
      speed: 0,
      angle: 0,
    };
  }

  update(windDataService: WindDataService): void {
    const timeStep = 0.0000825;
    const angleSmoothing = 0.08;

    for (let i = 0; i < this.particleCount; i++) {
      const particle = this.particles[i];

      const wind = windDataService.interpolateWind(particle.lng, particle.lat);

      particle.lng += wind.u * timeStep;
      particle.lat += wind.v * timeStep;

      particle.speed = Math.sqrt(wind.u * wind.u + wind.v * wind.v);
      const targetAngle = Math.atan2(wind.v, wind.u);
      particle.angle = this.lerpAngle(particle.angle, targetAngle, angleSmoothing);

      particle.age += 1;

      if (particle.age > this.maxAge) {
        this.respawnParticle(particle, true);
      } else if (this.isOutOfBounds(particle)) {
        this.wrapParticle(particle);
      }

      this.updateBuffers(i);
    }
  }

  private isOutOfBounds(particle: Particle): boolean {
    return (
      particle.lng < this.bounds.west ||
      particle.lng > this.bounds.east ||
      particle.lat < this.bounds.south ||
      particle.lat > this.bounds.north
    );
  }

  private respawnParticle(particle: Particle, randomizeAge: boolean = false): void {
    particle.lng = this.bounds.west + Math.random() * (this.bounds.east - this.bounds.west);
    particle.lat = this.bounds.south + Math.random() * (this.bounds.north - this.bounds.south);
    particle.age = randomizeAge ? Math.random() * this.maxAge * 0.6 : 0;
    particle.speed = 0;
    particle.angle = 0;
  }

  private wrapParticle(particle: Particle): void {
    if (particle.lng < this.bounds.west) particle.lng = this.bounds.east;
    if (particle.lng > this.bounds.east) particle.lng = this.bounds.west;
    if (particle.lat < this.bounds.south) particle.lat = this.bounds.north;
    if (particle.lat > this.bounds.north) particle.lat = this.bounds.south;
  }

  private lerpAngle(current: number, target: number, t: number): number {
    let delta = target - current;
    if (delta > Math.PI) delta -= Math.PI * 2;
    if (delta < -Math.PI) delta += Math.PI * 2;
    return current + delta * t;
  }

  private updateBuffers(index: number): void {
    const particle = this.particles[index];

    const mercatorCoord = maplibregl.MercatorCoordinate.fromLngLat(
      { lng: particle.lng, lat: particle.lat },
      0
    );

    this.positionBuffer[index * 2] = mercatorCoord.x;
    this.positionBuffer[index * 2 + 1] = mercatorCoord.y;
    this.speedBuffer[index] = particle.speed;
    this.ageBuffer[index] = particle.age / this.maxAge;
    this.angleBuffer[index] = particle.angle;
  }

  setBounds(bounds: { north: number; south: number; east: number; west: number }): void {
    this.bounds = bounds;
  }

  getParticleCount(): number {
    return this.particleCount;
  }

  reset(): void {
    this.initializeParticles();
  }
}
