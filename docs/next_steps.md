# Next Steps: Smoother Wind + Trails

## Goal 1: Reduce Jerky Motion
1. **Use delta time** instead of a fixed timestep so motion is consistent across frame rates.
2. **Clamp max delta** (e.g., 16–32 ms) to avoid large jumps when the tab regains focus.
3. **Scale velocity by zoom** so motion feels stable across zoom levels.
4. **Substep integration** when wind speed is high (e.g., 2–4 smaller steps per frame).

## Goal 2: Add Trails (Deck.gl Trips-like)
Two viable approaches:

### Option A: GPU Trail Buffer (preferred)
- Create an offscreen framebuffer (FBO) with a texture the size of the canvas.
- Each frame:
  1. Render a fullscreen quad that slightly fades the previous frame (e.g., multiply alpha by 0.92).
  2. Render the new particle points on top with additive or alpha blending.
  3. Blit the FBO texture to the screen.
- This creates smooth persistent trails without storing per-particle history.

### Option B: CPU Line Segments
- Store a short history (e.g., last 10–20 positions) per particle.
- Build a dynamic vertex buffer of line strips each frame.
- Render lines with a gradient alpha along the strip.
- This is simpler to reason about but more CPU/GPU bandwidth heavy.

## Suggested Order
1. Implement delta time + zoom scaling in `WindParticleSystem.update()`.
2. Validate smoothness at different FPS and zooms.
3. Choose trail approach (A or B).
4. Implement trail rendering and tune fade/blend.

## Tuning Targets
- Default point size: 4–6 px
- Trail fade factor (Option A): 0.90–0.97
- Max dt clamp: 0.032 s
- Speed scale: start with 0.6–1.0 and iterate
