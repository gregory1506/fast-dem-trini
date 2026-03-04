# Wind Layer Implementation Status

## Current State: REAL DATA + VISIBLE

### What's Working ✅
- Wind layer initializes successfully (5000 particles)
- Wind data service loads real Open-Meteo GFS data (multi-location)
- WebGL shaders compile and link without errors
- Particles are being rendered (`gl.drawArrays` is called)
- Coordinate transformation is correct (normalized Mercator coords in Trinidad region: ~0.33, ~0.47)
- Layer visibility toggles correctly
- Wind speeds are calculated correctly (real data ~8-10 m/s observed)

### The Problem ❌
**Wind motion looks jerky and lacks trails**

Console shows:
```
🌬️ Wind layer rendering:
  particleCount: 5000
  visible: true
  samplePositions: [0.3307, 0.4698]
  sampleSpeeds: [7.987046546173896, 7.908062934075488, 6.210169639...]
```

Particles are visible now, but motion is not smooth and there are no trailing paths.

### Possible Root Causes

1. **Fixed timestep**: Movement uses a constant step per frame instead of delta time
2. **Velocity scaling**: Wind u/v may be too high relative to frame rate and zoom
3. **No temporal accumulation**: Every frame is a fresh draw (no trail persistence)

### Next Steps (Requires Browser DevTools)

1. **Check WebGL State**:
   ```javascript
   // In render() method, log GL state:
   console.log('GL State:', {
     depthTest: gl.isEnabled(gl.DEPTH_TEST),
     stencilTest: gl.isEnabled(gl.STENCIL_TEST),
     blend: gl.isEnabled(gl.BLEND),
     cullFace: gl.isEnabled(gl.CULL_FACE),
     scissorTest: gl.isEnabled(gl.SCISSOR_TEST),
     viewport: gl.getParameter(gl.VIEWPORT),
     scissor: gl.getParameter(gl.SCISSOR_BOX)
   });
   ```

2. **Check Shader Output**:
   - Add console.log in vertex shader with gl_Position values
   - Check if positions are in clip space (-1 to +1)

3. **Test with Simplest Shader**:
   ```glsl
   // Vertex shader - fixed position test
   void main() {
     gl_Position = vec4(0.0, 0.0, 0.0, 1.0); // Center of screen
     gl_PointSize = 50.0;
   }

   // Fragment shader
   void main() {
     gl_FragColor = vec4(1.0, 0.0, 0.0, 1.0); // Solid red
   }
   ```

4. **Use Chrome WebGL Inspector**:
   - Install Spector.js extension
   - Capture frame and inspect draw calls
   - Check if particles are actually being rasterized

## File Locations

### Core Implementation
- **Wind Layer**: `src/layers/WindLayer.ts`
- **Particle System**: `src/utils/windParticleSystem.ts`
- **Wind Data Service**: `src/services/WindDataService.ts`
- **Vertex Shader**: `src/shaders/windParticle.vert.glsl`
- **Fragment Shader**: `src/shaders/windParticle.frag.glsl`
- **App Integration**: `src/App.tsx` (lines 159-178, 191-197, 235-239)

### Current Shader Configuration

**Vertex Shader** (`windParticle.vert.glsl`):
```glsl
attribute vec2 a_position;  // Normalized Mercator [0-1]
uniform mat4 u_matrix;      // MapLibre's mainMatrix
uniform float u_pointSize;  // Currently: 6.0
void main() {
  gl_Position = u_matrix * vec4(a_position, 0.0, 1.0);
  gl_PointSize = u_pointSize;
  v_speed = a_speed;
  v_age = a_age;
}
```

**Fragment Shader** (`windParticle.frag.glsl`):
```glsl
void main() {
  vec2 center = gl_PointCoord - vec2(0.5, 0.5);
  float dist = length(center);
  if (dist > 0.5) discard;

  vec3 color = speedToColor(v_speed);
  float finalAlpha = radialAlpha * ageAlpha * u_opacity * 0.95;
  gl_FragColor = vec4(color, finalAlpha);
}
```

## Test Wind Data

Using simulated Caribbean trade winds:
- **Direction**: From East (90°)
- **Speed**: 6 m/s base ± 2 m/s variation
- **Grid**: 8×8 points covering Trinidad (10.0-11.0°N, -62.0 to -60.5°E)

## Known Working Examples

The coordinate transformation was verified with:
- Trinidad center: lng=-61.2225, lat=10.4578
- Converts to Mercator: x=0.3307, y=0.4698 ✓

## Commands for CLI Debugging

```bash
# Start dev server (already running on localhost:5174)
npm run dev

# Check for WebGL errors in browser console
# Look for gl.getError() != gl.NO_ERROR

# Test coordinate transformation
node -e "
const lng = -61.2225;
const lat = 10.4578;
const x = (lng + 180) / 360;
const latRad = lat * Math.PI / 180;
const y = (1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2;
console.log('Normalized:', {x, y});
console.log('Normalized:', {x, y});
"
```

## Debugging Checklist

- [ ] Check WebGL context state (viewport, scissor, depth, stencil)
- [ ] Verify shader uniforms are set correctly
- [ ] Test with fixed hardcoded vertex positions (0, 0, 0, 1)
- [ ] Capture WebGL frame with Spector.js
- [ ] Check gl.getError() after each GL call
- [ ] Verify particles aren't behind other layers (z-order)
- [ ] Test without MapLibre (standalone WebGL context)
- [ ] Check if particles render in WebGL inspector but not on canvas

## Contact Points for Further Investigation

Last successful state: Red dots visible when:
- Using bright red color (1.0, 0.0, 0.0, 1.0)
- 20px particle size
- Depth test disabled
- Using `defaultProjectionData.mainMatrix`
- Normalized Mercator coordinates (no EXTENT scaling)

User confirmed seeing "i see the red dots" before switching to production colors.

**Critical regression**: Particles stopped being visible after restoring speed-based colors and reducing size to 5-8px. Even reverting to bright yellow 30px didn't restore visibility.
