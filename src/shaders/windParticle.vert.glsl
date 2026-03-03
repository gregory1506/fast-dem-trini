// Vertex Shader for Wind Particles
// Transforms particle positions from geographic coordinates to screen space

attribute vec2 a_position;  // Particle position (normalized Mercator 0..1)
attribute float a_speed;    // Wind speed at particle position (for color coding)
attribute float a_age;      // Particle age (0-1, for fading effect)
attribute float a_angle;    // Wind direction in radians

uniform mat4 u_matrix;      // MapLibre projection matrix
uniform float u_pointSize;  // Base particle size in pixels
uniform float u_pointSizeScale; // Speed-based size multiplier

varying float v_speed;      // Pass speed to fragment shader
varying float v_age;        // Pass age to fragment shader
varying float v_angle;      // Pass angle to fragment shader

void main() {
    // Transform geographic position to clip space using MapLibre's projection
    gl_Position = u_matrix * vec4(a_position, 0.0, 1.0);

    // Set point size (particle diameter in pixels), scaled by wind speed
    float speedSize = clamp(a_speed, 0.0, 12.0) * u_pointSizeScale;
    gl_PointSize = u_pointSize + speedSize;

    // Pass varyings to fragment shader
    v_speed = a_speed;
    v_age = a_age;
    v_angle = a_angle;
}
