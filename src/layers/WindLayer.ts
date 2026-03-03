/**
 * Wind Layer
 * Custom MapLibre GL layer for rendering animated wind particles
 */

import maplibregl from 'maplibre-gl';
import type { WindDataService } from '../services/WindDataService';
import { WindParticleSystem } from '../utils/windParticleSystem';
import vertexShaderSource from '../shaders/windParticle.vert.glsl?raw';
import fragmentShaderSource from '../shaders/windParticle.frag.glsl?raw';

export class WindLayer implements maplibregl.CustomLayerInterface {
  id: string;
  type: 'custom' = 'custom';
  renderingMode: '2d' = '2d';

  private map: maplibregl.Map | null = null;
  private windDataService: WindDataService;
  private particleSystem: WindParticleSystem;
  private visible: boolean = true;
  private hasLoggedRender: boolean = false;

  private program: WebGLProgram | null = null;
  private positionBuffer: WebGLBuffer | null = null;
  private speedBuffer: WebGLBuffer | null = null;
  private ageBuffer: WebGLBuffer | null = null;
  private angleBuffer: WebGLBuffer | null = null;

  private aPosition: number = -1;
  private aSpeed: number = -1;
  private aAge: number = -1;
  private aAngle: number = -1;
  private uMatrix: WebGLUniformLocation | null = null;
  private uPointSize: WebGLUniformLocation | null = null;
  private uPointSizeScale: WebGLUniformLocation | null = null;
  private uOpacity: WebGLUniformLocation | null = null;

  constructor(id: string, windDataService: WindDataService) {
    this.id = id;
    this.windDataService = windDataService;
    this.particleSystem = new WindParticleSystem(875);
  }

  onAdd(map: maplibregl.Map, gl: WebGLRenderingContext | WebGL2RenderingContext): void {
    this.map = map;
    const glContext = gl as WebGLRenderingContext;

    const vertexShader = this.compileShader(glContext, glContext.VERTEX_SHADER, vertexShaderSource);
    const fragmentShader = this.compileShader(glContext, glContext.FRAGMENT_SHADER, fragmentShaderSource);

    if (!vertexShader || !fragmentShader) {
      console.error('Failed to compile shaders for WindLayer');
      return;
    }

    this.program = glContext.createProgram();
    if (!this.program) {
      console.error('Failed to create WebGL program');
      return;
    }

    glContext.attachShader(this.program, vertexShader);
    glContext.attachShader(this.program, fragmentShader);
    glContext.linkProgram(this.program);

    if (!glContext.getProgramParameter(this.program, glContext.LINK_STATUS)) {
      console.error('Failed to link program:', glContext.getProgramInfoLog(this.program));
      return;
    }

    this.aPosition = glContext.getAttribLocation(this.program, 'a_position');
    this.aSpeed = glContext.getAttribLocation(this.program, 'a_speed');
    this.aAge = glContext.getAttribLocation(this.program, 'a_age');
    this.aAngle = glContext.getAttribLocation(this.program, 'a_angle');
    this.uMatrix = glContext.getUniformLocation(this.program, 'u_matrix');
    this.uPointSize = glContext.getUniformLocation(this.program, 'u_pointSize');
    this.uPointSizeScale = glContext.getUniformLocation(this.program, 'u_pointSizeScale');
    this.uOpacity = glContext.getUniformLocation(this.program, 'u_opacity');

    this.positionBuffer = glContext.createBuffer();
    this.speedBuffer = glContext.createBuffer();
    this.ageBuffer = glContext.createBuffer();
    this.angleBuffer = glContext.createBuffer();

    this.updateGLBuffers(glContext);

    console.log('WindLayer initialized successfully with', this.particleSystem.getParticleCount(), 'particles');
  }

  prerender(gl: WebGLRenderingContext | WebGL2RenderingContext): void {
    if (!this.visible) return;
    this.particleSystem.update(this.windDataService);
    this.updateGLBuffers(gl as WebGLRenderingContext);
  }

