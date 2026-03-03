# Wind Layer Debugging Guide for Browser-Based Claude Code

## Quick Start

1. **Open Browser DevTools** (F12)
2. **Toggle Wind Animation** layer ON
3. **Check Console** for these messages:
   - ✅ `WindLayer initialized successfully with 5000 particles`
   - ✅ `🌬️ Wind layer visibility set to: true`
   - ✅ `🌬️ Wind layer rendering: ...`

## If Particles Still Not Visible

### Step 1: Check WebGL State

Add this to `src/layers/WindLayer.ts` in the `render()` method (after line 148):

```typescript
// After gl.drawArrays(gl.POINTS, 0, particleCount);
const glError = gl.getError();
if (glError !== gl.NO_ERROR) {
  console.error('WebGL Error:', glError);
}

console.log('WebGL State Check:', {
  depthTest: gl.isEnabled(gl.DEPTH_TEST),
  stencilTest: gl.isEnabled(gl.STENCIL_TEST),
  blend: gl.isEnabled(gl.BLEND),
  cullFace: gl.isEnabled(gl.CULL_FACE),
  scissorTest: gl.isEnabled(gl.SCISSOR_TEST),
  viewport: gl.getParameter(gl.VIEWPORT),
  scissor: gl.getParameter(gl.SCISSOR_BOX),
  blendFunc: [
    gl.getParameter(gl.BLEND_SRC_ALPHA),
    gl.getParameter(gl.BLEND_DST_ALPHA)
  ]
});
```

