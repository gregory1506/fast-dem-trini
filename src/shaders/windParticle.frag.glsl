// Fragment Shader for Wind Particles
// Renders short dashes with color based on wind speed and fade based on age

precision mediump float;

varying float v_speed;      // Wind speed from vertex shader
varying float v_age;        // Particle age from vertex shader (0=new, 1=old)
varying float v_angle;      // Wind direction from vertex shader

uniform float u_opacity;    // Overall layer opacity

// Maps wind speed to color (sky -> cyan -> mint -> green -> amber)
vec3 speedToColor(float speed) {
    // Normalize speed to 0-1 range (0-20 m/s)
    float t = clamp(speed / 20.0, 0.0, 1.0);

    vec3 color;

    if (t < 0.2) {
        float localT = t / 0.2;
        color = mix(vec3(0.49, 0.83, 0.99), vec3(0.22, 0.74, 0.97), localT);
    } else if (t < 0.4) {
        float localT = (t - 0.2) / 0.2;
        color = mix(vec3(0.22, 0.74, 0.97), vec3(0.13, 0.83, 0.93), localT);
    } else if (t < 0.6) {
        float localT = (t - 0.4) / 0.2;
        color = mix(vec3(0.13, 0.83, 0.93), vec3(0.13, 0.77, 0.37), localT);
    } else if (t < 0.8) {
        float localT = (t - 0.6) / 0.2;
        color = mix(vec3(0.13, 0.77, 0.37), vec3(0.64, 0.90, 0.21), localT);
    } else {
        float localT = (t - 0.8) / 0.2;
        color = mix(vec3(0.64, 0.90, 0.21), vec3(0.96, 0.62, 0.04), localT);
    }

    return color;
}

void main() {
    vec2 center = gl_PointCoord - vec2(0.5, 0.5);

    float c = cos(v_angle);
    float s = sin(v_angle);
    vec2 rotated = vec2(center.x * c + center.y * s, -center.x * s + center.y * c);

    float halfLength = mix(0.65, 0.95, smoothstep(0.0, 10.0, v_speed));
    float halfThickness = 0.03;

    float edgeX = smoothstep(halfLength, halfLength - 0.12, abs(rotated.x));
    float edgeY = smoothstep(halfThickness, halfThickness - 0.02, abs(rotated.y));
    float lineAlpha = edgeX * edgeY;

    if (lineAlpha <= 0.01) {
        discard;
    }

    float fadeIn = smoothstep(0.0, 0.2, v_age);
    float fadeOut = smoothstep(1.0, 0.8, v_age);
    float ageAlpha = fadeIn * fadeOut;
    float speedAlpha = mix(0.3, 0.9, smoothstep(0.0, 8.0, v_speed));

    float headBoost = smoothstep(halfLength * 0.5, halfLength, rotated.x);
    float tailFade = smoothstep(-halfLength, -halfLength * 0.15, rotated.x);

    vec3 baseColor = mix(vec3(0.92, 0.98, 1.0), speedToColor(v_speed), 0.45);
    vec3 airyColor = mix(baseColor, vec3(1.0, 1.0, 1.0), 0.25);
    float finalAlpha = lineAlpha * tailFade * mix(0.55, 1.0, headBoost) * ageAlpha * speedAlpha * u_opacity;

    gl_FragColor = vec4(airyColor, finalAlpha);
}