  render(gl: WebGLRenderingContext | WebGL2RenderingContext, options: any): void {
    if (!this.visible || !this.program) return;

    const projectionData = options.defaultProjectionData;
    if (!projectionData || !projectionData.mainMatrix) {
      console.error('No projection data provided to render');
      return;
    }

    const matrix = projectionData.mainMatrix instanceof Float32Array
      ? projectionData.mainMatrix
      : new Float32Array(projectionData.mainMatrix);

    gl.useProgram(this.program);

    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    gl.disable(gl.DEPTH_TEST);
    gl.disable(gl.STENCIL_TEST);

    if (this.uMatrix) {
      gl.uniformMatrix4fv(this.uMatrix, false, matrix);
    }
    if (this.uPointSize) {
      gl.uniform1f(this.uPointSize, 18.0);
    }
    if (this.uPointSizeScale) {
      gl.uniform1f(this.uPointSizeScale, 1.5);
    }
    if (this.uOpacity) {
      gl.uniform1f(this.uOpacity, 1.0);
    }

    if (this.positionBuffer && this.aPosition >= 0) {
      gl.bindBuffer(gl.ARRAY_BUFFER, this.positionBuffer);
      gl.enableVertexAttribArray(this.aPosition);
      gl.vertexAttribPointer(this.aPosition, 2, gl.FLOAT, false, 0, 0);
    }
    if (this.speedBuffer && this.aSpeed >= 0) {
      gl.bindBuffer(gl.ARRAY_BUFFER, this.speedBuffer);
      gl.enableVertexAttribArray(this.aSpeed);
      gl.vertexAttribPointer(this.aSpeed, 1, gl.FLOAT, false, 0, 0);
    }
    if (this.ageBuffer && this.aAge >= 0) {
      gl.bindBuffer(gl.ARRAY_BUFFER, this.ageBuffer);
      gl.enableVertexAttribArray(this.aAge);
      gl.vertexAttribPointer(this.aAge, 1, gl.FLOAT, false, 0, 0);
    }
    if (this.angleBuffer && this.aAngle >= 0) {
      gl.bindBuffer(gl.ARRAY_BUFFER, this.angleBuffer);
      gl.enableVertexAttribArray(this.aAngle);
      gl.vertexAttribPointer(this.aAngle, 1, gl.FLOAT, false, 0, 0);
    }

    const particleCount = this.particleSystem.getParticleCount();
    gl.drawArrays(gl.POINTS, 0, particleCount);

    if (!this.hasLoggedRender) {
      this.hasLoggedRender = true;
      console.log('🌬️ Wind layer rendering:', {
        particleCount,
        visible: this.visible,
        samplePositions: [
          this.particleSystem.positionBuffer[0],
          this.particleSystem.positionBuffer[1]
        ],
        sampleSpeeds: [
          this.particleSystem.speedBuffer[0],
          this.particleSystem.speedBuffer[1],
          this.particleSystem.speedBuffer[2]
        ],
        sampleAges: [
          this.particleSystem.ageBuffer[0],
          this.particleSystem.ageBuffer[1]
        ]
      });
    }

    if (this.aPosition >= 0) gl.disableVertexAttribArray(this.aPosition);
    if (this.aSpeed >= 0) gl.disableVertexAttribArray(this.aSpeed);
    if (this.aAge >= 0) gl.disableVertexAttribArray(this.aAge);
    if (this.aAngle >= 0) gl.disableVertexAttribArray(this.aAngle);
  }

  onRemove(_map: maplibregl.Map, gl: WebGLRenderingContext | WebGL2RenderingContext): void {
    if (this.program) {
      gl.deleteProgram(this.program);
      this.program = null;
    }
    if (this.positionBuffer) {
      gl.deleteBuffer(this.positionBuffer);
      this.positionBuffer = null;
    }
    if (this.speedBuffer) {
      gl.deleteBuffer(this.speedBuffer);
      this.speedBuffer = null;
    }
    if (this.ageBuffer) {
      gl.deleteBuffer(this.ageBuffer);
      this.ageBuffer = null;
    }
    if (this.angleBuffer) {
      gl.deleteBuffer(this.angleBuffer);
      this.angleBuffer = null;
    }

    console.log('WindLayer removed and resources cleaned up');
  }

  private compileShader(
    gl: WebGLRenderingContext,
    type: number,
    source: string
  ): WebGLShader | null {
    const shader = gl.createShader(type);
    if (!shader) {
      console.error('Failed to create shader');
      return null;
    }

    gl.shaderSource(shader, source);
    gl.compileShader(shader);

    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      console.error('Shader compilation error:', gl.getShaderInfoLog(shader));
      gl.deleteShader(shader);
      return null;
    }

    return shader;
  }

  private updateGLBuffers(gl: WebGLRenderingContext): void {
    if (this.positionBuffer) {
      gl.bindBuffer(gl.ARRAY_BUFFER, this.positionBuffer);
      gl.bufferData(gl.ARRAY_BUFFER, this.particleSystem.positionBuffer, gl.DYNAMIC_DRAW);
    }
    if (this.speedBuffer) {
      gl.bindBuffer(gl.ARRAY_BUFFER, this.speedBuffer);
      gl.bufferData(gl.ARRAY_BUFFER, this.particleSystem.speedBuffer, gl.DYNAMIC_DRAW);
    }
    if (this.ageBuffer) {
      gl.bindBuffer(gl.ARRAY_BUFFER, this.ageBuffer);
      gl.bufferData(gl.ARRAY_BUFFER, this.particleSystem.ageBuffer, gl.DYNAMIC_DRAW);
    }
    if (this.angleBuffer) {
      gl.bindBuffer(gl.ARRAY_BUFFER, this.angleBuffer);
      gl.bufferData(gl.ARRAY_BUFFER, this.particleSystem.angleBuffer, gl.DYNAMIC_DRAW);
    }
  }

  setVisibility(visible: boolean): void {
    this.visible = visible;
    console.log(`🌬️ Wind layer visibility set to: ${visible}`);
    if (visible && this.map) {
      this.hasLoggedRender = false;
    }
  }

  getVisibility(): boolean {
    return this.visible;
  }
}