**Expected State**:
- `depthTest: false`
- `stencilTest: false`
- `blend: true`
- `cullFace: false` (or doesn't matter for points)
- `scissorTest: false` (if true, check scissor box includes particles)
- `viewport: [0, 0, canvasWidth, canvasHeight]`

### Step 2: Test with Hardcoded Position

Replace the vertex shader temporarily to test if ANY particles can render:

```glsl
// src/shaders/windParticle.vert.glsl
void main() {
  // Ignore matrix, just draw at screen center
  gl_Position = vec4(0.0, 0.0, 0.0, 1.0);
  gl_PointSize = 100.0; // Huge size
  v_speed = a_speed;
  v_age = a_age;
}
```

If you see a single huge yellow dot in the center, the problem is coordinate transformation.
If still nothing, the problem is WebGL state or shader compilation.

### Step 3: Check Clip Space Coordinates

Add this to vertex shader to see where particles end up:

```glsl
void main() {
  gl_Position = u_matrix * vec4(a_position, 0.0, 1.0);

  // Log first particle position (slow, but useful)
  if (gl_VertexID == 0) {
    // Can't actually log from shader, but check with debugger
  }

  gl_PointSize = u_pointSize;
  v_speed = a_speed;
  v_age = a_age;
}
```

In JavaScript, log the matrix and positions:

```typescript
// In render(), before gl.drawArrays:
console.log('First particle tile coords:', [
  this.particleSystem.positionBuffer[0],
  this.particleSystem.positionBuffer[1]
]);
console.log('Matrix:', matrix);

// Manually compute clip space position
const pos = [
  this.particleSystem.positionBuffer[0],
  this.particleSystem.positionBuffer[1],
  0,
  1
];
const clipX = matrix[0] * pos[0] + matrix[4] * pos[1] + matrix[8] * pos[2] + matrix[12] * pos[3];
const clipY = matrix[1] * pos[0] + matrix[5] * pos[1] + matrix[9] * pos[2] + matrix[13] * pos[3];
const clipZ = matrix[2] * pos[0] + matrix[6] * pos[1] + matrix[10] * pos[2] + matrix[14] * pos[3];
const clipW = matrix[3] * pos[0] + matrix[7] * pos[1] + matrix[11] * pos[2] + matrix[15] * pos[3];

console.log('Computed clip space:', {
  x: clipX / clipW,
  y: clipY / clipW,
  z: clipZ / clipW,
  w: clipW
});
```

**Expected clip space**: x and y should be between -1 and +1 for visible particles.

### Step 4: Use Browser WebGL Inspector

**Option A: Spector.js**
1. Install [Spector.js Chrome Extension](https://chrome.google.com/webstore/detail/spectorjs/denbgaamihkadbghdceggmchnflmhpmk)
2. Click Spector icon → "Capture"
3. Look for `drawArrays(POINTS, 0, 5000)`
4. Check:
   - Are vertices being processed?
   - What's the output in framebuffer?
   - Are fragments being discarded?

**Option B: Chrome Built-in**
1. DevTools → Three dots → More tools → Rendering
2. Enable "Frame Rendering Stats"
3. Check if any pixels are being drawn

### Step 5: Check Z-Order / Layer Order

MapLibre might be rendering the wind layer UNDER other layers. Check layer order:

```typescript
// In App.tsx, after map.addLayer(windLayer);
console.log('All layers:', map.getStyle().layers.map(l => l.id));
```

Wind layer should be LAST (on top). If not, specify layer position:

```typescript
map.addLayer(windLayer, 'top-layer-id'); // Insert before this layer
```

Or move to top explicitly in WindLayer.ts:

```typescript
// Change renderingMode
renderingMode: '3d' as '3d', // Try 3d mode instead of 2d
```

### Step 6: Test Without MapLibre

Create a standalone test file to isolate the issue:

```html
<!-- test-particles.html -->
<!DOCTYPE html>
<html>
<head>
  <style>
    body { margin: 0; }
    canvas { width: 100%; height: 100vh; }
  </style>
</head>
<body>
  <canvas id="canvas"></canvas>
  <script>
    const canvas = document.getElementById('canvas');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    const gl = canvas.getContext('webgl');

    const vs = `
      attribute vec2 a_position;
      void main() {
        gl_Position = vec4(a_position, 0.0, 1.0);
        gl_PointSize = 30.0;
      }
    `;

    const fs = `
      precision mediump float;
      void main() {
        gl_FragColor = vec4(1.0, 1.0, 0.0, 1.0);
      }
    `;

    const vertShader = gl.createShader(gl.VERTEX_SHADER);
    gl.shaderSource(vertShader, vs);
    gl.compileShader(vertShader);

    const fragShader = gl.createShader(gl.FRAGMENT_SHADER);
    gl.shaderSource(fragShader, fs);
    gl.compileShader(fragShader);

    const program = gl.createProgram();
    gl.attachShader(program, vertShader);
    gl.attachShader(program, fragShader);
    gl.linkProgram(program);
    gl.useProgram(program);

    // Random positions in clip space (-1 to +1)
    const positions = new Float32Array(1000);
    for (let i = 0; i < 1000; i += 2) {
      positions[i] = Math.random() * 2 - 1;
      positions[i + 1] = Math.random() * 2 - 1;
    }

    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);

    const aPosition = gl.getAttribLocation(program, 'a_position');
    gl.enableVertexAttribArray(aPosition);
    gl.vertexAttribPointer(aPosition, 2, gl.FLOAT, false, 0, 0);

    gl.clearColor(0, 0, 0, 1);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.drawArrays(gl.POINTS, 0, 500);

    console.log('Test particles drawn. Should see yellow dots.');
  </script>
</body>
</html>
```

If this works, the issue is MapLibre integration. If this fails, it's a browser/WebGL issue.

## Common Fixes

### Fix 1: Force Clear Stencil Buffer

```typescript
// In render(), before drawing:
gl.clear(gl.STENCIL_BUFFER_BIT);
```

### Fix 2: Disable All Tests

```typescript
gl.disable(gl.DEPTH_TEST);
gl.disable(gl.STENCIL_TEST);
gl.disable(gl.SCISSOR_TEST);
gl.disable(gl.CULL_FACE);
```

### Fix 3: Change Blend Function

```typescript
// Try additive blending
gl.blendFunc(gl.SRC_ALPHA, gl.ONE);

// Or try pre-multiplied alpha
gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
```

### Fix 4: Force Re-render

```typescript
// In App.tsx, add continuous repainting when wind layer is visible:
useEffect(() => {
  if (!mapRef.current || !layers.wind) return;

  let animationId: number;
  const animate = () => {
    mapRef.current?.triggerRepaint();
    animationId = requestAnimationFrame(animate);
  };
  animate();

  return () => cancelAnimationFrame(animationId);
}, [layers.wind]);
```

## Success Indicators

✅ Yellow dots visible on map
✅ Dots moving (changing position over time)
✅ No WebGL errors in console
✅ Clip space coords between -1 and +1
✅ gl.drawArrays returns without error

## Last Resort

If nothing works, the issue might be MapLibre 5.x compatibility. Try:

1. Downgrade to MapLibre 4.x
2. Use a different rendering approach (Canvas 2D instead of WebGL)
3. Use MapLibre's built-in GeoJSON + circle layer with animation
4. Use existing library like [maplibre-gl-particle](https://github.com/Oseenix/maplibre-gl-particle)

## Reference: Working State

User confirmed seeing particles when:
- Color: `vec4(1.0, 0.0, 0.0, 1.0)` (red)
- Size: `20.0`
- Quote: "i see the red dots"

Then particles disappeared after changes. Need to identify exact regression point.
